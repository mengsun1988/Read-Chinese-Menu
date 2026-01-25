import React, { useState, useRef, useEffect } from 'react';
import { AppStatus, Dish, UserUsage, RecognitionMode, StoreResult, Ingredient } from './types';
// Extend StoreResult type to include required properties
interface ExtendedStoreResult extends StoreResult {
  name?: string;
  cuisine?: string;
  [key: string]: any; // Allow additional properties
}
// 🆕 导入新增的 getDishDeepDetail
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
  // 🆕 新增：详情加载状态
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [waiterContext, setWaiterContext] = useState<{ type: 'ingredient' | 'spiciness'; content_en: string; content_cn: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  }, [usage]);

  /** PayPal SDK 注入 */
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

  const totalCredits = (usage.freeCredits || 0) + (usage.paidCredits || 0);
  const isUnlimited = () => usage.passExpiryDate ? new Date(usage.passExpiryDate).getTime() > Date.now() : false;
  const getRemainingDays = () => {
    if (!usage.passExpiryDate) return 0;
    const diff = new Date(usage.passExpiryDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const triggerUpload = () => fileInputRef.current?.click();

  const handleModeChange = (newMode: RecognitionMode) => {
    setMode(newMode);
    reset();
  };

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
  };

  const handleDailyShare = async () => {
    const today = getBeijingDate();
    if (usage.lastShareDate === today) {
      alert("You've already claimed your share bonus for today!");
      return;
    }
    const shareData = {
      title: 'Read Chinese Menu',
      text: 'Check out this amazing AI tool for decoding Chinese menus!',
      url: window.location.origin,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        alert("Link copied! Share it with your friends to claim your bonus.");
      }
      setUsage(prev => ({ ...prev, freeCredits: (prev.freeCredits || 0) + 5, lastShareDate: today }));
      alert("Success! 5 Bonus Credits Added! 🎁");
    } catch (err) { console.log("Share cancelled", err); }
  };

  /** * 极简图片压缩逻辑 */
  const getCompressedBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl.split(',')[1]);
        };
        img.onerror = () => reject(new Error("Image Load Failed"));
      };
      reader.onerror = () => reject(new Error("File Read Failed"));
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isUnlimited() && totalCredits <= 0) {
      setShowPricing(true);
      return;
    }

    setStatus(AppStatus.LOADING);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);

    try {
      const base64ForAI = await getCompressedBase64(file);

      if (mode === RecognitionMode.MENU) {
        const result = await processMenuImage(base64ForAI);
        const dishesArray = Array.isArray(result) ? result : (result.dishes || []);
        if (dishesArray.length > 0) {
          setDishes(dishesArray);
          setStoreResult(null);
          setStatus(AppStatus.SUCCESS);
        } else {
          throw new Error("No dishes identified. Please try a closer, clearer photo.");
        }
      } else {
        const result = await processStorefrontImage(base64ForAI);
        if (result && (result.name || result.cuisine)) {
          setStoreResult(result);
          setDishes([]);
          setStatus(AppStatus.SUCCESS);
        } else {
          throw new Error("Storefront not recognized. Try showing the sign more clearly.");
        }
      }

      if (!isUnlimited()) {
        setUsage(prev => ({
          ...prev,
          paidCredits: prev.paidCredits > 0 ? prev.paidCredits - 1 : prev.paidCredits,
          freeCredits: prev.paidCredits > 0 ? prev.freeCredits : Math.max(0, prev.freeCredits - 1)
        }));
      }

    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(err.message || "Request failed. Check your connection or photo size.");
      setStatus(AppStatus.ERROR);
    }
  };

  // 🆕 核心修改：分步加载详情逻辑
  const handleDishClick = async (dish: any) => {
    // 1. 先展示已有数据，弹窗秒开
    setSelectedDish(dish);
    
    // 2. 如果之前没解析过深度详情，则发起异步请求
    if (!dish.isFullyAnalyzed) {
      setLoadingDetail(true);
      try {
        const fullDetails = await getDishDeepDetail(dish.name_cn, dish.name_en);
        
        if (fullDetails) {
          // 3. 更新当前选中的菜品数据，弹窗会自动更新显示内容
          setSelectedDish(prev => (prev?.id === dish.id ? { ...prev, ...fullDetails } : prev));
          
          // 4. 同步更新列表中的数据，防止下次点击同一菜品再次请求
          setDishes(prevDishes => prevDishes.map(d => 
            d.id === dish.id ? { ...d, ...fullDetails } : d
          ));
        }
      } catch (e) {
        console.error("Failed to load deep details", e);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  return (
    <div className="min-h-screen selection:bg-rose-600 selection:text-white pb-0 overflow-x-hidden bg-[#fafafa]">
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
                  <button onClick={() => handleModeChange(RecognitionMode.MENU)} className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === RecognitionMode.MENU ? 'bg-white text-rose-600 shadow-md scale-105' : 'text-slate-400'}`}>Scan Menu</button>
                  <button onClick={() => handleModeChange(RecognitionMode.STREET)} className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === RecognitionMode.STREET ? 'bg-slate-900 text-white shadow-md scale-105' : 'text-slate-400'}`}>Scan Storefront</button>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-12 md:p-20 text-center flex flex-col items-center shadow-xl mb-10 rounded-[3rem]">
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <button onClick={triggerUpload} className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-10 shadow-2xl transition-transform active:scale-90 hover:scale-105 ${mode === RecognitionMode.MENU ? 'bg-rose-600 shadow-rose-200' : 'bg-slate-900 shadow-slate-200'}`}>
                  <CameraIcon className="w-12 h-12 text-white" />
                </button>
                <h2 className="text-4xl font-semibold text-slate-900 mb-2">{mode === RecognitionMode.MENU ? "What's on the Menu?" : "What's this Store?"}</h2>
                <button onClick={triggerUpload} className="w-full max-w-xs bg-slate-900 text-white font-semibold py-5 rounded-full shadow-lg mt-8">📁 Upload or Capture</button>
              </div>
            </>
          )}

          {status === AppStatus.LOADING && <div className="bg-white p-12 rounded-[3rem] shadow-2xl"><LoadingScreen /></div>}

          {status === AppStatus.ERROR && (
            <div className="bg-white border-2 border-rose-100 rounded-[3rem] p-20 text-center space-y-8 shadow-sm">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-rose-50 text-rose-600 rounded-full"><WarningIcon className="w-12 h-12" /></div>
              <h2 className="text-4xl font-semibold text-slate-900">Scan Failed</h2>
              <p className="text-slate-500 max-w-sm mx-auto font-medium text-lg">{error}</p>
              <button onClick={reset} className="bg-rose-600 text-white font-semibold py-4 px-12 rounded-full shadow-xl">Try Again</button>
            </div>
          )}

          {status === AppStatus.SUCCESS && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl sticky top-6 z-20">
                <div className="flex items-center gap-6">
                  {previewUrl && <img src={previewUrl} className="w-20 h-20 object-cover rounded-2xl border-2 border-white/10" alt="Preview" />}
                  <div className="text-left">
                    <h3 className="font-semibold text-2xl text-white tracking-tight">{mode === RecognitionMode.MENU ? "Dish List" : "Shop Guide"}</h3>
                    <p className="text-sm font-medium text-rose-400 uppercase tracking-widest">{mode === RecognitionMode.MENU ? `${dishes.length} Matches` : 'Storefront Identified'}</p>
                  </div>
                </div>
                <button onClick={reset} className="bg-white text-slate-900 font-semibold py-4 px-8 rounded-full shadow-xl text-sm">New Scan</button>
              </div>
              
              {mode === RecognitionMode.MENU ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                  {dishes.map((dish, index) => (
                    <div key={dish.id || index} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                      {/* 🆕 修改：点击调用新的 handleDishClick */}
                      <DishCard dish={dish} onClick={() => handleDishClick(dish)} />
                    </div>
                  ))}
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

      <Footer onMenuScan={() => handleModeChange(RecognitionMode.MENU)} onStreetScan={() => handleModeChange(RecognitionMode.STREET)} onPricing={() => setShowPricing(true)} onPrivacy={() => setLegalView('privacy')} onTos={() => setLegalView('tos')} />

      {/* Pricing Modal */}
      {showPricing && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md overflow-y-auto p-4 flex items-center justify-center">
          <div className="bg-[#fcfbf9] w-full max-w-5xl rounded-[3rem] relative p-8 animate-in zoom-in shadow-2xl">
            <button onClick={() => setShowPricing(false)} className="absolute top-8 right-8 p-2 text-slate-400 text-2xl hover:text-slate-600">✕</button>
            <PricingModule onPurchase={onPurchase} />
            <div className="mt-12"><div id="paypal-button-container"></div></div>
          </div>
        </div>
      )}

      {selectedDish && (
        <DishDetailModal 
          dish={selectedDish} 
          onClose={() => setSelectedDish(null)}
          onIngredientClick={(ing: Ingredient) => setWaiterContext({ type: 'ingredient', content_en: ing.name_en, content_cn: ing.name_cn })}
          onSpicyClick={() => setWaiterContext({ type: 'spiciness', content_en: 'Spiciness', content_cn: '辣度' })}
          isLoadingDetail={loadingDetail} // 🆕 传入详情加载状态
        />
      )}

      {waiterContext && <WaiterCard {...waiterContext} onClose={() => setWaiterContext(null)} />}
      {showStaffHelper && <StaffHelperModal onClose={() => setShowStaffHelper(false)} />}
      {legalView && <LegalModal type={legalView} onClose={() => setLegalView(null)} />}
    </div>
  );
};

export default App;