import React, { useState, useRef } from 'react';
import { AppStatus, RecognitionMode, Ingredient, StoreResult } from './types';
import { processMenuImage, processStorefrontImage, getDishDeepDetail } from './services/geminiService';

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

// 逻辑与视图
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
  const [showSurvival, setShowSurvival] = useState(false); 
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

  // 处理 Footer 导航跳转逻辑
  const scrollToCamera = () => {
    const element = document.getElementById('camera-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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

  const processStoreData = (raw: any): StoreResult | null => {
    if (!raw || typeof raw !== 'object') return null;
    const data = Array.isArray(raw) ? raw[0] : raw;
    const name_cn = data.name_cn || data.name || data.store_name || "";
    return {
      name: name_cn || "Local Shop",
      name_en: data.name_en || data.pinyin || "Local Business",
      description: data.description || "Information provided by AI analysis.",
      cuisine: data.cuisine || data.cuisine_type || "Storefront",
      rating: data.rating || 4.5,
      address: data.address || "Local Area"
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
        const result = await processMenuImage(base64);
        const list = Array.isArray(result) ? result : (result.dishes || []);
        if (list && list.length > 0) {
          setStoreResult(null);
          setDishes(list);
          setStatus(AppStatus.SUCCESS);
        } else {
          throw new Error("No dishes detected. Please try a clearer photo.");
        }
      } else {
        const rawResult = await processStorefrontImage(base64);
        const formattedStore = processStoreData(rawResult);
        if (formattedStore) {
          setDishes([]);
          setStoreResult(formattedStore);
          setStatus(AppStatus.SUCCESS);
        } else {
          throw new Error("Could not parse storefront details.");
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
      setError(err.message || "An unexpected error occurred.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleDishClick = async (dish: any) => {
    setSelectedDish(dish);
    if (!dish.isFullyAnalyzed) {
      setLoadingDetail(true);
      try {
        const full = await getDishDeepDetail(dish.name_cn, dish.name_en);
        if (full) {
          const updated = { ...dish, ...full, isFullyAnalyzed: true };
          setSelectedDish(updated);
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
      return updated;
    });
    setShowPricing(false);
  };

  return (
    <div className="min-h-screen pb-0 overflow-x-hidden bg-[#fafafa] font-sans">
      <A2HSManager />
      
      <div className="max-w-5xl mx-auto px-6 relative">
        <main>
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
            />
          )}

          {status === AppStatus.LOADING && <div className="py-20"><LoadingScreen /></div>}

          {status === AppStatus.ERROR && (
            <div className="bg-white border border-rose-100 rounded-[3rem] p-16 text-center space-y-6 shadow-sm mt-20">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <WarningIcon className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Scan Failed</h2>
              <p className="text-slate-400 text-sm font-medium">{error}</p>
              <button onClick={reset} className="bg-rose-600 text-white font-bold py-4 px-12 rounded-full shadow-lg active:scale-95 transition-transform uppercase tracking-widest text-xs">TRY AGAIN</button>
            </div>
          )}

          {status === AppStatus.SUCCESS && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-10 pb-32">
              <div className="flex justify-between items-center bg-slate-900 p-6 rounded-[2rem] shadow-2xl sticky top-4 z-[110] mx-2 border border-white/5">
                <div className="flex items-center gap-4">
                  {previewUrl && <img src={previewUrl} className="w-12 h-12 object-cover rounded-xl ring-2 ring-white/10" alt="Preview" />}
                  <div className="text-left">
                    <h3 className="font-bold text-white tracking-tight text-sm">{mode === RecognitionMode.MENU ? "Results" : "Shop Details"}</h3>
                    <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">
                      {mode === RecognitionMode.MENU ? `${(dishes || []).length} Items Detected` : 'Match Found'}
                    </p>
                  </div>
                </div>
                <button onClick={reset} className="bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-6 rounded-full text-[10px] uppercase tracking-wider backdrop-blur-sm transition-colors border border-white/10">New Scan</button>
              </div>
              
              {mode === RecognitionMode.MENU ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                  {(dishes || []).map((dish, index) => (
                    <DishCard key={dish.id || `dish-${index}`} dish={dish} onClick={() => handleDishClick(dish)} />
                  ))}
                </div>
              ) : (
                storeResult && <StoreCard store={storeResult} onShowStaff={() => setShowStaffHelper(true)} />
              )}
            </div>
          )}
        </main>
      </div>

      <Footer 
        onMenuScan={() => {
          handleModeChange(RecognitionMode.MENU);
          setTimeout(scrollToCamera, 100);
        }} 
        onStreetScan={() => {
          handleModeChange(RecognitionMode.STREET);
          setTimeout(scrollToCamera, 100);
        }} 
        onSurvivalOpen={() => setShowSurvival(true)}
        onPricing={() => setShowPricing(true)} 
        onPrivacy={() => setLegalView('privacy')} 
        onTos={() => setLegalView('tos')} 
      />

      <SurvivalCardView isOpen={showSurvival} onClose={() => setShowSurvival(false)} />
      {showPricing && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md overflow-y-auto p-4 flex items-center justify-center">
          <div className="bg-[#fcfbf9] w-full max-w-4xl rounded-[3rem] relative p-8 shadow-2xl">
            <button onClick={() => setShowPricing(false)} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-600 text-xl font-bold transition-colors">✕</button>
            <PricingModule onPurchase={onPurchase} />
          </div>
        </div>
      )}
      {selectedDish && (
        <DishDetailModal 
          dish={selectedDish} onClose={() => setSelectedDish(null)} isLoadingDetail={loadingDetail}
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