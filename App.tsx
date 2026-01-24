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
  const [dishes, setDishes] = useState<any[]>([]);
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
    } catch (e) { console.warn("Usage parsing failed", e); }
    return { freeCredits: 15, paidCredits: 0, lastResetDate: todayStr };
  });

  const [selectedDish, setSelectedDish] = useState<any | null>(null);
  const [waiterContext, setWaiterContext] = useState<{ type: 'ingredient' | 'spiciness'; content_en: string; content_cn: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  }, [usage]);

  useEffect(() => {
    if (!showPricing) return;
    if ((window as any).paypal) { renderPaypal(); return; }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=AdY7cjJGhxSVjZOPZr-LoHhX8JHtyQfNjmr6I8HjO4cv3cqW_U2zr1hpxa67nU8o4i6GoH0sFIh0P1aS&currency=USD&intent=capture`;
    script.async = true;
    script.onload = renderPaypal;
    document.body.appendChild(script);

    function renderPaypal() {
      const paypal = (window as any).paypal;
      if (!paypal) return;
      paypal.Buttons({
        createOrder: (_: any, actions: any) => actions.order.create({ purchase_units: [{ amount: { value: '5.00' } }] }),
        onApprove: async (_: any, actions: any) => {
          await actions.order.capture();
          alert('Payment successful!');
          onPurchase({ id: 'starter' });
        },
        onError: (err: any) => console.error('PayPal error', err)
      }).render('#paypal-button-container');
    }
  }, [showPricing]);

  const totalCredits = usage.freeCredits + usage.paidCredits;
  const isUnlimited = () => usage.passExpiryDate ? new Date(usage.passExpiryDate).getTime() > Date.now() : false;
  const getRemainingDays = () => {
    if (!usage.passExpiryDate) return 0;
    const diff = new Date(usage.passExpiryDate).getTime() - Date.now();
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
    setUsage(prev => {
      const updated = { ...prev };
      if (plan.id === 'starter') updated.paidCredits += 60;
      else if (plan.id === 'traveler') updated.passExpiryDate = new Date(Date.now() + 7 * 86400000).toISOString();
      else if (plan.id === 'foodie') updated.passExpiryDate = new Date(Date.now() + 30 * 86400000).toISOString();
      return updated;
    });
  };

const handleDailyShare = async () => {
    const today = getBeijingDate();
    
    // 1. 检查今天是否领过
    if (usage.lastShareDate === today) {
      alert("You've already claimed your share bonus for today!");
      return;
    }

    // 2. 准备分享内容
    const shareData = {
      title: 'Read Chinese Menu',
      text: 'Check out this amazing AI tool for decoding Chinese menus!',
      url: window.location.origin,
    };

    try {
      // 3. 调用系统原生分享接口
      if (navigator.share) {
        await navigator.share(shareData);
        // 执行到这里说明分享成功（或调起了分享面板并返回）
      } else {
        // 4. 降级方案：不支持原生分享的浏览器（如部分 PC 浏览器）
        await navigator.clipboard.writeText(window.location.origin);
        alert("Link copied! Share it with your friends to claim your bonus.");
      }

      // 5. 分享动作完成后再发放奖励
      setUsage(prev => ({
        ...prev,
        freeCredits: prev.freeCredits + 5,
        lastShareDate: today
      }));
      
      alert("Success! 5 Bonus Credits Added! 🎁");

    } catch (err) {
      // 如果用户取消分享或分享失败，不发放奖励
      console.log("Share failed or cancelled", err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isUnlimited() && totalCredits <= 0) { setShowPricing(true); return; }

    setStatus(AppStatus.LOADING);
    setPreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        if (mode === RecognitionMode.MENU) {
          const result = await processMenuImage(base64);
          setDishes(result);
        } else {
          const result = await processStorefrontImage(base64);
          setStoreResult(result);
        }
        if (!isUnlimited()) {
          setUsage(prev => prev.paidCredits > 0 ? { ...prev, paidCredits: prev.paidCredits - 1 } : { ...prev, freeCredits: prev.freeCredits - 1 });
        }
        setStatus(AppStatus.SUCCESS);
      } catch (err: any) {
        setError(err.message || "Failed to process image.");
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
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-2xl hover:scale-105 transition-transform">
          <div className={`w-2.5 h-2.5 rounded-full ${isUnlimited() ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-900">
            {isUnlimited() ? `Unlimited Access (${getRemainingDays()}d left)` : `Credits: ${totalCredits}`}
          </span>
          {!isUnlimited() && totalCredits <= 3 && (
            <button onClick={() => setShowPricing(true)} className="ml-2 px-2 py-0.5 bg-rose-600 text-white text-[8px] rounded-full font-medium">Top Up</button>
          )}
        </div>

        <header className="mb-16 space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full mb-4">
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
                  <div className="bg-emerald-600 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest">Claim Now</div>
                </button>
              </div>

              <div className="flex justify-center mb-8">
                <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 shadow-inner">
                  <button onClick={() => setMode(RecognitionMode.MENU)} className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === RecognitionMode.MENU ? 'bg-white text-rose-600 shadow-md scale-105' : 'text-slate-400'}`}>Scan Menu</button>
                  <button onClick={() => setMode(RecognitionMode.STREET)} className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === RecognitionMode.STREET ? 'bg-slate-900 text-white shadow-md scale-105' : 'text-slate-400'}`}>Scan Storefront</button>
                </div>
              </div>

              <div className="modern-card p-12 md:p-20 text-center flex flex-col items-center shadow-xl mb-10 rounded-[3rem]">
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <button onClick={triggerUpload} className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-10 shadow-2xl transition-transform active:scale-90 hover:scale-105 ${mode === RecognitionMode.MENU ? 'bg-rose-600 shadow-rose-200' : 'bg-slate-900 shadow-slate-200'}`}>
                  <CameraIcon className="w-12 h-12 text-white" />
                </button>
                <h2 className="text-4xl font-semibold text-slate-900 mb-2">{mode === RecognitionMode.MENU ? "What's on the Menu?" : "What's this Store?"}</h2>
                <button onClick={triggerUpload} className="w-full max-w-xs bg-slate-900 text-white font-semibold py-5 rounded-full shadow-lg mt-8">📁 Upload or Capture</button>
              </div>
            </>
          )}

          {status === AppStatus.LOADING && <div className="modern-card overflow-hidden shadow-2xl rounded-[3rem]"><LoadingScreen /></div>}

          {status === AppStatus.ERROR && (
            <div className="bg-white border-2 border-rose-100 rounded-[3rem] p-20 text-center space-y-8 shadow-sm">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-rose-50 text-rose-600 rounded-full"><WarningIcon className="w-12 h-12" /></div>
              <h2 className="text-4xl font-semibold text-slate-900">Scan Failed</h2>
              <p className="text-slate-500 max-sm mx-auto font-medium text-lg">{error}</p>
              <button onClick={reset} className="bg-rose-600 text-white font-semibold py-4 px-12 rounded-full shadow-xl">Try Again</button>
            </div>
          )}

          {status === AppStatus.SUCCESS && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl sticky top-6 z-20">
                <div className="flex items-center gap-6">
                  {previewUrl && <img src={previewUrl} className="w-24 h-24 object-cover rounded-2xl border-2 border-white/10" alt="Preview" />}
                  <div className="text-left">
                    <h3 className="font-semibold text-3xl text-white tracking-tight">{mode === RecognitionMode.MENU ? "Dish List" : "Shop Guide"}</h3>
                    <p className="text-sm font-medium text-rose-400 uppercase tracking-widest">{mode === RecognitionMode.MENU ? `${dishes.length} Matches` : 'Storefront Identified'}</p>
                  </div>
                </div>
                <button onClick={reset} className="bg-white text-slate-900 font-semibold py-5 px-10 rounded-full shadow-xl">New Scan</button>
              </div>
              {mode === RecognitionMode.MENU ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {Array.isArray(dishes) && dishes.map((dish, index) => <DishCard key={index} dish={dish} onClick={() => setSelectedDish(dish)} />)}
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

      <Footer onMenuScan={() => { setMode(RecognitionMode.MENU); reset(); }} onStreetScan={() => { setMode(RecognitionMode.STREET); reset(); }} onPricing={() => setShowPricing(true)} onPrivacy={() => setLegalView('privacy')} onTos={() => setLegalView('tos')} />

      {showPricing && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md overflow-y-auto p-4 flex items-center justify-center">
          <div className="bg-[#fcfbf9] w-full max-w-5xl rounded-[3rem] relative p-8 animate-in zoom-in shadow-2xl">
            <button onClick={() => setShowPricing(false)} className="absolute top-6 right-6 p-2 text-slate-400 text-2xl">✕</button>
            <PricingModule onPurchase={onPurchase} />
            <div className="mt-12"><div id="paypal-button-container"></div></div>
          </div>
        </div>
      )}

      {selectedDish && (
        <DishDetailModal 
          dish={selectedDish} onClose={() => setSelectedDish(null)}
          onIngredientClick={(ing: Ingredient) => setWaiterContext({ type: 'ingredient', content_en: ing.name_en, content_cn: ing.name_cn })}
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