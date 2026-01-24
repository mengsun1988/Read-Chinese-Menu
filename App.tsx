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
        if (parsed.lastResetDate !== todayStr) {
          return { ...parsed, freeCredits: 15, lastResetDate: todayStr };
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Usage parsing failed", e);
    }
    return { freeCredits: 15, paidCredits: 0, lastResetDate: todayStr };
  });

  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [waiterContext, setWaiterContext] = useState<{ type: 'ingredient' | 'spiciness'; content_en: string; content_cn: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  }, [usage]);

  const totalCredits = (usage.freeCredits || 0) + (usage.paidCredits || 0);
  
  const isUnlimited = () => {
    if (!usage.passExpiryDate) return false;
    return new Date(usage.passExpiryDate).getTime() > new Date().getTime();
  };

  const getRemainingDays = () => {
    if (!usage.passExpiryDate) return 0;
    const diff = new Date(usage.passExpiryDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const triggerUpload = () => fileInputRef.current?.click();

  const reset = () => {
    setStatus(AppStatus.IDLE);
    setDishes([]);
    setStoreResult(null);
    setError(null);
    setPreviewUrl(null);
  };

  const onPurchase = (plan: any) => {
    const updatedUsage = { ...usage };
    if (plan.id === 'starter') {
      updatedUsage.paidCredits += 60;
    } else if (plan.id === 'traveler') {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      updatedUsage.passExpiryDate = date.toISOString();
    } else if (plan.id === 'foodie') {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      updatedUsage.passExpiryDate = date.toISOString();
    }
    setUsage(updatedUsage);
  };

  const handleDailyShare = () => {
    const today = getBeijingDate();
    if (usage.lastShareDate === today) {
      alert("Already claimed today!");
      return;
    }
    setUsage(prev => ({
      ...prev,
      freeCredits: (prev.freeCredits || 0) + 5,
      lastShareDate: today
    }));
    alert("5 Bonus Credits Added! 🎁");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isUnlimited() && totalCredits <= 0) {
      setShowPricing(true);
      return;
    }

    setStatus(AppStatus.LOADING);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        if (mode === RecognitionMode.MENU) {
          const result = await processMenuImage(base64);
          // ✅ 修正点：直接使用 Service 处理好的数组
          setDishes(result || []);
        } else {
          const result = await processStorefrontImage(base64);
          setStoreResult(result);
        }

        if (!isUnlimited()) {
          setUsage(prev => ({
            ...prev,
            paidCredits: prev.paidCredits > 0 ? prev.paidCredits - 1 : prev.paidCredits,
            freeCredits: prev.paidCredits <= 0 ? prev.freeCredits - 1 : prev.freeCredits
          }));
        }
        setStatus(AppStatus.SUCCESS);
      } catch (err: any) {
        setError(err.message || "Recognition failed.");
        setStatus(AppStatus.ERROR);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen selection:bg-rose-600 selection:text-white pb-0 overflow-x-hidden">
      <A2HSManager />
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        {/* Credits Badge */}
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-2xl hover:scale-105 transition-transform select-none">
          <div className={`w-2.5 h-2.5 rounded-full ${isUnlimited() ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-900">
            {isUnlimited() ? `Unlimited (${getRemainingDays()}d)` : `Credits: ${totalCredits}`}
          </span>
        </div>

        <header className="mb-16 space-y-6 text-center">
          <h1 className="text-5xl md:text-7xl font-semibold text-slate-900 tracking-tighter">
            Read <span className="text-rose-600">Chinese Menu</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-base uppercase tracking-widest">
            Know what’s on your plate
          </p>
        </header>

        <main className="mb-20">
          {status === AppStatus.IDLE && (
            <>
              <div className="max-w-xl mx-auto mb-10">
                <button onClick={handleDailyShare} className="w-full bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-center justify-between group transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">🎁</div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Daily Reward</p>
                      <p className="text-sm font-semibold text-slate-900">Share & Earn +5 Credits</p>
                    </div>
                  </div>
                  <div className="bg-emerald-600 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest">Claim</div>
                </button>
              </div>

              <div className="flex justify-center mb-8">
                <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1">
                  <button onClick={() => setMode(RecognitionMode.MENU)} className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === RecognitionMode.MENU ? 'bg-white text-rose-600 shadow-md' : 'text-slate-400'}`}>Scan Menu</button>
                  <button onClick={() => setMode(RecognitionMode.STREET)} className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === RecognitionMode.STREET ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Scan Storefront</button>
                </div>
              </div>

              <div className="modern-card p-12 md:p-20 text-center flex flex-col items-center shadow-xl">
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <button onClick={triggerUpload} className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-10 shadow-2xl transition-transform active:scale-95 ${mode === RecognitionMode.MENU ? 'bg-rose-600' : 'bg-slate-900'}`}>
                  <CameraIcon className="w-12 h-12 text-white" />
                </button>
                <h2 className="text-4xl font-semibold text-slate-900 mb-2">Ready to Scan?</h2>
                <button onClick={triggerUpload} className="w-full max-w-xs bg-slate-900 text-white font-semibold py-5 rounded-full shadow-lg mt-8">📁 Upload Photo</button>
              </div>
            </>
          )}

          {status === AppStatus.LOADING && <LoadingScreen />}

          {status === AppStatus.ERROR && (
            <div className="bg-white border-2 border-rose-100 rounded-[3rem] p-20 text-center space-y-8">
              <WarningIcon className="w-16 h-16 text-rose-600 mx-auto" />
              <h2 className="text-4xl font-semibold text-slate-900">Scan Failed</h2>
              <p className="text-slate-500 text-lg">{error}</p>
              <button onClick={reset} className="bg-rose-600 text-white font-semibold py-4 px-12 rounded-full">Try Again</button>
            </div>
          )}

          {status === AppStatus.SUCCESS && (
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl sticky top-6 z-20">
                <div className="flex items-center gap-6">
                  {previewUrl && <img src={previewUrl} className="w-20 h-20 object-cover rounded-2xl border-2 border-white/10" alt="Preview" />}
                  <div>
                    <h3 className="font-semibold text-3xl text-white">{mode === RecognitionMode.MENU ? "Dish List" : "Storefront"}</h3>
                    <p className="text-sm font-medium text-rose-400 uppercase tracking-widest">
                      {mode === RecognitionMode.MENU ? `${dishes?.length || 0} Dishes Found` : 'Store Identified'}
                    </p>
                  </div>
                </div>
                <button onClick={reset} className="bg-white text-slate-900 font-semibold py-4 px-10 rounded-full">New Scan</button>
              </div>
              {mode === RecognitionMode.MENU ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {dishes?.map((dish, index) => <DishCard key={dish.id || index} dish={dish} onClick={() => setSelectedDish(dish)} />)}
                </div>
              ) : (storeResult && <StoreCard store={storeResult} onShowStaff={() => setShowStaffHelper(true)} />)}
            </div>
          )}
        </main>
      </div>

      <Footer
        onMenuScan={() => { setMode(RecognitionMode.MENU); reset(); }}
        onStreetScan={() => { setMode(RecognitionMode.STREET); reset(); }}
        onPricing={() => setShowPricing(true)}
        onPrivacy={() => setLegalView('privacy')}
        onTos={() => setLegalView('tos')}
      />

      {/* Modals */}
      {selectedDish && (
        <DishDetailModal 
          dish={selectedDish} 
          onClose={() => setSelectedDish(null)}
          onIngredientClick={(ing) => setWaiterContext({ type: 'ingredient', content_en: ing.name_en, content_cn: ing.name_cn })}
          onSpicyClick={() => setWaiterContext({ type: 'spiciness', content_en: 'Spiciness', content_cn: '辣度' })}
        />
      )}
      {waiterContext && <WaiterCard {...waiterContext} onClose={() => setWaiterContext(null)} />}
      {showPricing && <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"><div className="bg-white rounded-[3rem] p-8 relative max-w-4xl w-full"><button onClick={() => setShowPricing(false)} className="absolute top-6 right-6">✕</button><PricingModule onPurchase={onPurchase} /></div></div>}
      {showStaffHelper && <StaffHelperModal onClose={() => setShowStaffHelper(false)} />}
      {legalView && <LegalModal type={legalView} onClose={() => setLegalView(null)} />}
    </div>
  );
};

export default App;