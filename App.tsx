import React, { useState, useRef, useEffect } from 'react';
import { AppStatus, RecognitionMode, Ingredient, StoreResult } from './types';
import { processMenuImage, processStorefrontImage, getDishDeepDetail } from './services/geminiService';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

// 基础组件
import { DishCard } from './components/DishCard';
import { LoadingScreen } from './components/LoadingScreen';
import { WarningIcon } from './components/Icons';
import { DishDetailModal } from './components/DishDetailModal';
import { WaiterCard } from './components/WaiterCard';
import { PricingModule } from './components/PricingModule';
import { A2HSManager } from './components/A2HSManager';
import { StoreCard } from './components/StoreCard';
import { StaffHelperModal } from './components/StaffHelperModal';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModals';
import { SurvivalCardView } from './components/SurvivalCardView'; 

// 逻辑、视图与动画
import { useUserUsage } from './hooks/useUserUsage';
import { HomeIdleView } from './views/HomeIdleView';
import { EffectLayer } from './components/EffectLayer';

const App: React.FC = () => {
  const { usage, setUsage, totalCredits, isUnlimited, handleDailyShare } = useUserUsage();

  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [mode, setMode] = useState<RecognitionMode>(RecognitionMode.MENU);
  const [dishes, setDishes] = useState<any[]>([]);
  const [storeResult, setStoreResult] = useState<StoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [showPricing, setShowPricing] = useState(false);
  const [showStaffHelper, setShowStaffHelper] = useState(false);
  const [showSurvival, setShowSurvival] = useState(false); 
  const [legalView, setLegalView] = useState<'privacy' | 'tos' | null>(null);
  
  const [selectedDish, setSelectedDish] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [waiterContext, setWaiterContext] = useState<{ type: 'ingredient' | 'spiciness'; content_en: string; content_cn: string } | null>(null);
  
  const [countdown, setCountdown] = useState(5);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerUpload = () => fileInputRef.current?.click();
  const handleModeChange = (newMode: RecognitionMode) => { setMode(newMode); reset(); };
  
  const reset = () => {
    setStatus(AppStatus.IDLE);
    setDishes([]);
    setStoreResult(null);
    setError(null);
    setPreviewUrl(null);
    setCountdown(5);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    let timer: any;
    if (status === AppStatus.ERROR && error === "OUT_OF_CREDITS" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (status === AppStatus.ERROR && error === "OUT_OF_CREDITS" && countdown === 0) {
      reset();
    }
    return () => clearInterval(timer);
  }, [status, error, countdown]);

  const scrollToCamera = () => {
    const element = document.getElementById('camera-section');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleGameWin = () => {
    setUsage(prev => ({
      ...prev,
      credits: (prev.credits || 0) + 10,
      achievementTriggered: 'game_win_reward'
    }));
  };

  const getCompressedBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
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
          const base = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
          if (base) resolve(base);
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // --- 1. 预检查余额 (防止浪费网络请求) ---
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const needsCredits = mode === RecognitionMode.MENU && !isUnlimited() && !isLocalhost;

    // 根据后端逻辑，菜单识别需要 50 点
    if (needsCredits && (usage.credits || 0) < 50) {
      setStatus(AppStatus.ERROR);
      setError("OUT_OF_CREDITS");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setStatus(AppStatus.LOADING);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);

    try {
      const base64 = await getCompressedBase64(file);
      
      if (mode === RecognitionMode.MENU) {
        const result = await processMenuImage(base64);
        
        // --- 2. 识别成功判定 ---
        if (result && result.dishes && result.dishes.length > 0) {
          setDishes(result.dishes);
          setStatus(AppStatus.SUCCESS);
          
          // 只有成功识别（后端已扣点）才更新本地 Credit 状态
          if (result.usage) {
            setUsage(prev => ({
              ...prev,
              credits: result.usage.credits,
              scanCount: result.usage.scanCount,
              achievementTriggered: result.usage.achievementTriggered || prev.achievementTriggered
            }));
          }
        } else {
          // AI 返回了 200 但 dishes 为空：不扣点，直接报错
          throw new Error("No dishes detected. Please ensure the menu is clear. No credits were charged.");
        }
      } else {
        // 店面模式识别 (免费)
        const rawResult = await processStorefrontImage(base64);
        if (rawResult && rawResult.name_cn) {
          setStoreResult(rawResult);
          setStatus(AppStatus.SUCCESS);
        } else {
          throw new Error("Could not identify the storefront. Try a different angle.");
        }
      }
    } catch (err: any) {
      // 捕获后端返回的 403 OUT_OF_CREDITS 错误
      if (err.message?.includes("OUT_OF_CREDITS")) {
        setError("OUT_OF_CREDITS");
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
      setStatus(AppStatus.ERROR);
    }
  };

  const onPurchase = (plan: any) => {
    setUsage(prev => {
      const updated = { ...prev };
      if (plan.id.endsWith('-day')) {
        const days = parseInt(plan.id.split('-')[0]);
        const msToAdd = days * 86400000;
        const currentExpiry = updated.passExpiryDate ? new Date(updated.passExpiryDate).getTime() : Date.now();
        const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
        updated.passExpiryDate = new Date(baseTime + msToAdd).toISOString();
        updated.achievementTriggered = 'purchase_bonus';
      } else if (plan.id === 'donation') {
        const creditsMap: Record<number, number> = { 3.99: 500, 7.99: 1000, 15.99: 2500 };
        const creditsToAdd = creditsMap[plan.amount] || 500;
        updated.credits = (updated.credits || 0) + creditsToAdd;
        updated.achievementTriggered = 'donation_bonus';
      }
      return updated;
    });
    setShowPricing(false);
  };

  const handleDishClick = async (dish: any) => {
    setSelectedDish(dish);
    if (!dish.isFullyAnalyzed) {
      setLoadingDetail(true);
      try {
        const deepInfo = await getDishDeepDetail(dish.name_cn, dish.name_en);
        if (deepInfo) {
          const updatedDish = { ...dish, ...deepInfo, isFullyAnalyzed: true };
          setSelectedDish(updatedDish);
          setDishes(prev => prev.map(d => d.id === dish.id ? updatedDish : d));
        }
      } catch (e) {
        console.error("Analysis Failed:", e);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  return (
    <PayPalScriptProvider options={{ 
      clientId: "AdY7cjJGhxSVjZOPZr-LoHhX8JHtyQfNjmr6I8HjO4cv3cqW_U2zr1hpxa67nU8o4i6GoH0sFIh0P1aS",
      currency: "USD",
      intent: "capture"
    }}>
      <div className="min-h-screen pb-0 bg-slate-50 font-sans w-full">
        <EffectLayer 
          trigger={usage.achievementTriggered} 
          onComplete={() => setUsage(prev => ({ ...prev, achievementTriggered: null }))} 
        />

        <A2HSManager />
        
        <main className="w-full relative">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

          {status === AppStatus.IDLE && (
            <HomeIdleView 
              mode={mode}
              onModeChange={handleModeChange}
              onTriggerUpload={triggerUpload}
              onOpenSurvival={() => setShowSurvival(true)}
              onPurchase={onPurchase}
              onHandleDailyShare={handleDailyShare}
              usage={usage}
              onShowDishDetail={handleDishClick}
              onGameWin={handleGameWin} 
            />
          )}

          <div className="max-w-5xl mx-auto px-6">
            {status === AppStatus.LOADING && (
              <div className="py-20 animate-in fade-in duration-500 bg-transparent">
                <LoadingScreen />
              </div>
            )}

            {status === AppStatus.ERROR && (
              <div className="mt-20 animate-in fade-in zoom-in duration-500 max-w-2xl mx-auto px-4">
                {error === "OUT_OF_CREDITS" ? (
                  <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-center relative overflow-hidden shadow-2xl border border-white/5 max-h-[75vh] flex flex-col justify-center my-4">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-rose-600/10 blur-[100px] pointer-events-none"></div>
                    <div className="relative z-10">
                      <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-rose-600/20 rounded-full text-rose-500">
                         <WarningIcon className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Credits <span className="text-rose-600">Exhausted</span></h2>
                      <p className="text-slate-400 text-[11px] font-medium mb-8 leading-relaxed">Your free scans have been used up.<br/>Returning home to refuel in {countdown}s...</p>
                      <div className="flex flex-col gap-3 max-w-xs mx-auto">
                        <button onClick={() => { reset(); setShowPricing(true); }} className="bg-rose-600 hover:bg-rose-500 text-white font-black py-4 px-8 rounded-full shadow-lg active:scale-95 transition-all uppercase tracking-widest text-[10px]">Get More Credits Now</button>
                        <button onClick={reset} className="text-slate-500 hover:text-white font-bold py-2 text-[9px] uppercase tracking-[0.2em] transition-colors">Skip and return</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-rose-100 rounded-[3rem] p-16 text-center space-y-6 shadow-sm">
                    <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                      <WarningIcon className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 uppercase italic tracking-tighter">Scan Failed</h2>
                    <p className="text-slate-400 text-xs font-bold leading-relaxed">{error}</p>
                    <button onClick={reset} className="bg-slate-900 text-white font-black py-4 px-12 rounded-full shadow-lg active:scale-95 transition-all uppercase tracking-widest text-[10px]">Retry Scan</button>
                  </div>
                )}
              </div>
            )}

            {status === AppStatus.SUCCESS && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-10 pb-32">
                <div className="flex justify-between items-center bg-slate-900 p-5 rounded-[2.2rem] shadow-2xl sticky top-4 z-[110] mx-2 border border-white/10">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={reset}
                      className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-rose-600 transition-colors group"
                    >
                      <span className="group-hover:-translate-x-0.5 transition-transform text-lg">←</span>
                    </button>
                    <div className="text-left">
                      <h3 className="font-bold text-white tracking-tight text-sm leading-none mb-1">
                        {mode === RecognitionMode.MENU ? `${dishes.length} Items Found` : "Shop Identified"}
                      </h3>
                      <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none">
                        {mode === RecognitionMode.STREET ? "Free Recognition" : (isUnlimited() ? "Premium Active" : `${usage.credits} Credits Left`)}
                      </p>
                    </div>
                  </div>
                  <button onClick={reset} className="bg-white text-slate-900 font-black py-2.5 px-6 rounded-full text-[10px] uppercase tracking-wider transition-transform active:scale-90 shadow-lg">Done</button>
                </div>
                
                {mode === RecognitionMode.MENU ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                    {dishes.map((dish, index) => (
                      <DishCard key={dish.id || `dish-${index}`} dish={dish} onClick={() => handleDishClick(dish)} />
                    ))}
                  </div>
                ) : (
                  storeResult && <StoreCard store={storeResult} onShowStaff={() => setShowStaffHelper(true)} />
                )}
              </div>
            )}
          </div>
        </main>

        <Footer 
          onMenuScan={() => { handleModeChange(RecognitionMode.MENU); setTimeout(scrollToCamera, 100); }} 
          onStreetScan={() => { handleModeChange(RecognitionMode.STREET); setTimeout(scrollToCamera, 100); }} 
          onSurvivalOpen={() => setShowSurvival(true)}
          onPricing={() => setShowPricing(true)} 
          onPrivacy={() => setLegalView('privacy')} 
          onTos={() => setLegalView('tos')} 
        />

        <SurvivalCardView isOpen={showSurvival} onClose={() => setShowSurvival(false)} />
        
        {showPricing && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowPricing(false)} />
            <div className="relative w-full max-w-5xl animate-in fade-in zoom-in duration-300">
              <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl relative">
                  <PricingModule 
                    onPurchase={onPurchase} 
                    onLater={() => setShowPricing(false)} 
                  />
                  <button 
                    onClick={() => setShowPricing(false)}
                    className="absolute top-6 right-8 text-slate-400 hover:text-slate-900 font-black text-2xl z-50"
                  >✕</button>
              </div>
            </div>
          </div>
        )}

        {selectedDish && (
          <DishDetailModal 
            dish={selectedDish} 
            onClose={() => setSelectedDish(null)} 
            isLoadingDetail={loadingDetail}
            onIngredientClick={(ing: Ingredient) => setWaiterContext({ 
              type: 'ingredient', 
              content_en: ing.name_en, 
              content_cn: ing.name_cn 
            })}
            onSpicyClick={() => setWaiterContext({ 
              type: 'spiciness', 
              content_en: 'Spiciness preference', 
              content_cn: '辣度要求' 
            })}
          />
        )}

        {waiterContext && <WaiterCard {...waiterContext} onClose={() => setWaiterContext(null)} />}
        {showStaffHelper && <StaffHelperModal onClose={() => setShowStaffHelper(false)} />}
        {legalView && <LegalModal type={legalView} onClose={() => setLegalView(null)} />}
      </div>
    </PayPalScriptProvider>
  );
};

export default App;