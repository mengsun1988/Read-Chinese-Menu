import React, { useState, useRef, useEffect } from 'react';
import { AppStatus, Dish, Ingredient, UserUsage } from './types';
import { processMenuImage } from './services/geminiService';
import { DishCard } from './components/DishCard';
import { LoadingScreen } from './components/LoadingScreen';
import { CameraIcon, WarningIcon } from './components/Icons';
import { DishDetailModal } from './components/DishDetailModal';
import { WaiterCard } from './components/WaiterCard';
import { WordCloudMarquee } from './components/WordCloudMarquee';
import { AboutUs } from './components/AboutUs';
import { Reviews } from './components/Reviews';
import { PricingModule } from './components/PricingModule';

const STORAGE_KEY = 'rmc_user_usage_v2';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [thankYouPlan, setThankYouPlan] = useState<string | null>(null);
  
  const [usage, setUsage] = useState<UserUsage>(() => {
    const getBeijingDate = () => {
      const d = new Date();
      // Adjust to UTC+8 (Beijing Time)
      const beijingTime = new Date(d.getTime() + (8 * 60 * 60 * 1000));
      return beijingTime.toISOString().split('T')[0];
    };

    const todayStr = getBeijingDate();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserUsage;
        if (parsed.lastResetDate !== todayStr) {
          // Daily refresh: 11 free credits
          return { ...parsed, freeCredits: 11, lastResetDate: todayStr };
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Usage parsing failed, using defaults", e);
    }
    return { freeCredits: 11, paidCredits: 0, lastResetDate: todayStr };
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

      const results = await processMenuImage(base64String);
      setDishes(results);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Recognition failed. Please ensure the menu is flat and well-lit.");
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
    setError(null);
    setPreviewUrl(null);
    setSelectedDish(null);
    setWaiterContext(null);
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

  return (
    <div className="min-h-screen selection:bg-rose-600 selection:text-white pb-0 overflow-x-hidden">
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        {/* Floating Credit Counter - Bottom Right */}
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-2xl hover:scale-105 transition-transform cursor-default select-none group">
          <div className={`w-2.5 h-2.5 rounded-full ${isUnlimited() ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
            {isUnlimited() ? 'Unlimited Access' : `Remaining Credits: ${totalCredits}`}
          </span>
          {!isUnlimited() && totalCredits <= 3 && (
            <button 
              onClick={() => setShowPricing(true)}
              className="ml-2 px-2 py-0.5 bg-rose-600 text-white text-[8px] rounded-lg font-bold group-hover:bg-rose-700 transition-colors"
            >
              Top Up
            </button>
          )}
        </div>

        {/* Header */}
        <header className="mb-16 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-px bg-slate-200 flex-1"></div>
            <div className="px-5 py-1.5 border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] rounded-full flex items-center gap-2">
              <span>Global Explorer Edition</span>
            </div>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none mb-6">
              Read <span className="text-rose-600">Chinese Menu</span>
            </h1>
            <p className="text-slate-500 max-w-xl mx-auto text-xl font-medium leading-relaxed tracking-tight">
              Know what’s on your plate.
            </p>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="mb-20">
          {status === AppStatus.IDLE && (
            <>
              <div className="modern-card p-12 md:p-20 text-center flex flex-col items-center shadow-xl mb-10">
                <input type="file" accept="image/*" className="hidden" id="menu-upload" ref={fileInputRef} onChange={handleFileChange} />
                
                <button 
                  onClick={triggerUpload}
                  className="w-24 h-24 bg-rose-600 rounded-3xl flex items-center justify-center mb-10 shadow-2xl shadow-rose-200 rotate-3 transition-transform active:scale-90 hover:scale-105"
                  aria-label="Take Photo or Select Image"
                >
                  <CameraIcon className="w-12 h-12 text-white" />
                </button>
                
                <h2 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Ready to Order?</h2>
                <p className="text-slate-400 mb-10 font-bold uppercase tracking-[0.2em] text-xs">
                  {totalCredits > 0 || isUnlimited() ? "Tap the icon to scan or upload" : "Daily free credits exhausted"}
                </p>
                
                <div className="w-full max-w-xs space-y-4">
                   <button 
                     onClick={triggerUpload}
                     className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 px-8 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 text-lg shadow-lg"
                   >
                     📁 Upload From Album
                   </button>
                </div>
              </div>

              <button 
                onClick={() => setShowPricing(true)}
                className="block mx-auto mb-10 text-xs font-black text-rose-600 uppercase tracking-widest underline decoration-2 underline-offset-4"
              >
                View Premium Plans
              </button>

              <div className="p-6 bg-slate-50 rounded-3xl flex items-start gap-5 border border-slate-100 max-w-3xl mx-auto">
                 <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                   <WarningIcon className="w-5 h-5 text-white" />
                 </div>
                 <div>
                   <h4 className="font-extrabold text-slate-900 text-sm">Better Recognition Tips</h4>
                   <p className="text-slate-500 text-xs mt-1 leading-normal font-medium">
                     For complex menus, try scanning in <strong>smaller sections</strong>. Ensure there is no glare on the paper and the Chinese text is sharp and legible.
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
              <h2 className="text-4xl font-black text-slate-900">Scan Failed</h2>
              <p className="text-slate-500 max-w-sm mx-auto font-medium text-lg">{error}</p>
              <button onClick={reset} className="bg-rose-600 hover:bg-rose-700 text-white font-black py-4 px-12 rounded-2xl transition-all shadow-xl text-xl">
                Try Again
              </button>
            </div>
          )}

          {status === AppStatus.SUCCESS && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-white/5 sticky top-6 z-20">
                <div className="flex items-center gap-6">
                  {previewUrl && (
                    <img src={previewUrl} className="w-24 h-24 object-cover rounded-2xl border-2 border-white/10" alt="Menu Preview" />
                  )}
                  <div>
                    <h3 className="font-extrabold text-3xl text-white tracking-tight">Dish List</h3>
                    <p className="text-sm font-bold text-rose-400 uppercase tracking-widest">{dishes.length} Matches Found</p>
                  </div>
                </div>
                <button onClick={reset} className="bg-white text-slate-900 hover:bg-rose-600 hover:text-white font-black py-5 px-10 rounded-2xl transition-all active:scale-95 shadow-xl text-lg">
                  New Scan
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {dishes.map((dish, index) => (
                  <DishCard key={index} dish={dish} onClick={() => handleDishClick(dish)} />
                ))}
              </div>
              
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
            <PricingModule onPurchase={onPurchase} />
            <AboutUs />
            <Reviews />
          </div>
        )}

        {/* Support section at the bottom */}
        <div className="max-w-2xl mx-auto pt-24 pb-12 text-center space-y-10 border-t border-slate-100 relative group">
          {/* Easter Egg Chef Image - Subtle Line Art Illustration */}
          <div className="absolute -bottom-16 -left-16 md:left-4 pointer-events-none select-none opacity-10 transition-opacity duration-1000 group-hover:opacity-30 z-0">
            <img 
              src="https://img.alicdn.com/imgextra/i2/O1CN01f4O86J25v8K9qB7oB_!!6000000007589-2-tps-1024-1024.png" 
              alt="Chef Easter Egg" 
              className="w-48 md:w-80 h-auto rotate-[-8deg] grayscale brightness-110"
              onError={(e) => {
                // Fallback for image loading issues
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          <div className="space-y-4 px-6 relative z-10">
            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Support our bridge</h4>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] block mt-2 max-w-lg mx-auto leading-relaxed">
              If you love this site or it has truly helped you navigate the flavors of China, please consider giving me a treat. Your support keeps this bridge between cultures alive.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 px-6 relative z-10">
            <button onClick={() => handleCoffee(2)} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-black text-slate-800 hover:border-rose-400 hover:text-rose-600 shadow-sm transition-all active:scale-95 text-[10px] uppercase tracking-widest">Buy me a Coke ($2)</button>
            <button onClick={() => handleCoffee(5)} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-black text-slate-800 hover:border-rose-400 hover:text-rose-600 shadow-sm transition-all active:scale-95 text-[10px] uppercase tracking-widest">Buy me a Coffee ($5)</button>
            <button onClick={() => handleCoffee(9)} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-black text-slate-800 hover:border-rose-400 hover:text-rose-600 shadow-sm transition-all active:scale-95 text-[10px] uppercase tracking-widest">Buy me a Cheesecake ($9)</button>
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
          <p className="max-w-2xl mx-auto text-[10px] font-black text-slate-300 leading-relaxed uppercase tracking-[0.4em]">
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
                 <h4 className="text-2xl md:text-3xl font-black text-rose-600">You've used your free credits for today.</h4>
                 <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Want to see more?</p>
               </div>
             )}
             
             <PricingModule onPurchase={onPurchase} />

             <div className="mt-8 text-center border-t border-slate-100 pt-8">
                <button onClick={() => handleCoffee(2)} className="text-sm font-black text-slate-400 hover:text-rose-600 underline underline-offset-4 uppercase tracking-widest transition-colors">
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
            <h3 className="text-3xl font-black text-slate-900 leading-tight">Thank You!</h3>
            <p className="text-slate-500 font-medium leading-relaxed italic">
              "Whether it's a Coke in NY or a Baozi in Shanghai, your support keeps this bridge between cultures alive."
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isUnlimited() ? `Expires: ${new Date(usage.passExpiryDate!).toLocaleDateString()}` : `${totalCredits} Credits Remaining`}
            </div>
            <button onClick={() => setThankYouPlan(null)} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg transition-transform active:scale-95">Start Exploring</button>
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
    </div>
  );
};

export default App;