import React, { useState, useRef, useEffect } from 'react';
import { AppStatus, Dish, Ingredient, UserUsage, RecognitionMode, StoreResult } from './types';
import { processMenuImage, processStorefrontImage } from './services/geminiService';
import { DishCard } from './components/DishCard';
import { LoadingScreen } from './components/LoadingScreen';
import { CameraIcon, WarningIcon } from './components/Icons';
import { DishDetailModal } from './components/DishDetailModal';
import { WaiterCard } from './components/WaiterCard';
import { WordCloudMarquee } from './components/WordCloudMarquee';
import { AboutUs } from './components/AboutUs';
import { Reviews } from './components/Reviews';
import { PricingModule } from './components/PricingModule';
import { A2HSManager } from './components/A2HSManager';
import { StoreCard } from './components/StoreCard';
import { StaffHelperModal } from './components/StaffHelperModal';

const STORAGE_KEY = 'rmc_user_usage_v2';
const TIP_STORAGE_KEY = 'rmc_hide_app_tip';

const getBeijingDate = () => {
  const d = new Date();
  // Adjust to UTC+8 (Beijing Time)
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
  const [thankYouPlan, setThankYouPlan] = useState<string | null>(null);
  const [showAppTip, setShowAppTip] = useState(false);
  const [showStaffHelper, setShowStaffHelper] = useState(false);
  
  const [usage, setUsage] = useState<UserUsage>(() => {
    const todayStr = getBeijingDate();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserUsage;
        if (parsed.lastResetDate !== todayStr) {
          // Daily refresh: 15 free credits
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
    } catch (e) {
      console.error("Storage save error:", e);
    }
  }, [usage]);

  // Handle Smart App Tip Visibility
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const isDismissed = localStorage.getItem(TIP_STORAGE_KEY) === 'true';
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && !isStandalone && !isDismissed) {
      setShowAppTip(true);
    }
  }, []);

  const handleDismissTip = () => {
    setShowAppTip(false);
    localStorage.setItem(TIP_STORAGE_KEY, 'true');
  };

  const isUnlimited = () => {
    if (!usage.passExpiryDate) return false;
    return new Date(usage.passExpiryDate) > new Date();
  };

  const totalCredits = (usage.freeCredits || 0) + (usage.paidCredits || 0);

  const spendCredit = (): boolean => {
    if (isUnlimited()) return true;
    if (totalCredits <= 0) {
      setShowPricing(true);
      return false;
    }

    setUsage(prev => {
      const newUsage = { ...prev };
      if (newUsage.freeCredits > 0) {
        newUsage.freeCredits -= 1;
      } else if (newUsage.paidCredits > 0) {
        newUsage.paidCredits -= 1;
      }
      return newUsage;
    });
    return true;
  };

  const handleDailyShare = async () => {
    const today = getBeijingDate();
    if (usage.lastShareDate === today) {
      alert("You've already claimed your reward today! Come back tomorrow.");
      return;
    }

    const shareData = {
      title: 'Read Chinese Menu',
      text: 'Translate Chinese menus and decode ingredients instantly! No app download required.',
      url: window.location.origin
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        alert("Link copied to clipboard! Share it with your friends to support us.");
      }
      
      // Reward logic
      setUsage(prev => ({
        ...prev,
        freeCredits: prev.freeCredits + 5,
        lastShareDate: today
      }));
      alert("Reward Claimed! +5 Free Credits added to your account.");
    } catch (err) {
      console.error("Share failed", err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!spendCredit()) return;

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
      console.error(err);
      setError(err?.message || "Recognition failed. Please ensure the target is clear and well-lit.");
      setStatus(AppStatus.ERROR);
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();

  const handleDishClick = (dish: Dish) => {
    if (!spendCredit()) return;
    setSelectedDish(dish);
  };

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

  const handleMarqueeItemClick = (dishData: Partial<Dish>) => {
    const query = encodeURIComponent(`${dishData.dish_name_en} ${dishData.dish_name_cn} Chinese dish`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  const handleCoffee = (amount: number) => {
    window.location.href = `https://www.paypal.com/paypalme/yourhandle/${amount}`;
  };

  const onPurchase = (plan: any) => {
    const now = new Date();
    setUsage(prev => {
      let updated = { ...prev };
      if (plan.id === 'starter') updated.paidCredits = (updated.paidCredits || 0) + 60;
      if (plan.id === 'traveler') {
        const expiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        updated.passExpiryDate = expiry.toISOString();
      }
      if (plan.id === 'foodie') {
        const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        updated.passExpiryDate = expiry.toISOString();
      }
      return updated;
    });
    setThankYouPlan(plan.name);
    setShowPricing(false);
  };

  const hasSharedToday = usage.lastShareDate === getBeijingDate();
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  return (
    <div className="min-h-screen selection:bg-rose-600 selection:text-white pb-0 overflow-x-hidden">
      {/* Smart App Tip Bar */}
      {showAppTip && (
        <div className="w-full bg-rose-50 border-b border-rose-100 px-6 py-3 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-500 sticky top-0 z-[100]">
          <div className="flex items-center gap-3">
            <span className="text-xl shrink-0" role="img" aria-label="smartphone">
              {isIOS ? '📱' : '💡'}
            </span>
            <p className="text-[11px] sm:text-xs font-medium text-slate-700 leading-tight">
              {isIOS ? (
                <>Pro Tip: Tap your browser's <strong>'Share'</strong> icon and select <strong>'Add to Home Screen'</strong> to keep this tool as an App!</>
              ) : isAndroid ? (
                <>Pro Tip: Tap the <strong>⋮ menu</strong> and select <strong>'Install app'</strong> to save this tool to your home screen.</>
              ) : (
                <>Pro Tip: Bookmark or install this app to your home screen for quick access while dining!</>
              )}
            </p>
          </div>
          <button 
            onClick={handleDismissTip}
            className="p-1 hover:bg-rose-100 rounded-full transition-colors text-slate-400 hover:text-rose-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* PWA Install Manager Handles its own visibility based on browser support and OS */}
      <A2HSManager />

      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        {/* Floating Credit Counter - Bottom Right */}
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-2xl hover:scale-105 transition-transform cursor-default select-none group">
          <div className={`w-2.5 h-2.5 rounded-full ${isUnlimited() ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-900">
            {isUnlimited() ? 'Unlimited Access' : `Remaining Credits: ${totalCredits}`}
          </span>
          {!isUnlimited() && totalCredits <= 3 && (
            <button 
              onClick={() => setShowPricing(true)}
              className="ml-2 px-2 py-0.5 bg-rose-600 text-white text-[8px] rounded-lg font-medium group-hover:bg-rose-700 transition-colors"
            >
              Top Up
            </button>
          )}
        </div>

        {/* Header */}
        <header className="mb-16 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-px bg-slate-200 flex-1"></div>
            <div className="px-5 py-1.5 border border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-[0.4em] rounded-full flex items-center gap-2">
              <span>Global Explorer Edition</span>
            </div>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-semibold text-slate-900 tracking-tighter leading-none mb-4">
              Read <span className="text-rose-600">Chinese Menu</span>
            </h1>
            <div className="flex flex-col items-center gap-4">
              <p className="text-rose-600 font-semibold uppercase tracking-[0.1em] text-[10px] sm:text-xs text-center">
                No App download required. No registration. Just scan and read.
              </p>
              <p className="text-slate-500 max-w-xl mx-auto text-xl font-medium leading-relaxed tracking-tight">
                Know what’s on your plate.
              </p>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="mb-20">
          {status === AppStatus.IDLE && (
            <>
              {/* Mode Toggle */}
              <div className="flex justify-center mb-8">
                <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 shadow-inner">
                  <button 
                    onClick={() => setMode(RecognitionMode.MENU)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === RecognitionMode.MENU ? 'bg-white text-rose-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Scan Menu
                  </button>
                  <button 
                    onClick={() => setMode(RecognitionMode.STREET)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === RecognitionMode.STREET ? 'bg-slate-900 text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Scan Storefront
                  </button>
                </div>
              </div>

              <div className="modern-card p-12 md:p-20 text-center flex flex-col items-center shadow-xl mb-10">
                <input type="file" accept="image/*" className="hidden" id="menu-upload" ref={fileInputRef} onChange={handleFileChange} />
                
                <button 
                  onClick={triggerUpload}
                  className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-10 shadow-2xl rotate-3 transition-transform active:scale-90 hover:scale-105 ${mode === RecognitionMode.MENU ? 'bg-rose-600 shadow-rose-200' : 'bg-slate-900 shadow-slate-200'}`}
                  aria-label="Take Photo or Select Image"
                >
                  <CameraIcon className="w-12 h-12 text-white" />
                </button>
                
                <h2 className="text-4xl font-semibold text-slate-900 mb-2 tracking-tight">
                  {mode === RecognitionMode.MENU ? "What's on the Menu?" : "What's this Store?"}
                </h2>
                <p className="text-slate-400 mb-10 font-medium uppercase tracking-[0.2em] text-xs">
                  {totalCredits > 0 || isUnlimited() ? `Tap the icon to scan ${mode === RecognitionMode.MENU ? 'menu' : 'storefront'}` : "Daily free credits exhausted"}
                </p>
                
                <div className="w-full max-w-xs space-y-4">
                   <button 
                     onClick={triggerUpload}
                     className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-5 px-8 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 text-lg shadow-lg"
                   >
                     📁 Upload From Album
                   </button>
                </div>
              </div>

              {/* Daily Share Reward Button */}
              {!hasSharedToday && (
                <div className="max-w-xs mx-auto mb-10">
                  <button 
                    onClick={handleDailyShare}
                    className="w-full group bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 rounded-2xl p-4 transition-all active:scale-95 flex flex-col items-center gap-1 shadow-sm"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600">Daily Reward</span>
                    <span className="text-sm font-semibold text-slate-900">📢 Share to friends & Get +5 Free Credits</span>
                  </button>
                </div>
              )}

              <button 
                onClick={() => setShowPricing(true)}
                className="block mx-auto mb-10 text-xs font-semibold text-rose-600 uppercase tracking-widest underline decoration-2 underline-offset-4"
              >
                View Premium Plans
              </button>

              <div className="p-6 bg-slate-50 rounded-3xl flex items-start gap-5 border border-slate-100 max-w-3xl mx-auto">
                 <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                   <WarningIcon className="w-5 h-5 text-white" />
                 </div>
                 <div>
                   <h4 className="font-semibold text-slate-900 text-sm">Better Recognition Tips</h4>
                   <p className="text-slate-500 text-xs mt-1 leading-normal font-medium">
                     {mode === RecognitionMode.MENU ? 
                       "For complex menus, try scanning in smaller sections. Ensure the Chinese text is sharp and legible." :
                       "Ensure the main sign is clearly visible. Glare from windows can sometimes confuse the AI."}
                   </p>
                 </div>
              </div>
            </>
          )}

          {status === AppStatus.LOADING && (
            <div className="modern-card overflow-hidden shadow-2xl">
              <LoadingScreen />
            </div>
          )}

          {status === AppStatus.ERROR && (
            <div className="bg-white border-2 border-rose-100 rounded-[3rem] p-20 text-center space-y-8 shadow-sm">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-rose-50 text-rose-600 rounded-full">
                <WarningIcon className="w-12 h-12" />
              </div>
              <h2 className="text-4xl font-semibold text-slate-900">Scan Failed</h2>
              <p className="text-slate-500 max-sm mx-auto font-medium text-lg">{error}</p>
              <button onClick={reset} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-4 px-12 rounded-2xl transition-all shadow-xl text-xl">
                Try Again
              </button>
            </div>
          )}

          {status === AppStatus.SUCCESS && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-white/5 sticky top-6 z-20">
                <div className="flex items-center gap-6">
                  {previewUrl && (
                    <img src={previewUrl} className="w-24 h-24 object-cover rounded-2xl border-2 border-white/10" alt="Preview" />
                  )}
                  <div>
                    <h3 className="font-semibold text-3xl text-white tracking-tight">
                      {mode === RecognitionMode.MENU ? "Dish List" : "Shop Guide"}
                    </h3>
                    <p className="text-sm font-medium text-rose-400 uppercase tracking-widest">
                      {mode === RecognitionMode.MENU ? `${dishes.length} Matches Found` : 'Storefront Identified'}
                    </p>
                  </div>
                </div>
                <button onClick={reset} className="bg-white text-slate-900 hover:bg-rose-600 hover:text-white font-semibold py-5 px-10 rounded-2xl transition-all active:scale-95 shadow-xl text-lg">
                  New Scan
                </button>
              </div>

              {mode === RecognitionMode.MENU ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {dishes.map((dish, index) => (
                    <DishCard key={index} dish={dish} onClick={() => handleDishClick(dish)} />
                  ))}
                </div>
              ) : (
                storeResult && <StoreCard store={storeResult} onShowStaff={() => setShowStaffHelper(true)} />
              )}
              
              <div className="mt-20">
                <AboutUs />
              </div>
              
              <div className="mt-16">
                <Reviews />
              </div>
            </div>
          )}
        </main>
        
        {status !== AppStatus.SUCCESS && (
          <div className="space-y-20">
            {/* Inline Share Promotion before Pricing */}
            {!hasSharedToday && status === AppStatus.IDLE && (
              <div className="max-w-4xl mx-auto px-6">
                <div className="bg-emerald-600 rounded-[2rem] p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-emerald-100 overflow-hidden relative">
                   <div className="space-y-2 relative z-10 text-center md:text-left">
                     <h3 className="text-3xl font-semibold tracking-tight">Free Daily Reward</h3>
                     <p className="text-emerald-100 font-medium uppercase tracking-widest text-[10px]">Spread the word and keep exploring for free</p>
                   </div>
                   <button 
                     onClick={handleDailyShare}
                     className="bg-white text-emerald-600 font-semibold py-5 px-10 rounded-2xl shadow-xl transition-all active:scale-95 whitespace-nowrap relative z-10 hover:bg-emerald-50 text-lg"
                   >
                     📢 Get +5 Free Credits
                   </button>
                   {/* Decorative circle */}
                   <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full"></div>
                </div>
              </div>
            )}
            
            <PricingModule onPurchase={onPurchase} />
            <AboutUs />
            <Reviews />
          </div>
        )}

        {/* Support section at the bottom */}
        <div className="max-w-2xl mx-auto pt-24 pb-12 text-center space-y-10 border-t border-slate-100 relative group overflow-visible">
          <div className="space-y-4 px-6 relative z-10">
            <h4 className="text-2xl font-semibold text-slate-900 uppercase tracking-tight">Support our bridge</h4>
            <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px] block mt-2 max-w-lg mx-auto leading-relaxed">
              If you love this site or it has truly helped you navigate the flavors of China, please consider giving me a treat. Your support keeps this bridge between cultures alive.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 px-6 relative z-10">
            <button onClick={() => handleCoffee(2)} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-semibold text-slate-800 hover:border-rose-400 hover:text-rose-600 shadow-sm transition-all active:scale-95 text-[10px] uppercase tracking-widest">Buy me a Coke ($2)</button>
            <button onClick={() => handleCoffee(5)} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-semibold text-slate-800 hover:border-rose-400 hover:text-rose-600 shadow-sm transition-all active:scale-95 text-[10px] uppercase tracking-widest">Buy me a Coffee ($5)</button>
            <button onClick={() => handleCoffee(9)} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-semibold text-slate-800 hover:border-rose-400 hover:text-rose-600 shadow-sm transition-all active:scale-95 text-[10px] uppercase tracking-widest">Buy me a Cheesecake ($9)</button>
          </div>
        </div>
      </div>

      <footer className="w-full bg-white mt-12">
        <WordCloudMarquee onItemClick={handleMarqueeItemClick} />
        <div className="py-20 px-10 text-center border-t border-slate-100 bg-[#fcfbf9]">
          <div className="flex justify-center gap-3 mb-8">
             <div className="h-1.5 w-1.5 bg-rose-600 rounded-full"></div>
             <div className="h-1.5 w-1.5 bg-rose-600 rounded-full"></div>
             <div className="h-1.5 w-1.5 bg-rose-600 rounded-full"></div>
          </div>
          <p className="max-w-2xl mx-auto text-[10px] font-semibold text-slate-300 leading-relaxed uppercase tracking-[0.4em]">
            Bridging Cultures Through Flavors • 2025 Edition
          </p>
        </div>
      </footer>

      {showPricing && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md overflow-y-auto p-4 flex items-center justify-center">
           <div className="bg-[#fcfbf9] w-full max-w-5xl rounded-[3rem] relative p-4 md:p-8 animate-in zoom-in duration-300 shadow-2xl">
             <button onClick={() => setShowPricing(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors z-20">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
             
             {totalCredits === 0 && !isUnlimited() && (
               <div className="text-center mb-8 space-y-2 mt-4">
                 <h4 className="text-2xl md:text-3xl font-semibold text-rose-600">You've used your free credits for today.</h4>
                 <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">Want to see more?</p>
               </div>
             )}

             {/* Daily Share Reward Button in Modal */}
             {!hasSharedToday && (
               <div className="max-w-md mx-auto mb-8 text-center">
                 <button 
                   onClick={handleDailyShare}
                   className="w-full group bg-emerald-600 text-white rounded-[2rem] p-6 transition-all active:scale-95 flex flex-col items-center gap-1 shadow-xl hover:bg-emerald-700"
                 >
                   <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80">One-time Daily Bonus</span>
                   <span className="text-xl font-semibold">📢 Share & Get +5 Free Credits</span>
                 </button>
               </div>
             )}
             
             <PricingModule onPurchase={onPurchase} />

             <div className="mt-8 text-center border-t border-slate-100 pt-8">
                <button onClick={() => handleCoffee(2)} className="text-sm font-semibold text-slate-400 hover:text-rose-600 underline underline-offset-4 uppercase tracking-widest transition-colors">
                  Or buy us a Coke ($2) to support the site
                </button>
             </div>
           </div>
        </div>
      )}

      {thankYouPlan && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-12 rounded-[3rem] text-center max-w-sm space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl">✓</div>
            <h3 className="text-3xl font-semibold text-slate-900 leading-tight">Thank You!</h3>
            <p className="text-slate-500 font-medium leading-relaxed italic">
              "Whether it's a Coke in NY or a Baozi in Shanghai, your support keeps this bridge between cultures alive."
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {isUnlimited() ? `Expires: ${new Date(usage.passExpiryDate!).toLocaleDateString()}` : `${totalCredits} Credits Remaining`}
            </div>
            <button onClick={() => setThankYouPlan(null)} className="w-full bg-slate-900 text-white font-semibold py-4 rounded-2xl shadow-lg transition-transform active:scale-95">Start Exploring</button>
          </div>
        </div>
      )}

      {selectedDish && (
        <DishDetailModal 
          dish={selectedDish} 
          onClose={() => setSelectedDish(null)}
          onIngredientClick={(ing: Ingredient) => setWaiterContext({ type: 'ingredient', en: ing.name_en, cn: ing.name_cn })}
          onSpicyClick={() => setWaiterContext({ type: 'spiciness', en: '', cn: '' })}
        />
      )}
      
      {waiterContext && (
        <WaiterCard 
          type={waiterContext.type}
          content_en={waiterContext.en}
          content_cn={waiterContext.cn}
          onClose={() => setWaiterContext(null)} 
        />
      )}

      {showStaffHelper && (
        <StaffHelperModal onClose={() => setShowStaffHelper(false)} />
      )}
    </div>
  );
};

export default App;