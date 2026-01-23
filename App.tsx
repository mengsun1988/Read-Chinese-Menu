
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AppStatus, Dish, Ingredient, UserUsage, RecognitionMode, StoreResult } from './types';
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
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

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
  const [dishes, setDishes] = useState<Dish[]>([]);
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
        if (parsed.lastResetDate !== todayStr) {
          return { ...parsed, freeCredits: 15, lastResetDate: todayStr };
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Usage parsing failed, using defaults", e);
    }
    return { freeCredits: 15, paidCredits: 0, lastResetDate: todayStr };
  });

  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [waiterContext, setWaiterContext] = useState<{
    type: 'ingredient' | 'spiciness';
    en: string;
    cn: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // FINAL STABILIZED PAYPAL OPTIONS:
  const paypalOptions = useMemo(() => {
    // Priority: env variable > default sandbox
    const cid = (window as any).process?.env?.PAYPAL_CLIENT_ID || "sb";
    return {
      clientId: cid,
      currency: "USD",
      intent: "capture",
      components: "buttons",
      // These attributes help the SDK run in constrained/sandboxed environments
      "data-namespace": "paypal_sdk",
      "data-sdk-integration-source": "react-paypal-js",
      "disable-funding": "paylater,credit,card",
      vault: false
    };
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('checkout') === 'true') {
      setShowPricing(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
    } catch (e) {
      console.error("Storage save error:", e);
    }
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

  const handleDismissTip = () => {
    setShowAppTip(false);
    const tomorrow = new Date().getTime() + (24 * 60 * 60 * 1000);
    localStorage.setItem(TIP_STORAGE_KEY, tomorrow.toString());
  };

  const isUnlimited = () => {
    if (!usage.passExpiryDate) return false;
    return new Date(usage.passExpiryDate) > new Date();
  };

  const totalCredits = (usage.freeCredits || 0) + (usage.paidCredits || 0);

  const spendCredit = (): 'none' | 'free' | 'paid' | 'unlimited' => {
    if (isUnlimited()) return 'unlimited';
    if (totalCredits <= 0) {
      setShowPricing(true);
      return 'none';
    }

    let type: 'free' | 'paid' = 'free';
    setUsage(prev => {
      const newUsage = { ...prev };
      if (newUsage.freeCredits > 0) {
        newUsage.freeCredits -= 1;
        type = 'free';
      } else {
        newUsage.paidCredits -= 1;
        type = 'paid';
      }
      return newUsage;
    });
    return type;
  };

  const refundCredit = (type: 'free' | 'paid') => {
    setUsage(prev => {
      const newUsage = { ...prev };
      if (type === 'free') {
        newUsage.freeCredits += 1;
      } else {
        newUsage.paidCredits += 1;
      }
      return newUsage;
    });
  };

  const handleDailyShare = async () => {
    const today = getBeijingDate();
    if (usage.lastShareDate === today) {
      alert("You've already claimed your reward today!");
      return;
    }
    const shareData = {
      title: 'Read Chinese Menu',
      text: 'Decode Chinese menus instantly!',
      url: window.location.origin
    };
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        alert("Link copied! Share it to support us.");
      }
      setUsage(prev => ({ ...prev, freeCredits: prev.freeCredits + 5, lastShareDate: today }));
      alert("Reward Claimed! +5 Free Credits added.");
    } catch (err) { console.error("Share failed", err); }
  };

  const handleDishClick = (dish: Dish) => {
    setSelectedDish(dish);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const spentType = spendCredit();
    if (spentType === 'none') return;

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    try {
      setStatus(AppStatus.LOADING);
      setError(null);
      const base64String = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string).split(',')[1]);
        r.onerror = () => reject(new Error("File read failed"));
        r.readAsDataURL(file);
      });
      if (mode === RecognitionMode.MENU) {
        const results = await processMenuImage(base64String);
        setDishes(results);
      } else {
        const result = await processStorefrontImage(base64String);
        setStoreResult(result);
      }
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      if (spentType === 'free' || spentType === 'paid') {
        refundCredit(spentType);
        setError(`${err?.message || "Recognition failed."} Credit restored.`);
      } else {
        setError(err?.message || "Recognition failed.");
      }
      setStatus(AppStatus.ERROR);
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();

  const reset = () => {
    setStatus(AppStatus.IDLE);
    setDishes([]);
    setStoreResult(null);
    setError(null);
    setPreviewUrl(null);
    setSelectedDish(null);
    setWaiterContext(null);
    setShowStaffHelper(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onPurchase = (plan: any) => {
    if (plan.isDonation) return;
    const now = new Date();
    setUsage(prev => {
      let updated = { ...prev };
      if (plan.id === 'starter') {
        updated.paidCredits = (updated.paidCredits || 0) + 60;
      } else if (plan.id === 'traveler') {
        const currentExpiry = updated.passExpiryDate ? new Date(updated.passExpiryDate) : now;
        const baseDate = currentExpiry > now ? currentExpiry : now;
        updated.passExpiryDate = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (plan.id === 'foodie') {
        const currentExpiry = updated.passExpiryDate ? new Date(updated.passExpiryDate) : now;
        const baseDate = currentExpiry > now ? currentExpiry : now;
        updated.passExpiryDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
      return updated;
    });
    setShowPricing(false);
  };

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <div className="min-h-screen selection:bg-rose-600 selection:text-white pb-0 overflow-x-hidden">
        {showAppTip && status === AppStatus.IDLE && (
          <div className="w-full bg-rose-50 border-b border-rose-100 px-6 py-3 flex items-center justify-between gap-4 animate-in slide-in-from-top sticky top-0 z-[100]">
            <div className="flex items-center gap-3">
              <span className="text-xl">💡</span>
              <p className="text-[11px] font-medium text-slate-700 leading-tight">
                Install this tool to your home screen for quick access!
              </p>
            </div>
            <button onClick={handleDismissTip} className="p-1 hover:bg-rose-100 rounded-full text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        <A2HSManager />

        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-2xl hover:scale-105 transition-transform cursor-default select-none group">
            <div className={`w-2.5 h-2.5 rounded-full ${isUnlimited() ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-900">
              {isUnlimited() ? 'Unlimited Access' : `Credits: ${totalCredits}`}
            </span>
            {!isUnlimited() && totalCredits <= 3 && <button onClick={() => setShowPricing(true)} className="ml-2 px-2 py-0.5 bg-rose-600 text-white text-[8px] rounded-lg font-medium">Top Up</button>}
          </div>

          <header className="mb-16 space-y-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full mb-4 animate-in fade-in zoom-in duration-1000">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">Global Explorer Edition</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-semibold text-slate-900 tracking-tighter leading-none">
              Read <span className="text-rose-600">Chinese Menu</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm md:text-base tracking-wide max-w-xl mx-auto uppercase">
              Know what’s on your plate • Translate & Communicate
            </p>
          </header>

          <main className="mb-20">
            {status === AppStatus.IDLE && (
              <>
                <div className="max-w-xl mx-auto mb-10 animate-in slide-in-from-bottom duration-700">
                  <button onClick={handleDailyShare} className="w-full bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-center justify-between group hover:border-emerald-200 transition-all active:scale-[0.98]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">🎁</div>
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Daily Reward</p>
                        <p className="text-sm font-semibold text-slate-900">Share & Earn +5 Free Credits</p>
                      </div>
                    </div>
                    <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">Claim Now</div>
                  </button>
                </div>

                <div className="flex justify-center mb-8">
                  <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 shadow-inner">
                    <button onClick={() => setMode(RecognitionMode.MENU)} className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === RecognitionMode.MENU ? 'bg-white text-rose-600 shadow-md scale-105' : 'text-slate-400'}`}>Scan Menu</button>
                    <button onClick={() => setMode(RecognitionMode.STREET)} className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === RecognitionMode.STREET ? 'bg-slate-900 text-white shadow-md scale-105' : 'text-slate-400'}`}>Scan Storefront</button>
                  </div>
                </div>
                <div className="modern-card p-12 md:p-20 text-center flex flex-col items-center shadow-xl mb-10">
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  <button onClick={triggerUpload} className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-10 shadow-2xl transition-transform active:scale-90 hover:scale-105 ${mode === RecognitionMode.MENU ? 'bg-rose-600 shadow-rose-200' : 'bg-slate-900 shadow-slate-200'}`}>
                    <CameraIcon className="w-12 h-12 text-white" />
                  </button>
                  <h2 className="text-4xl font-semibold text-slate-900 mb-2">{mode === RecognitionMode.MENU ? "What's on the Menu?" : "What's this Store?"}</h2>
                  <button onClick={triggerUpload} className="w-full max-w-xs bg-slate-900 text-white font-semibold py-5 rounded-2xl shadow-lg mt-8">📁 Upload or Capture</button>
                </div>
              </>
            )}

            {status === AppStatus.LOADING && <div className="modern-card overflow-hidden shadow-2xl"><LoadingScreen /></div>}

            {status === AppStatus.ERROR && (
              <div className="bg-white border-2 border-rose-100 rounded-[3rem] p-20 text-center space-y-8 shadow-sm">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-rose-50 text-rose-600 rounded-full"><WarningIcon className="w-12 h-12" /></div>
                <h2 className="text-4xl font-semibold text-slate-900">Scan Failed</h2>
                <p className="text-slate-500 max-sm mx-auto font-medium text-lg">{error}</p>
                <button onClick={reset} className="bg-rose-600 text-white font-semibold py-4 px-12 rounded-2xl shadow-xl">Try Again</button>
              </div>
            )}

            {status === AppStatus.SUCCESS && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-white/5 sticky top-6 z-20">
                  <div className="flex items-center gap-6">
                    {previewUrl && <img src={previewUrl} className="w-24 h-24 object-cover rounded-2xl border-2 border-white/10" alt="Preview" />}
                    <div>
                      <h3 className="font-semibold text-3xl text-white tracking-tight">{mode === RecognitionMode.MENU ? "Dish List" : "Shop Guide"}</h3>
                      <p className="text-sm font-medium text-rose-400 uppercase tracking-widest">{mode === RecognitionMode.MENU ? `${dishes.length} Matches` : 'Storefront Identified'}</p>
                    </div>
                  </div>
                  <button onClick={reset} className="bg-white text-slate-900 font-semibold py-5 px-10 rounded-2xl shadow-xl">New Scan</button>
                </div>
                {mode === RecognitionMode.MENU ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {dishes.map((dish, index) => <DishCard key={index} dish={dish} onClick={() => handleDishClick(dish)} />)}
                  </div>
                ) : (storeResult && <StoreCard store={storeResult} onShowStaff={() => setShowStaffHelper(true)} />)}
              </div>
            )}
          </main>
          
          {status !== AppStatus.SUCCESS && (
            <div className="space-y-20">
              <PricingModule onPurchase={onPurchase} />
              <AboutUs />
              <Reviews />
              <SupportSection onPurchase={onPurchase} />
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

        {showPricing && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md overflow-y-auto p-4 flex items-center justify-center">
             <div className="bg-[#fcfbf9] w-full max-w-5xl rounded-[3rem] relative p-8 animate-in zoom-in shadow-2xl">
               <button onClick={() => setShowPricing(false)} className="absolute top-6 right-6 p-2 text-slate-400">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
               <PricingModule onPurchase={onPurchase} />
             </div>
          </div>
        )}

        {selectedDish && <DishDetailModal dish={selectedDish} onClose={() => setSelectedDish(null)} onIngredientClick={(ing) => setWaiterContext({ type: 'ingredient', en: ing.name_en, cn: ing.name_cn })} onSpicyClick={() => setWaiterContext({ type: 'spiciness', en: '', cn: '' })} />}
        {waiterContext && <WaiterCard type={waiterContext.type} content_en={waiterContext.en} content_cn={waiterContext.cn} onClose={() => setWaiterContext(null)} />}
        {showStaffHelper && <StaffHelperModal onClose={() => setShowStaffHelper(false)} />}
        {legalView && <LegalModal type={legalView} onClose={() => setLegalView(null)} />}
      </div>
    </PayPalScriptProvider>
  );
};

export default App;
