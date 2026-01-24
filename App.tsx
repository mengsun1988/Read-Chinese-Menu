import React, { useState, useRef, useEffect } from 'react';
import { AppStatus, Dish, UserUsage, RecognitionMode, StoreResult } from './types';
import { processMenuImage, processStorefrontImage } from './services/geminiService';
import { DishCard } from './components/DishCard';
import { LoadingScreen } from './components/LoadingScreen';
import { CameraIcon, WarningIcon } from './components/Icons';
import { DishDetailModal } from './components/DishDetailModal';
import { WaiterCard } from './components/WaiterCard';
import { AboutUs } from './components/AboutUs';
import { PricingModule } from './components/PricingModule';
import { StoreCard } from './components/StoreCard';
import { StaffHelperModal } from './components/StaffHelperModal';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModals';
import { A2HSManager } from './components/A2HSManager';
import { Reviews } from './components/Reviews';

const STORAGE_KEY = 'rmc_user_usage_v3';
const TIP_STORAGE_KEY = 'rmc_hide_app_tip_v3';

const getBeijingDate = () => {
  const d = new Date();
  const beijingTime = new Date(d.getTime() + (8 * 60 * 60 * 1000));
  return beijingTime.toISOString().split('T')[0];
};

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [mode, setMode] = useState<RecognitionMode>(RecognitionMode.MENU);
  const [dishes, setDishes] = useState<any[]>([]); // 使用 any[] 确保兼容性
  const [storeResult, setStoreResult] = useState<StoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showAppTip, setShowAppTip] = useState(false);
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

  const [selectedDish, setSelectedDish] = useState<any | null>(null);
  const [waiterContext, setWaiterContext] = useState<{ type: 'ingredient' | 'spiciness'; content_en: string; content_cn: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  }, [usage]);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const hiddenUntil = localStorage.getItem(TIP_STORAGE_KEY);
    const isDismissed = hiddenUntil && new Date().getTime() < parseInt(hiddenUntil);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && !isStandalone && !isDismissed) {
      const timer = setTimeout(() => setShowAppTip(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const spendCredit = (): boolean => {
    const totalCredits = (usage.freeCredits || 0) + (usage.paidCredits || 0);
    const isUnlimited = usage.passExpiryDate ? new Date(usage.passExpiryDate).getTime() > Date.now() : false;
    if (isUnlimited) return true;
    if (totalCredits <= 0) { setShowPricing(true); return false; }
    setUsage(prev => {
      const u = { ...prev };
      if (u.freeCredits > 0) u.freeCredits--;
      else if (u.paidCredits > 0) u.paidCredits--;
      return u;
    });
    return true;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !spendCredit()) return;

    setStatus(AppStatus.LOADING);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        if (mode === RecognitionMode.MENU) {
          const result = await processMenuImage(base64);
          if (Array.isArray(result) && result.length > 0) {
            setDishes(result);
            setStatus(AppStatus.SUCCESS);
          } else {
            throw new Error("No dishes found. Please try a clearer photo.");
          }
        } else {
          const result = await processStorefrontImage(base64);
          setStoreResult(result);
          setStatus(AppStatus.SUCCESS);
        }
      } catch (err: any) {
        setError(err.message || "Analysis failed.");
        setStatus(AppStatus.ERROR);
      }
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setStatus(AppStatus.IDLE);
    setDishes([]);
    setStoreResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] font-['Roboto']">
      <A2HSManager />
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        <header className="mb-16 text-center space-y-6">
           <h1 className="text-5xl md:text-7xl font-semibold text-slate-900 tracking-tighter font-['Poppins']">
            Read <span className="text-[#e11d48]">Chinese Menu</span>
          </h1>
        </header>

        <main>
          {status === AppStatus.IDLE && (
            <div className="space-y-10">
              <div className="flex justify-center">
                <div className="bg-slate-200/50 p-1 rounded-2xl flex gap-1">
                  <button onClick={() => setMode(RecognitionMode.MENU)} className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase ${mode === RecognitionMode.MENU ? 'bg-white text-[#e11d48]' : 'text-slate-500'}`}>Menu</button>
                  <button onClick={() => setMode(RecognitionMode.STREET)} className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase ${mode === RecognitionMode.STREET ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Street</button>
                </div>
              </div>
              <div className="bg-white p-12 text-center shadow-2xl rounded-[3rem] border border-slate-100">
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-3xl bg-[#e11d48] flex items-center justify-center mb-10 mx-auto shadow-xl">
                  <CameraIcon className="w-10 h-10 text-white" />
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full max-w-xs bg-slate-900 text-white font-bold py-5 rounded-2xl">UPLOAD PHOTO</button>
              </div>
              <AboutUs /><Reviews />
            </div>
          )}

          {status === AppStatus.LOADING && <LoadingScreen />}

          {status === AppStatus.SUCCESS && (
            <div className="space-y-12">
              <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] sticky top-6 z-20">
                <h3 className="text-white text-xl font-bold">Results ({dishes.length})</h3>
                <button onClick={reset} className="bg-white px-6 py-2 rounded-xl text-xs font-bold">NEW SCAN</button>
              </div>
              {mode === RecognitionMode.MENU ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {Array.isArray(dishes) && dishes.map((dish, i) => (
                    <DishCard key={dish.id || i} dish={dish} onClick={() => setSelectedDish(dish)} />
                  ))}
                </div>
              ) : (
                storeResult && <StoreCard store={storeResult} onShowStaff={() => setShowStaffHelper(true)} />
              )}
            </div>
          )}

          {status === AppStatus.ERROR && (
            <div className="text-center p-20 bg-white rounded-[3rem] border border-rose-100">
              <WarningIcon className="w-12 h-12 text-rose-500 mx-auto mb-4" />
              <p className="text-slate-600 mb-8">{error}</p>
              <button onClick={reset} className="bg-rose-600 text-white px-8 py-3 rounded-xl">Retry</button>
            </div>
          )}
        </main>
      </div>
      
      <Footer onMenuScan={reset} onStreetScan={reset} onPricing={() => setShowPricing(true)} onPrivacy={() => {}} onTos={() => {}} />

      {selectedDish && (
        <DishDetailModal 
          dish={selectedDish} onClose={() => setSelectedDish(null)}
          onIngredientClick={(ing) => setWaiterContext({ type: 'ingredient', content_en: ing.name_en, content_cn: ing.name_cn })}
          onSpicyClick={() => setWaiterContext({ type: 'spiciness', content_en: 'Spiciness', content_cn: '辣度' })}
        />
      )}
    </div>
  );
};

export default App;