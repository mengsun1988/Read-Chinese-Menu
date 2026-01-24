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
    localStorage.setItem(TIP_STORAGE_KEY, (new Date().getTime() + 86400000).toString());
  };

  const isUnlimited = () => usage.passExpiryDate ? new Date(usage.passExpiryDate).getTime() > Date.now() : false;
  const totalCredits = (usage.freeCredits || 0) + (usage.paidCredits || 0);

  const spendCredit = (): boolean => {
    if (isUnlimited()) return true;
    if (totalCredits <= 0) {
      setShowPricing(true);
      return false;
    }
    setUsage(prev => {
      const u = { ...prev };
      if (u.freeCredits > 0) u.freeCredits--;
      else if (u.paidCredits > 0) u.paidCredits--;
      return u;
    });
    return true;
  };

  const handleDailyShare = async () => {
    const today = getBeijingDate();
    if (usage.lastShareDate === today) return alert("Already claimed today!");
    try {
      const data = { title: 'Read Chinese Menu', url: window.location.origin };
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(window.location.origin);
        alert("Link copied!");
      }
      setUsage(prev => ({ ...prev, freeCredits: prev.freeCredits + 5, lastShareDate: today }));
      alert("Success! +5 Credits.");
    } catch (e) { console.warn(e); }
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
          const result = await processMenuImage(base64);
          const raw = Array.isArray(result) ? result : (result?.dishes || []);
          const clean = raw.map((d: any, i: number) => ({
            id: d.id || `d-${i}`,
            name_cn: d.name_cn || d.dish_name || "未知",
            name_en: d.name_en || d.english_name || "Unknown",
            price: String(d.price || ""),
            description: d.description || "",
            ingredients: Array.isArray(d.ingredients) ? d.ingredients : [],
            dietary_flags: Array.isArray(d.dietary_flags) ? d.dietary_flags : [],
            spiciness_level: Number(d.spiciness_level) || 0
          }));
          if (!clean.length) throw new Error("No items found.");
          setDishes(clean);
        } else {
          setStoreResult(await processStorefrontImage(base64));
        }
        setStatus(AppStatus.SUCCESS);
      } catch (err: any) {
        setError(err.message || "Failed to read image.");
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

  const onPurchase = (plan: any) => {
    setUsage(prev => {
      const u = { ...prev };
      if (plan.id === 'starter') u.paidCredits = (u.paidCredits || 0) + 60;
      else {
        const days = plan.id === 'traveler' ? 7 : 30;
        u.passExpiryDate = new Date(Date.now() + days * 86400000).toISOString();
      }
      return u;
    });
    setShowPricing(false);
  };

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className="min-h-screen selection:bg-rose-600 selection:text-white bg-[#fcfbf9] font-['Roboto']">
      {/* 1. PWA Tip (Custom font Poppins applied) */}
      {showAppTip && status === AppStatus.IDLE && (
        <div className="fixed top-4 right-4 z-[110] flex flex-col items-end gap-3 pointer-events-none animate-in fade-in duration-500">
          <div className="bg-[#e11d48] text-white px-5 py-3 rounded-2xl shadow-2xl relative pointer-events-auto font-['Poppins']">
            <button onClick={handleDismissTip} className="absolute -top-2 -left-2 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-white/60 text-[10px]">✕</button>
            <p className="text-[11px] font-semibold uppercase tracking-widest leading-tight text-center">
              {isIOS ? <>Tap "Share" then<br/>"Add to Home Screen"</> : <>Tap "⋮" then<br/>"Install App"</>}
            </p>
            <div className="absolute top-0 right-6 -mt-2 w-4 h-4 bg-[#e11d48] rotate-45"></div>
          </div>
        </div>
      )}

      <A2HSManager />
      
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        {/* Credits Badge */}
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-2xl font-['Poppins']">
          <div className={`w-2.5 h-2.5 rounded-full ${isUnlimited() ? 'bg-emerald-500 animate-pulse' : 'bg-[#e11d48]'}`}></div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-900">
            {isUnlimited() ? 'Unlimited' : `Credits: ${totalCredits}`}
          </span>
        </div>

        {/* Header */}
        <header className="mb-16 text-center space-y-6">
          <div className="flex items-center gap-4 mb-2 opacity-30">
            <div className="h-px bg-slate-900 flex-1"></div>
            <div className="text-[10px] font-bold uppercase tracking-[0.4em] font-['Poppins']">Explorer Edition</div>
            <div className="h-px bg-slate-900 flex-1"></div>
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold text-slate-900 tracking-tighter leading-none font-['Poppins']">
            Read <span className="text-[#e11d48]">Chinese Menu</span>
          </h1>
          <p className="text-[#e11d48] font-bold uppercase tracking-widest text-[10px] font-['Poppins']">No registration. Scan and eat.</p>
        </header>

        <main className="mb-20">
          {status === AppStatus.IDLE && (
            <div className="space-y-10 animate-in fade-in duration-700">
              {/* Daily Reward */}
              <button onClick={handleDailyShare} className="max-w-xs mx-auto w-full bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col items-center gap-1 hover:bg-emerald-100 transition-colors">
                <span className="text-[10px] font-bold uppercase text-emerald-600 font-['Poppins']">Daily Reward</span>
                <span className="text-sm font-semibold text-slate-900">📢 Share for +5 Credits</span>
              </button>

              {/* Mode Switcher */}
              <div className="flex justify-center">
                <div className="bg-slate-200/50 p-1 rounded-2xl flex gap-1 font-['Poppins']">
                  <button onClick={() => setMode(RecognitionMode.MENU)} className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mode === RecognitionMode.MENU ? 'bg-white text-[#e11d48] shadow-sm' : 'text-slate-500'}`}>Menu</button>
                  <button onClick={() => setMode(RecognitionMode.STREET)} className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mode === RecognitionMode.STREET ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500'}`}>Street</button>
                </div>
              </div>

              {/* Upload Card */}
              <div className="bg-white p-12 md:p-20 text-center flex flex-col items-center shadow-2xl rounded-[3rem] border border-slate-100">
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <button onClick={() => fileInputRef.current?.click()} className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-10 shadow-2xl active:scale-90 transition-transform ${mode === RecognitionMode.MENU ? 'bg-[#e11d48]' : 'bg-slate-900'}`}>
                  <CameraIcon className="w-10 h-10 text-white" />
                </button>
                <h2 className="text-3xl font-semibold text-slate-900 mb-8 font-['Poppins']">{mode === RecognitionMode.MENU ? "What's on the Menu?" : "Identify this Store"}</h2>
                <button onClick={() => fileInputRef.current?.click()} className="w-full max-w-xs bg-slate-900 text-white font-bold py-5 rounded-2xl shadow-lg font-['Poppins'] uppercase tracking-widest text-xs">📁 Upload Photo</button>
              </div>

              <div className="space-y-32 mt-20">
                <PricingModule onPurchase={onPurchase} />
                <AboutUs />
                <Reviews />
                <div className="text-center pb-10">
                   <button onClick={() => window.location.href='https://www.paypal.com/paypalme/yourhandle/5'} className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full text-slate-600 font-bold hover:bg-slate-50 transition-all font-['Poppins'] text-xs shadow-sm">☕ Buy me a treat ($5)</button>
                </div>
              </div>
            </div>
          )}

          {status === AppStatus.LOADING && <LoadingScreen />}

          {status === AppStatus.SUCCESS && (
            <div className="space-y-12 animate-in slide-in-from-bottom-5 duration-700">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl sticky top-6 z-20">
                <div className="flex items-center gap-6">
                  {previewUrl && <img src={previewUrl} className="w-20 h-20 object-cover rounded-2xl border-2 border-white/10" alt="Preview" />}
                  <div className="font-['Poppins']">
                    <h3 className="font-semibold text-2xl text-white tracking-tight">{mode === RecognitionMode.MENU ? "Results" : "Shop Info"}</h3>
                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">{mode === RecognitionMode.MENU ? `${dishes.length} Items Found` : 'Identified'}</p>
                  </div>
                </div>
                <button onClick={reset} className="bg-white text-slate-900 font-bold py-4 px-10 rounded-2xl font-['Poppins'] text-xs uppercase tracking-widest">New Scan</button>
              </div>

              {mode === RecognitionMode.MENU ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {dishes.map((dish, i) => <DishCard key={dish.id || i} dish={dish} onClick={() => setSelectedDish(dish)} />)}
                </div>
              ) : (
                storeResult && <StoreCard store={storeResult} onShowStaff={() => setShowStaffHelper(true)} />
              )}
            </div>
          )}

          {status === AppStatus.ERROR && (
            <div className="bg-white border-2 border-rose-50 rounded-[3rem] p-20 text-center space-y-8 font-['Poppins']">
              <WarningIcon className="w-12 h-12 text-[#e11d48] mx-auto" />
              <h2 className="text-3xl font-semibold">Scan Error</h2>
              <p className="text-slate-500 max-w-sm mx-auto text-sm">{error}</p>
              <button onClick={reset} className="bg-[#e11d48] text-white font-bold py-4 px-12 rounded-2xl shadow-lg uppercase tracking-widest text-xs">Try Again</button>
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

      {selectedDish && (
        <DishDetailModal 
          dish={selectedDish} onClose={() => setSelectedDish(null)}
          onIngredientClick={(ing) => setWaiterContext({ type: 'ingredient', content_en: ing.name_en, content_cn: ing.name_cn })}
          onSpicyClick={() => setWaiterContext({ type: 'spiciness', content_en: 'Spiciness', content_cn: '辣度' })}
        />
      )}

      {showPricing && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fcfbf9] rounded-[3rem] p-8 relative max-w-5xl w-full shadow-2xl overflow-y-auto max-h-[95vh] animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowPricing(false)} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full text-slate-400">✕</button>
            <PricingModule onPurchase={onPurchase} />
          </div>
        </div>
      )}
      
      {waiterContext && <WaiterCard {...waiterContext} onClose={() => setWaiterContext(null)} />}
      {showStaffHelper && <StaffHelperModal onClose={() => setShowStaffHelper(false)} />}
      {legalView && <LegalModal type={legalView} onClose={() => setLegalView(null)} />}
    </div>
  );
};

export default App;