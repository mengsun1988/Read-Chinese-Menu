import React, { useState, useRef, useEffect } from 'react';
import { AppStatus, Dish, UserUsage, RecognitionMode, StoreResult, Ingredient } from './types';
import { processMenuImage, processStorefrontImage } from './services/geminiService';
import { DishCard } from './components/DishCard';
import { LoadingScreen } from './components/LoadingScreen';
import { CameraIcon, WarningIcon } from './components/Icons';
import { DishDetailModal } from './components/DishDetailModal';
import { WaiterCard } from './components/WaiterCard';
import { AboutUs } from './components/AboutUs';
import { Reviews } from './components/Reviews';
import { PricingModule } from './components/PricingModule';
import { SupportSection } from './components/SupportSection';
import { A2HSManager } from './components/A2HSManager';
import { StoreCard } from './components/StoreCard';
import { StaffHelperModal } from './components/StaffHelperModal';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModals';

const STORAGE_KEY = 'rmc_user_usage_v3';

const getBeijingDate = () => {
  const d = new Date();
  const beijingTime = new Date(d.getTime() + (8 * 60 * 60 * 1000));
  return beijingTime.toISOString().split('T')[0];
};

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [mode, setMode] = useState<RecognitionMode>(RecognitionMode.MENU);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [storeResult, setStoreResult] = useState<StoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showStaffHelper, setShowStaffHelper] = useState(false);
  const [legalView, setLegalView] = useState<'privacy' | 'tos' | null>(null);

  const [usage, setUsage] = useState<UserUsage>(() => {
    const todayStr = getBeijingDate();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserUsage;
        return parsed.lastResetDate !== todayStr 
          ? { ...parsed, freeCredits: 15, lastResetDate: todayStr } 
          : parsed;
      }
    } catch (e) { console.warn(e); }
    return { freeCredits: 15, paidCredits: 0, lastResetDate: todayStr };
  });

  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [waiterContext, setWaiterContext] = useState<{ type: 'ingredient' | 'spiciness'; content_en: string; content_cn: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  }, [usage]);

  // PayPal 安全加载逻辑
  useEffect(() => {
    if (!showPricing) return;
    const scriptId = 'paypal-sdk';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://www.paypal.com/sdk/js?client-id=AdY7cjJGhxSVjZOPZr-LoHhX8JHtyQfNjmr6I8HjO4cv3cqW_U2zr1hpxa67nU8o4i6GoH0sFIh0P1aS&currency=USD`;
    script.async = true;
    script.onerror = () => console.warn("PayPal SDK failed to load. Checkout might be unavailable.");
    document.body.appendChild(script);
  }, [showPricing]);

  const totalCredits = (usage.freeCredits || 0) + (usage.paidCredits || 0);
  const isUnlimited = () => usage.passExpiryDate ? new Date(usage.passExpiryDate).getTime() > Date.now() : false;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isUnlimited() && totalCredits <= 0) { setShowPricing(true); return; }

    setStatus(AppStatus.LOADING);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        if (mode === RecognitionMode.MENU) {
          const result = await processMenuImage(base64);
          setDishes(result || []); // 确保始终是数组
        } else {
          const result = await processStorefrontImage(base64);
          setStoreResult(result);
        }

        if (!isUnlimited()) {
          setUsage(prev => ({
            ...prev,
            paidCredits: prev.paidCredits > 0 ? prev.paidCredits - 1 : 0,
            freeCredits: prev.paidCredits <= 0 ? Math.max(0, prev.freeCredits - 1) : prev.freeCredits
          }));
        }
        setStatus(AppStatus.SUCCESS);
      } catch (err: any) {
        setError("Failed to analyze image. Please try again.");
        setStatus(AppStatus.ERROR);
      }
    };
    reader.readAsDataURL(file);
  };

  const reset = () => { setStatus(AppStatus.IDLE); setDishes([]); setStoreResult(null); setPreviewUrl(null); };

  return (
    <div className="min-h-screen selection:bg-rose-600 selection:text-white pb-0 overflow-x-hidden">
      <A2HSManager />
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        {/* Credits Badge */}
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-2xl">
          <div className={`w-2.5 h-2.5 rounded-full ${isUnlimited() ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
          <span className="text-[10px] font-semibold uppercase text-slate-900">
            {isUnlimited() ? `Unlimited Access` : `Credits: ${totalCredits}`}
          </span>
        </div>

        <header className="mb-16 text-center">
          <h1 className="text-5xl md:text-7xl font-semibold text-slate-900 tracking-tighter">
            Read <span className="text-rose-600">Chinese Menu</span>
          </h1>
          <p className="mt-4 text-slate-500 font-medium uppercase tracking-widest">Global Explorer Edition</p>
        </header>

        <main className="mb-20">
          {status === AppStatus.IDLE && (
            <div className="modern-card p-12 md:p-20 text-center flex flex-col items-center shadow-xl">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              <div className="flex justify-center mb-8 bg-slate-100 p-1.5 rounded-2xl gap-1">
                <button onClick={() => setMode(RecognitionMode.MENU)} className={`px-6 py-2 rounded-xl text-xs font-bold ${mode === RecognitionMode.MENU ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>SCAN MENU</button>
                <button onClick={() => setMode(RecognitionMode.STREET)} className={`px-6 py-2 rounded-xl text-xs font-bold ${mode === RecognitionMode.STREET ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'}`}>SCAN SHOP</button>
              </div>
              <button onClick={() => fileInputRef.current?.click()} className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-10 shadow-2xl ${mode === RecognitionMode.MENU ? 'bg-rose-600' : 'bg-slate-900'}`}>
                <CameraIcon className="w-12 h-12 text-white" />
              </button>
              <h2 className="text-3xl font-semibold text-slate-900">Ready to Translate?</h2>
              <button onClick={() => fileInputRef.current?.click()} className="w-full max-w-xs bg-slate-900 text-white font-semibold py-5 rounded-full mt-8">Upload Photo</button>
            </div>
          )}

          {status === AppStatus.LOADING && <LoadingScreen />}

          {status === AppStatus.SUCCESS && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl sticky top-6 z-20">
                <div className="flex items-center gap-6 text-white text-left">
                  {previewUrl && <img src={previewUrl} className="w-20 h-20 object-cover rounded-2xl border-2 border-white/10" alt="Preview" />}
                  <div>
                    <h3 className="font-semibold text-2xl">{mode === RecognitionMode.MENU ? "Analyzed Dishes" : "Store Info"}</h3>
                    <p className="text-sm text-rose-400">{mode === RecognitionMode.MENU ? `${dishes?.length || 0} items found` : 'Shop identified'}</p>
                  </div>
                </div>
                <button onClick={reset} className="bg-white text-slate-900 font-semibold py-4 px-10 rounded-full">New Scan</button>
              </div>
              {mode === RecognitionMode.MENU ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* ✨ 渲染层防御：使用可选链 */}
                  {dishes?.map((dish, index) => (
                    <DishCard key={dish.id || index} dish={dish} onClick={() => setSelectedDish(dish)} />
                  ))}
                </div>
              ) : (
                storeResult && <StoreCard store={storeResult} onShowStaff={() => setShowStaffHelper(true)} />
              )}
            </div>
          )}

          {status === AppStatus.ERROR && (
            <div className="text-center p-20 modern-card border-rose-100 border-2">
              <WarningIcon className="w-16 h-16 text-rose-600 mx-auto mb-6" />
              <h2 className="text-3xl font-semibold mb-4">Oops!</h2>
              <p className="text-slate-500 mb-8">{error}</p>
              <button onClick={reset} className="bg-rose-600 text-white px-12 py-4 rounded-full font-bold">Try Again</button>
            </div>
          )}
        </main>
        
        {status === AppStatus.IDLE && (
          <div className="space-y-20">
            <PricingModule onPurchase={(p) => console.log(p)} />
            <AboutUs />
          </div>
        )}
      </div>

      <Footer
        onMenuScan={() => { setMode(RecognitionMode.MENU); reset(); }}
        onStreetScan={() => { setMode(RecognitionMode.STREET); reset(); }}
        onPricing={() => setShowPricing(true)}
        onPrivacy={() => setLegalView('privacy')}
        onTos={() => setLegalView('tos')}
      />

      {selectedDish && (
        <DishDetailModal 
          dish={selectedDish} 
          onClose={() => setSelectedDish(null)}
          onIngredientClick={(ing) => setWaiterContext({ type: 'ingredient', content_en: ing.name_en, content_cn: ing.name_cn })}
          onSpicyClick={() => setWaiterContext({ type: 'spiciness', content_en: 'Spiciness', content_cn: '辣度' })}
        />
      )}
      {waiterContext && <WaiterCard {...waiterContext} onClose={() => setWaiterContext(null)} />}
      {showStaffHelper && <StaffHelperModal onClose={() => setShowStaffHelper(false)} />}
      {legalView && <LegalModal type={legalView} onClose={() => setLegalView(null)} />}
    </div>
  );
};

export default App;