import React, { useState, useRef, useEffect } from 'react';
import { AppStatus, Dish, UserUsage, RecognitionMode, StoreResult } from './types';
import { processMenuImage, processStorefrontImage } from './services/geminiService';
import { DishCard } from './components/DishCard';
import { LoadingScreen } from './components/LoadingScreen';
import { CameraIcon, WarningIcon } from './components/Icons';
import { DishDetailModal } from './components/DishDetailModal';
import { WaiterCard } from './components/WaiterCard';
import { AboutUs } from './components/AboutUs';
import { Reviews } from './components/Reviews';
import { PricingModule } from './components/PricingModule';
import { A2HSManager } from './components/A2HSManager';
import { StoreCard } from './components/StoreCard';
import { StaffHelperModal } from './components/StaffHelperModal';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModals';

const STORAGE_KEY = 'rmc_user_usage_v3';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [mode, setMode] = useState<RecognitionMode>(RecognitionMode.MENU);
  const [dishes, setDishes] = useState<any[]>([]);
  const [storeResult, setStoreResult] = useState<StoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [selectedDish, setSelectedDish] = useState<any | null>(null);
  const [waiterContext, setWaiterContext] = useState<any | null>(null);
  const [showStaffHelper, setShowStaffHelper] = useState(false);
  const [legalView, setLegalView] = useState<any>(null);
  const [showAppTip, setShowAppTip] = useState(false);

  const [usage, setUsage] = useState<UserUsage>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { freeCredits: 15, paidCredits: 0, lastResetDate: new Date().toISOString().split('T')[0] };
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const spendCredit = (): boolean => {
    const total = (usage.freeCredits || 0) + (usage.paidCredits || 0);
    const unlimited = usage.passExpiryDate ? new Date(usage.passExpiryDate) > new Date() : false;
    if (unlimited) return true;
    if (total <= 0) { setShowPricing(true); return false; }
    setUsage(prev => ({ ...prev, freeCredits: Math.max(0, prev.freeCredits - 1) }));
    return true;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !spendCredit()) return;
    setStatus(AppStatus.LOADING);
    setPreviewUrl(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        if (mode === RecognitionMode.MENU) {
          const res = await processMenuImage(base64);
          setDishes(res);
        } else {
          const res = await processStorefrontImage(base64);
          setStoreResult(res);
        }
        setStatus(AppStatus.SUCCESS);
      } catch (err: any) {
        setError(err.message);
        setStatus(AppStatus.ERROR);
      }
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setStatus(AppStatus.IDLE);
    setDishes([]);
    setStoreResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] font-['Roboto'] pb-20">
      <A2HSManager />
      
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Credits Badge */}
        <div className="fixed bottom-24 right-6 z-[60] flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-xl">
          <div className="w-2 h-2 rounded-full bg-rose-500"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Credits: {(usage.freeCredits || 0) + (usage.paidCredits || 0)}
          </span>
        </div>

        <header className="mb-16 text-center space-y-4">
          <div className="px-5 py-1 border border-slate-200 inline-block rounded-full text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Explorer Edition</div>
          <h1 className="text-5xl md:text-7xl font-semibold text-slate-900 tracking-tighter font-['Poppins'] leading-none">
            Read <span className="text-rose-600">Chinese Menu</span>
          </h1>
          <p className="text-slate-500 text-lg">Instant decoding for travelers.</p>
        </header>

        <main>
          {status === AppStatus.IDLE && (
            <div className="space-y-16">
              <div className="flex justify-center">
                <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 shadow-inner">
                  <button onClick={() => setMode(RecognitionMode.MENU)} className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${mode === RecognitionMode.MENU ? 'bg-white text-rose-600 shadow-md' : 'text-slate-400'}`}>Scan Menu</button>
                  <button onClick={() => setMode(RecognitionMode.STREET)} className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${mode === RecognitionMode.STREET ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Scan Storefront</button>
                </div>
              </div>

              <div className="modern-card p-12 md:p-20 text-center flex flex-col items-center shadow-xl">
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <button onClick={() => fileInputRef.current?.click()} className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-10 shadow-2xl transition-transform active:scale-95 ${mode === RecognitionMode.MENU ? 'bg-rose-600' : 'bg-slate-900'}`}>
                  <CameraIcon className="w-12 h-12 text-white" />
                </button>
                <h2 className="text-3xl font-semibold mb-8">{mode === RecognitionMode.MENU ? "What's on the Menu?" : "Identify this Store"}</h2>
                <button onClick={() => fileInputRef.current?.click()} className="w-full max-w-xs bg-slate-900 text-white font-bold py-5 rounded-2xl shadow-lg">📁 UPLOAD PHOTO</button>
              </div>

              <PricingModule onPurchase={() => {}} />
              <AboutUs />
              <Reviews />
            </div>
          )}

          {status === AppStatus.LOADING && <LoadingScreen />}

          {status === AppStatus.SUCCESS && (
            <div className="space-y-12 animate-in slide-in-from-bottom-5">
              <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] sticky top-6 z-20">
                <h3 className="text-white font-bold">Results ({dishes.length})</h3>
                <button onClick={reset} className="bg-white px-6 py-2 rounded-xl text-xs font-bold">NEW SCAN</button>
              </div>
              {mode === RecognitionMode.MENU ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {dishes.map((dish, i) => <DishCard key={i} dish={dish} onClick={() => setSelectedDish(dish)} />)}
                </div>
              ) : (
                storeResult && <StoreCard store={storeResult} onShowStaff={() => setShowStaffHelper(true)} />
              )}
            </div>
          )}
        </main>
      </div>

      <Footer onMenuScan={reset} onStreetScan={() => {setMode(RecognitionMode.STREET); reset();}} onPricing={() => setShowPricing(true)} onPrivacy={() => {}} onTos={() => {}} />

      {selectedDish && (
        <DishDetailModal 
          dish={selectedDish} 
          onClose={() => setSelectedDish(null)}
          onIngredientClick={(ing) => setWaiterContext({ type: 'ingredient', en: ing.name_en, cn: ing.name_cn })}
          onSpicyClick={() => setWaiterContext({ type: 'spiciness', en: 'Spiciness Level', cn: '辣度' })}
        />
      )}
      {waiterContext && <WaiterCard type={waiterContext.type} content_en={waiterContext.en} content_cn={waiterContext.cn} onClose={() => setWaiterContext(null)} />}
      {showStaffHelper && <StaffHelperModal onClose={() => setShowStaffHelper(false)} />}
      
      {showPricing && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#fcfbf9] rounded-[3rem] p-8 relative max-w-5xl w-full shadow-2xl overflow-y-auto max-h-[95vh]">
            <button onClick={() => setShowPricing(false)} className="absolute top-8 right-8 text-slate-400 text-2xl">✕</button>
            <PricingModule onPurchase={() => {}} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;