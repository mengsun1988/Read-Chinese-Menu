import React, { useState, useRef, useEffect } from 'react';
import { AppStatus, RecognitionMode, StoreResult, Ingredient, UserUsage } from './types';
import { processMenuImage, processStorefrontImage, getDishDeepDetail } from './services/geminiService';
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


  // ... 其余逻辑
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
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [waiterContext, setWaiterContext] = useState<{ type: 'ingredient' | 'spiciness'; content_en: string; content_cn: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  }, [usage]);

  /** PayPal SDK 初始化 */
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
      if (!paypal || !document.getElementById('paypal-button-container')) return;
      paypal.Buttons({
        createOrder: (_: any, actions: any) => actions.order.create({ purchase_units: [{ amount: { value: '5.00' } }] }),
        onApprove: async (_: any, actions: any) => {
          await actions.order.capture();
          onPurchase({ id: 'starter' });
        }
      }).render('#paypal-button-container');
    }
  }, [showPricing]);

  const totalCredits = (usage.freeCredits || 0) + (usage.paidCredits || 0);
  const isUnlimited = () => usage.passExpiryDate ? new Date(usage.passExpiryDate).getTime() > Date.now() : false;
  const getRemainingDays = () => {
    if (!usage.passExpiryDate) return 0;
    const diff = new Date(usage.passExpiryDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const triggerUpload = () => fileInputRef.current?.click();
  const handleModeChange = (newMode: RecognitionMode) => { setMode(newMode); reset(); };
  const reset = () => {
    setStatus(AppStatus.IDLE);
    setDishes([]);
    setStoreResult(null);
    setError(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onPurchase = (plan: any) => {
    setUsage(prev => {
      const updated = { ...prev };
      if (plan.id === 'starter') updated.paidCredits += 60;
      else if (plan.id === 'traveler') updated.passExpiryDate = new Date(Date.now() + 7 * 86400000).toISOString();
      else if (plan.id === 'foodie') updated.passExpiryDate = new Date(Date.now() + 30 * 86400000).toISOString();
      return updated;
    });
    setShowPricing(false);
  };

  const handleDailyShare = async () => {
    const today = getBeijingDate();
    if (usage.lastShareDate === today) { alert("Already claimed today!"); return; }
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Read Chinese Menu', url: window.location.origin });
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        alert("Link copied!");
      }
      setUsage(prev => ({ ...prev, freeCredits: (prev.freeCredits || 0) + 5, lastShareDate: today }));
    } catch (err) { console.log("Share failed", err); }
  };

  const getCompressedBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 1200;
          let w = img.width, h = img.height;
          if (w > MAX || h > MAX) {
            const r = Math.min(MAX / w, MAX / h);
            w *= r; h *= r;
          }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isUnlimited() && totalCredits <= 0) { setShowPricing(true); return; }

    setStatus(AppStatus.LOADING);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);

    try {
      const base64 = await getCompressedBase64(file);
      if (mode === RecognitionMode.MENU) {
        const result = await processMenuImage(base64);
        const list = Array.isArray(result) ? result : (result.dishes || []);
        if (list.length > 0) {
          setDishes(list);
          setStatus(AppStatus.SUCCESS);
        } else throw new Error("No dishes found.");
      } else {
        const result = await processStorefrontImage(base64);
        if (result && (result.name || result.cuisine)) {
          setStoreResult(result);
          setStatus(AppStatus.SUCCESS);
        } else throw new Error("Storefront not recognized.");
      }

      if (!isUnlimited()) {
        setUsage(prev => ({
          ...prev,
          paidCredits: prev.paidCredits > 0 ? prev.paidCredits - 1 : prev.paidCredits,
          freeCredits: prev.paidCredits > 0 ? prev.freeCredits : Math.max(0, prev.freeCredits - 1)
        }));
      }
    } catch (err: any) {
      setError(err.message);
      setStatus(AppStatus.ERROR);
    }
  };

const handleDishClick = async (dish: any) => {
  // 1. 简介增强逻辑：如果描述太少，用做法+食材合成
  let enhancedDesc = dish.description || "";
  
  if (enhancedDesc.length < 10 && dish.ingredients) {
    const cookingMethod = dish.cooking_method || ""; // AI 结果通常包含做法
    const mainIngredients = dish.ingredients
      .slice(0, 3)
      .map((i: any) => typeof i === 'string' ? i : i.name_en)
      .join(', ');
    
    enhancedDesc = cookingMethod 
      ? `A traditional ${cookingMethod} dish featuring ${mainIngredients}.` 
      : `Savory dish prepared with ${mainIngredients}.`;
  }

  // 将增强后的描述存入 dish 对象展示
  const currentDish = { ...dish, description: enhancedDesc };
  setSelectedDish(currentDish);

  if (!dish.isFullyAnalyzed) {
    setLoadingDetail(true);
    try {
      const fullDetails = await getDishDeepDetail(dish.name_cn, dish.name_en);
      if (fullDetails) {
        // 如果深度解析返回了更棒的描述，则使用深度解析的
        const updatedDish = { 
          ...currentDish, 
          ...fullDetails, 
          isFullyAnalyzed: true,
          // 深度解析时再次执行合成逻辑（防止返回内容仍为空）
          description: fullDetails.description || enhancedDesc 
        };
        setSelectedDish(prev => (prev?.id === dish.id ? updatedDish : prev));
        setDishes(prev => prev.map(d => d.id === dish.id ? updatedDish : d));
      }
    } catch (e) { console.error(e); } finally { setLoadingDetail(false); }
  }
};

  return (
    <div className="min-h-screen pb-0 overflow-x-hidden bg-[#fafafa] font-sans">
      <A2HSManager />

      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        {/* Credits Badge */}
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-2xl transition-all">
          <div className={`w-2 h-2 rounded-full ${isUnlimited() ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">
            {isUnlimited() ? `${getRemainingDays()}d Premium` : `Credits: ${totalCredits}`}
          </span>
          {!isUnlimited() && totalCredits <= 3 && (
            <button onClick={() => setShowPricing(true)} className="ml-1 px-2 py-0.5 bg-rose-600 text-white text-[8px] rounded-full font-bold">TOP UP</button>
          )}
        </div>

        <header className="mb-16 space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full mb-4">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
            <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">AI Vision v3.0</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tighter leading-none">
            Read <span className="text-rose-600">Chinese Menu</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] md:text-xs tracking-[0.2em] max-w-xl mx-auto uppercase">
            Identify dishes • Check ingredients • Communicate with staff
          </p>
        </header>

        <main className="mb-20">
          {status === AppStatus.IDLE && (
            <>
              <div className="max-w-xl mx-auto mb-10">
                <button onClick={handleDailyShare} className="w-full bg-emerald-50/50 border border-emerald-100 p-6 rounded-[2.5rem] flex items-center justify-between group hover:bg-emerald-50 transition-all">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">🎁</div>
                    <div>
                      <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Share Bonus</p>
                      <p className="text-sm font-bold text-slate-900">+5 Free Credits Daily</p>
                    </div>
                  </div>
                  <span className="bg-emerald-600 text-white px-4 py-2 rounded-full text-[9px] font-bold">SHARE</span>
                </button>
              </div>

              <div className="flex justify-center mb-8">
                <div className="bg-slate-100/50 p-1.5 rounded-2xl flex gap-1 border border-slate-200/50">
                  <button onClick={() => handleModeChange(RecognitionMode.MENU)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === RecognitionMode.MENU ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Menu</button>
                  <button onClick={() => handleModeChange(RecognitionMode.STREET)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === RecognitionMode.STREET ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'}`}>Street</button>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-12 md:p-20 text-center flex flex-col items-center shadow-xl mb-10 rounded-[3.5rem]">
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <button onClick={triggerUpload} className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-10 shadow-2xl transition-transform active:scale-95 ${mode === RecognitionMode.MENU ? 'bg-rose-600' : 'bg-slate-900'}`}>
                  <CameraIcon className="w-12 h-12 text-white" />
                </button>
                <h2 className="text-3xl font-bold text-slate-900 mb-6">{mode === RecognitionMode.MENU ? "Scan a Menu" : "Identify Storefront"}</h2>
                <button onClick={triggerUpload} className="w-full max-w-xs bg-slate-900 text-white font-bold py-5 rounded-full shadow-xl hover:bg-slate-800 transition-colors">START SCAN</button>
              </div>
            </>
          )}

          {status === AppStatus.LOADING && <LoadingScreen />}

          {status === AppStatus.ERROR && (
            <div className="bg-white border border-rose-100 rounded-[3rem] p-16 text-center space-y-6 shadow-sm">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto"><WarningIcon className="w-10 h-10" /></div>
              <h2 className="text-3xl font-bold text-slate-900">Scan Failed</h2>
              <p className="text-slate-400 text-sm font-medium">{error}</p>
              <button onClick={reset} className="bg-rose-600 text-white font-bold py-4 px-12 rounded-full shadow-lg">TRY AGAIN</button>
            </div>
          )}

          {status === AppStatus.SUCCESS && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center bg-slate-900 p-6 rounded-[2rem] shadow-2xl sticky top-4 z-20 mx-2 border border-white/5">
                <div className="flex items-center gap-4">
                  {previewUrl && <img src={previewUrl} className="w-12 h-12 object-cover rounded-xl ring-2 ring-white/10" alt="Preview" />}
                  <div className="text-left">
                    <h3 className="font-bold text-white tracking-tight">{mode === RecognitionMode.MENU ? "Results" : "Shop Details"}</h3>
                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">{mode === RecognitionMode.MENU ? `${dishes.length} Items` : 'Match Found'}</p>
                  </div>
                </div>
                <button onClick={reset} className="bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-6 rounded-full text-[10px] uppercase tracking-wider backdrop-blur-sm transition-colors border border-white/10">New</button>
              </div>
              
              {mode === RecognitionMode.MENU ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                  {dishes.map((dish, index) => (
                    /* 修复：移除多余的外层包裹 div 和边框，直接渲染 DishCard */
                    <DishCard 
                      key={dish.id || index} 
                      dish={dish} 
                      onClick={() => handleDishClick(dish)} 
                    />
                  ))}
                </div>
              ) : (storeResult && <StoreCard store={storeResult} onShowStaff={() => setShowStaffHelper(true)} />)}
            </div>
          )}
        </main>
        
        {status !== AppStatus.SUCCESS && (
          <div className="space-y-24 mt-32">
            <PricingModule onPurchase={onPurchase} />
            <AboutUs />
            <Reviews />
            <SupportSection onPurchase={onPurchase} />
          </div>
        )}
      </div>

      <Footer 
        onMenuScan={() => handleModeChange(RecognitionMode.MENU)} 
        onStreetScan={() => handleModeChange(RecognitionMode.STREET)} 
        onPricing={() => setShowPricing(true)} 
        onPrivacy={() => setLegalView('privacy')} 
        onTos={() => setLegalView('tos')} 
      />

      {showPricing && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md overflow-y-auto p-4 flex items-center justify-center">
          <div className="bg-[#fcfbf9] w-full max-w-4xl rounded-[3rem] relative p-8 shadow-2xl overflow-hidden">
            <button onClick={() => setShowPricing(false)} className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-600 text-xl font-bold transition-colors">✕</button>
            <PricingModule onPurchase={onPurchase} />
            <div className="mt-8 max-w-sm mx-auto" id="paypal-button-container"></div>
          </div>
        </div>
      )}

      {selectedDish && (
        <DishDetailModal 
          dish={selectedDish} 
          onClose={() => setSelectedDish(null)}
          onIngredientClick={(ing: Ingredient) => setWaiterContext({ type: 'ingredient', content_en: ing.name_en, content_cn: ing.name_cn })}
          onSpicyClick={() => setWaiterContext({ type: 'spiciness', content_en: 'Spiciness', content_cn: '辣度' })}
          isLoadingDetail={loadingDetail}
        />
      )}

      {waiterContext && <WaiterCard {...waiterContext} onClose={() => setWaiterContext(null)} />}
      {showStaffHelper && <StaffHelperModal onClose={() => setShowStaffHelper(false)} />}
      {legalView && <LegalModal type={legalView} onClose={() => setLegalView(null)} />}
    </div>
  );
};

export default App;