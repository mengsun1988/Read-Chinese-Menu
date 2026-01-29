import React, { useState, useRef, useEffect } from 'react';
import { AppStatus, RecognitionMode, Ingredient, StoreResult } from './types';
import { processMenuImage, processStorefrontImage, getDishDeepDetail, WORKER_URL, getOrCreateUserId } from './services/geminiService';
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
import { CreditUpdateCard } from './components/CreditUpdateCard';

// 逻辑、视图与动画
import { useUserUsage } from './hooks/useUserUsage';
import { HomeIdleView } from './views/HomeIdleView';
import { EffectLayer } from './components/EffectLayer';

const App: React.FC = () => {
  // 从自定义 Hook 中获取状态与方法
  const { usage, isUnlimited, syncWithBackend, handleDailyShare, handleGameWin, clearAchievement } = useUserUsage();

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
  const [creditUpdateMessage, setCreditUpdateMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 辅助函数 ---
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

  const scrollToPricing = () => {
    const element = document.getElementById('pricing-section');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToCamera = () => {
    const element = document.getElementById('camera-section');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  /**
   * 图片压缩处理
   */
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
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          const base = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          if (base) resolve(base);
        };
      };
    });
  };

  /**
   * 核心文件上传与识别逻辑
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus(AppStatus.LOADING);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);

    try {
      const base64 = await getCompressedBase64(file);
      const userId = getOrCreateUserId();

      if (mode === RecognitionMode.MENU) {
        // 直接调用识别接口（Worker 内部会进行点数预检并自动扣费）
        const result = await processMenuImage(base64);
        
        if (result && result.dishes) {
          setDishes(result.dishes);
          // 关键闭环：识别成功后，Worker 会返回最新的 usage 状态
          if (result.usage) {
            syncWithBackend(result.usage);
          }
          setStatus(AppStatus.SUCCESS);
        } else if (result && result.error === "OUT_OF_CREDITS") {
          reset();
          setShowPricing(true);
          setTimeout(scrollToPricing, 300);
        } else {
          throw new Error("No dishes detected. Please try a clearer photo.");
        }
      } else {
        // 门头模式 (STREET)
        const rawResult = await processStorefrontImage(base64);
        if (rawResult) {
          setStoreResult(rawResult);
          if (rawResult.usage) syncWithBackend(rawResult.usage);
          setStatus(AppStatus.SUCCESS);
        } else {
          throw new Error("Could not identify the storefront.");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setStatus(AppStatus.ERROR);
    }
  };

  /**
   * 支付成功后的本地回调
   */
  const onPurchaseSuccess = (updatedUserData: any) => {
    syncWithBackend(updatedUserData);
    setShowPricing(false);
    
    if (updatedUserData.passExpiryDate) {
      setCreditUpdateMessage(`Premium Access Activated!`);
    } else {
      setCreditUpdateMessage(`Credits Topped Up!`);
    }
  };

  /**
   * 菜品详情点击：处理深度分析与数据合并
   */
  const handleDishClick = async (dish: any) => {
    // 1. 先展示已有信息，开启 Modal
    setSelectedDish(dish);
    
    // 2. 如果已经深度分析过，则不需要再次请求
    if (dish.isFullyAnalyzed) return;

    setLoadingDetail(true);
    try {
      // 调用 Worker 的 task: "dish_detail"
      const deepInfo = await getDishDeepDetail(dish.name_cn, dish.name_en);
      
      if (deepInfo) {
        // 合并数据，并显式映射 Worker 的 deep_ingredients 到分层字段
        const updatedDish = { 
          ...dish, 
          ...deepInfo,
          classic_ingredients: deepInfo.deep_ingredients?.classic || [],
          potential_ingredients: deepInfo.deep_ingredients?.potential || [],
          isFullyAnalyzed: true 
        };

        // 更新当前选中的菜品显示
        setSelectedDish(updatedDish);
        
        // 同步回主列表 dishes 数组，防止关闭弹窗后丢失数据
        setDishes(prev => prev.map(d => 
          (d.id === dish.id || (d.name_cn === dish.name_cn && d.name_en === dish.name_en)) 
            ? updatedDish 
            : d
        ));
      }
    } catch (e) {
      console.error("Deep Analysis Failed:", e);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <PayPalScriptProvider options={{ 
      clientId: "Ac071qoDgiNf6B4M9f6s589LM97KMsJglC_3P6EaM7rw-6WLCf7lLNQeG1ixLX_Mib9nbBMODmxApG7e",
      currency: "USD",
      intent: "capture"
    }}>
      <div className="min-h-screen pb-0 bg-[#fafafa] font-sans w-full">
        {/* 动画特效层 */}
        <EffectLayer 
          trigger={usage.achievementTriggered} 
          onComplete={clearAchievement} 
        />

        <A2HSManager />
        
        <main className="w-full relative">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />

          {status === AppStatus.IDLE && (
            <HomeIdleView 
              mode={mode}
              onModeChange={handleModeChange}
              onTriggerUpload={triggerUpload}
              onOpenSurvival={() => setShowSurvival(true)}
              onPurchase={() => setShowPricing(true)}
              onHandleDailyShare={() => handleDailyShare(getOrCreateUserId())}
              usage={usage}
              onShowDishDetail={handleDishClick}
              onGameWin={() => handleGameWin(getOrCreateUserId())} 
            />
          )}

          <div className="max-w-5xl mx-auto px-6">
            {status === AppStatus.LOADING && (
              <div className="py-20 animate-in fade-in duration-500">
                <LoadingScreen />
              </div>
            )}

            {status === AppStatus.ERROR && (
              <div className="bg-white border border-rose-100 rounded-[3rem] p-16 text-center space-y-6 shadow-sm mt-20">
                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                  <WarningIcon className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tighter">Scan Failed</h2>
                <p className="text-slate-400 text-xs font-bold leading-relaxed">{error}</p>
                <button onClick={reset} className="bg-slate-900 text-white font-black py-4 px-12 rounded-full shadow-lg active:scale-95 transition-all uppercase tracking-widest text-[10px]">Retry Scan</button>
              </div>
            )}

            {status === AppStatus.SUCCESS && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-10 pb-32">
                {/* 顶部状态栏 */}
                <div className="flex justify-between items-center bg-slate-900 p-6 rounded-[2rem] shadow-2xl sticky top-4 z-[110] mx-2 border border-white/5">
                  <div className="flex items-center gap-4">
                    {previewUrl && <img src={previewUrl} className="w-12 h-12 object-cover rounded-xl ring-2 ring-white/10" alt="Preview" />}
                    <div className="text-left">
                      <h3 className="font-bold text-white tracking-tight text-sm leading-none mb-1">
                        {mode === RecognitionMode.MENU ? `${dishes.length} Items Found` : "Shop Identified"}
                      </h3>
                      <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none">
                        {isUnlimited ? "Premium Active" : `${usage.credits} Credits Left`}
                      </p>
                    </div>
                  </div>
                  <button onClick={reset} className="bg-white/10 hover:bg-white/20 text-white font-black py-2.5 px-6 rounded-full text-[10px] uppercase tracking-wider backdrop-blur-sm transition-colors border border-white/10">Restart</button>
                </div>
                
                {/* 结果展示 */}
                {mode === RecognitionMode.MENU ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                    {dishes.map((dish, index) => (
                      <DishCard 
                        key={dish.id || `dish-${index}`} 
                        dish={dish} 
                        onClick={() => handleDishClick(dish)} 
                      />
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

        {/* 各种弹窗/覆盖层 */}
        <SurvivalCardView isOpen={showSurvival} onClose={() => setShowSurvival(false)} />
        
        {showPricing && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowPricing(false)} />
            <div className="relative w-full max-w-5xl animate-in fade-in zoom-in duration-300">
              <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl relative">
                  <PricingModule 
                    onPurchase={onPurchaseSuccess} 
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
        
        {creditUpdateMessage && (
          <CreditUpdateCard 
            message={creditUpdateMessage} 
            onClose={() => setCreditUpdateMessage(null)} 
          />
        )}
      </div>
    </PayPalScriptProvider>
  );
};

export default App;