import React, { useState, useRef, useEffect } from 'react';
import { AppStatus, RecognitionMode, Ingredient, StoreResult } from './types';
import { processMenuImage, processStorefrontImage, getDishDeepDetail } from './services/geminiService';

// 基础组件
import { DishCard } from './components/DishCard';
import { LoadingScreen } from './components/LoadingScreen';
import { WarningIcon } from './components/Icons';
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

// 拆分出的逻辑与视图
import { useUserUsage } from './hooks/useUserUsage';
import { HomeIdleView } from './views/HomeIdleView';

const App: React.FC = () => {
  const { usage, setUsage, totalCredits, isUnlimited, getRemainingDays, handleDailyShare } = useUserUsage();

  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [mode, setMode] = useState<RecognitionMode>(RecognitionMode.MENU);
  const [dishes, setDishes] = useState<any[]>([]);
  const [storeResult, setStoreResult] = useState<StoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [showPricing, setShowPricing] = useState(false);
  const [showStaffHelper, setShowStaffHelper] = useState(false);
  const [legalView, setLegalView] = useState<'privacy' | 'tos' | null>(null);
  const [selectedDish, setSelectedDish] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [waiterContext, setWaiterContext] = useState<{ type: 'ingredient' | 'spiciness'; content_en: string; content_cn: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          resolve(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
        };
      };
    });
  };

  // 核心处理函数：店铺识别逻辑转换器
  const processStoreData = (raw: any): StoreResult => {
    // 兼容数组格式 [ { ... } ]
    const data = Array.isArray(raw) ? raw[0] : raw;
    
    // 提取核心字段（无论 AI 把它当成菜品还是店铺返回）
    const name_cn = data.name_cn || data.name || "Unknown Store";
    const name_en = data.name_en || data.pinyin || "Local Business";
    const originalDesc = data.description || "";
    let cuisine = data.cuisine || "Storefront";

    // 智能识别店铺类型并生成描述
    let finalDesc = originalDesc;
    const lowerName = name_cn.toLowerCase();
    const lowerDesc = originalDesc.toLowerCase();

    if (!finalDesc || finalDesc.length < 10) {
      if (lowerName.includes('药') || lowerName.includes('pharmacy')) {
        cuisine = "Pharmacy / Drugstore";
        finalDesc = `A local pharmacy providing medical supplies, healthcare products, and prescription services.`;
      } else if (lowerName.includes('发') || lowerName.includes('剪') || lowerName.includes('hair')) {
        cuisine = "Hair Salon / Barber";
        finalDesc = `A local hair salon offering haircutting, styling, and grooming services.`;
      } else if (lowerName.includes('超市') || lowerName.includes('便利') || lowerName.includes('mart')) {
        cuisine = "Convenience Store / Supermarket";
        finalDesc = `A retail store selling daily groceries, snacks, and household essentials.`;
      } else if (lowerName.includes('老娘舅') || lowerDesc.includes('rice') || lowerDesc.includes('fast food')) {
        cuisine = "Chinese Fast Casual";
        finalDesc = `A popular Chinese chain specializing in Jiangnan-style rice dishes and healthy home-style meals.`;
      } else {
        finalDesc = `A local establishment in China. This venue offers services or products to the neighborhood.`;
      }
    }

    return {
      name: name_cn,
      name_en: name_en,
      description: finalDesc,
      cuisine: cuisine,
      rating: data.rating || 4.5,
      address: data.address || "Main Street"
    };
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
        // --- 模式 1: 菜谱识别 ---
        const result = await processMenuImage(base64);
        const list = Array.isArray(result) ? result : (result.dishes || []);
        
        if (list && list.length > 0) {
          setStoreResult(null); // 明确清理掉店铺数据，防止模式混淆
          setDishes(list);
          setStatus(AppStatus.SUCCESS);
        } else {
          throw new Error("No dishes found. Please try a clearer menu photo.");
        }
      } else {
        // --- 模式 2: 店铺识别 (Street Mode) ---
        const rawResult = await processStorefrontImage(base64);
        const formattedStore = processStoreData(rawResult);
        
        if (formattedStore && formattedStore.name) {
          setDishes([]); // 核心修复：明确将 dishes 设为空数组，防止 .map() 报错
          setStoreResult(formattedStore);
          setStatus(AppStatus.SUCCESS);
        } else {
          throw new Error("Could not identify this storefront. Please try a clearer photo.");
        }
      }

      // 扣点逻辑
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
    let enhancedDesc = dish.description || "";
    if (enhancedDesc.length < 10 && dish.ingredients) {
      const method = dish.cooking_method || ""; 
      const ingredients = dish.ingredients.slice(0, 3).map((i: any) => typeof i === 'string' ? i : i.name_en).join(', ');
      enhancedDesc = method ? `Traditional ${method} dish with ${ingredients}.` : `Savory dish prepared with ${ingredients}.`;
    }
    const currentDish = { ...dish, description: enhancedDesc };
    setSelectedDish(currentDish);

    if (!dish.isFullyAnalyzed) {
      setLoadingDetail(true);
      try {
        const full = await getDishDeepDetail(dish.name_cn, dish.name_en);
        if (full) {
          const updated = { ...currentDish, ...full, isFullyAnalyzed: true, description: full.description || enhancedDesc };
          setSelectedDish(prev => (prev?.id === dish.id ? updated : prev));
          setDishes(prev => prev.map(d => d.id === dish.id ? updated : d));
        }
      } catch (e) { console.error(e); } finally { setLoadingDetail(false); }
    }
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
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

          {status === AppStatus.IDLE && (
            <HomeIdleView 
              mode={mode} 
              onModeChange={handleModeChange} 
              onUpload={triggerUpload} 
              onShare={handleDailyShare}
              onDishClick={handleDishClick}
            />
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
  // 增加 (dishes || []) 确保 map 始终作用于数组
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
    {(dishes || []).length > 0 ? (
      (dishes || []).map((dish, index) => (
        <DishCard 
          key={dish.id || `dish-${index}`} 
          dish={dish} 
          onClick={() => handleDishClick(dish)} 
        />
      ))
    ) : (
      // 这里的兜底防止成功状态下数据却为空的尴尬
      <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
        <p className="text-slate-400 font-medium">No dish data available. Please try scanning again.</p>
      </div>
    )}
  </div>
) : (
  // 店铺模式：增加更严谨的 storeResult 检查
  storeResult ? (
    <StoreCard 
      store={storeResult} 
      onShowStaff={() => setShowStaffHelper(true)} 
    />
  ) : (
    <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
      <p className="text-slate-400 font-medium">Identifying storefront...</p>
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

      {/* Modals */}
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