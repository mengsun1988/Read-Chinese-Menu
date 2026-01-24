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

const STORAGE_KEY = 'rmc_user_usage_v3';

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

  const totalCredits = (usage.freeCredits || 0) + (usage.paidCredits || 0);
  const isUnlimited = () => usage.passExpiryDate ? new Date(usage.passExpiryDate).getTime() > Date.now() : false;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isUnlimited() && totalCredits <= 0) { setShowPricing(true); return; }

    setStatus(AppStatus.LOADING);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        if (mode === RecognitionMode.MENU) {
          const result = await processMenuImage(base64);
          setDishes(result || []);
        } else {
          const result = await processStorefrontImage(base64);
          setStoreResult(result);
        }

        if (!isUnlimited()) {
          setUsage(prev => ({
            ...prev,
            paidCredits: Math.max(0, prev.paidCredits - 1),
            freeCredits: prev.paidCredits <= 0 ? Math.max(0, prev.freeCredits - 1) : prev.freeCredits
          }));
        }
        setStatus(AppStatus.SUCCESS);
      } catch (err: any) {
        setError("Analysis failed. Please try again.");
        setStatus(AppStatus.ERROR);
      }
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setStatus(AppStatus.IDLE);
    setDishes([]);
    setStoreResult(null);
    setPreviewUrl(null);
    setError(null);
  };

  return (
    <div className="min-h-screen selection:bg-rose-600 selection:text-white pb-0 overflow-x-hidden bg-[#FAFAFA]">
      <A2HSManager />
      
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        {/* 1. Credits Badge (Always Visible) */}
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-2xl">
          <div className={`w-2 h-2 rounded-full ${isUnlimited() ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
          <span className="text-[10px] font-bold uppercase text-slate-900">
            {isUnlimited() ? `Unlimited` : `Credits: ${totalCredits}`}
          </span>
        </div>

        {/* 2. Header (Always Visible) */}
        <header className="mb-16 text-center space-y-4">
          <div className="inline-block px-4 py-1.5 bg-rose-50 rounded-full">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-[0.2em]">Global Explorer</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tighter">
            Read <span className="text-rose-600">Chinese Menu</span>
          </h1>
        </header>

        <main className="mb-20">
          {/* 3. Daily Reward (Only in IDLE) */}
          {status === AppStatus.IDLE && (
            <div className="max-w-xl mx-auto mb-10">
              <button onClick={() => alert("Reward Claimed!")} className="w-full bg-emerald-50/50 border border-emerald-100 p-6 rounded-[2.5rem] flex items-center justify-between group hover:bg-emerald-50 transition-all">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">🎁</div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Daily Bonus</p>
                    <p className="text-base font-bold text-slate-900">Share to claim credits</p>
                  </div>
                </div>
                <div className="bg-emerald-600 text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase">Claim</div>
              </button>
            </div>
          )}

          {/* 4. Scanner Section (IDLE) */}
          {status === AppStatus.IDLE && (
            <div className="modern-card p-12 md:p-20 text-center flex flex-col items-center shadow-2xl rounded-[3rem] border border-white bg-white/60 backdrop-blur-xl relative mb-20">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              
              <div className="flex justify-center mb-10 bg-slate-100/80 p-1.5 rounded-2xl gap-1">
                <button onClick={() => setMode(RecognitionMode.MENU)} className={`px-8 py-2.5 rounded-xl text-xs font-bold tracking-widest transition-all ${mode === RecognitionMode.MENU ? 'bg-white text-rose-600 shadow-md scale-105' : 'text-slate-400'}`}>SCAN MENU</button>
                <button onClick={() => setMode(RecognitionMode.STREET)} className={`px-8 py-2.5 rounded-xl text-xs font-bold tracking-widest transition-all ${mode === RecognitionMode.STREET ? 'bg-slate-900 text-white shadow-md scale-105' : 'text-slate-400'}`}>SCAN SHOP</button>
              </div>

              <button onClick={() => fileInputRef.current?.click()} className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl transition-all active:scale-90 ${mode === RecognitionMode.MENU ? 'bg-rose-600 shadow-rose-200' : 'bg-slate-900 shadow-slate-200'}`}>
                <CameraIcon className="w-12 h-12 text-white" />
              </button>
              
              <h2 className="text-3xl font-bold text-slate-900">Ready to Translate?</h2>
              <button onClick={() => fileInputRef.current?.click()} className="w-full max-w-xs bg-slate-900 text-white font-bold py-5 rounded-full mt-8 shadow-xl hover:opacity-90 transition-opacity uppercase tracking-widest text-sm">
                Upload Photo
              </button>
            </div>
          )}

          {/* 5. Loading / Success / Error States */}
          {status === AppStatus.LOADING && <LoadingScreen />}

          {status === AppStatus.SUCCESS && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl sticky top-6 z-20">
                <div className="flex items-center gap-6 text-left">
                  {previewUrl && <img src={previewUrl} className="w-20 h-20 object-cover rounded-2xl border-2 border-white/10" alt="Preview" />}
                  <div>
                    <h3 className="font-bold text-2xl text-white">{mode === RecognitionMode.MENU ? "Analyzed Result" : "Shop Details"}</h3>
                    <p className="text-sm text-rose-400 font-bold uppercase tracking-widest">{mode === RecognitionMode.MENU ? `${dishes.length} Items Found` : 'Identified'}</p>
                  </div>
                </div>
                <button onClick={reset} className="bg-white text-slate-900 font-bold py-4 px-10 rounded-full shadow-lg">New Scan</button>
              </div>
              {mode === RecognitionMode.MENU ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {dishes.map((dish, index) => (
                    <DishCard key={dish.id || index} dish={dish} onClick={() => setSelectedDish(dish)} />
                  ))}
                </div>
              ) : (
                storeResult && <StoreCard store={storeResult} onShowStaff={() => setShowStaffHelper(true)} />
              )}
            </div>
          )}

          {status === AppStatus.ERROR && (
            <div className="text-center p-20 modern-card rounded-[3rem] bg-white">
              <WarningIcon className="w-16 h-16 text-rose-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">Scan Error</h2>
              <p className="text-slate-500 mb-8">{error}</p>
              <button onClick={reset} className="bg-rose-600 text-white px-12 py-4 rounded-full font-bold">Try Again</button>
            </div>
          )}

          {/* 6. Extra Modules (IDLE only) */}
          {status === AppStatus.IDLE && (
            <div className="space-y-32 mt-20">
              <PricingModule onPurchase={(p) => console.log(p)} />
              <AboutUs />
            </div>
          )}
        </main>
      </div>

      {/* 7. Footer & Modals (Always Available) */}
      <Footer
        onMenuScan={() => { setMode(RecognitionMode.MENU); reset(); }}
        onStreetScan={() => { setMode(RecognitionMode.STREET); reset(); }}
        onPricing={() => setShowPricing(true)}
        onPrivacy={() => setLegalView('privacy')}
        onTos={() => setLegalView('tos')}
      />

      {selectedDish && (
        <DishDetailModal 
          dish={selectedDish} 
          onClose={() => setSelectedDish(null)}
          onIngredientClick={(ing) => setWaiterContext({ type: 'ingredient', content_en: ing.name_en, content_cn: ing.name_cn })}
          onSpicyClick={() => setWaiterContext({ type: 'spiciness', content_en: 'Spiciness', content_cn: '辣度' })}
        />
      )}

      {showPricing && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fcfbf9] rounded-[3rem] p-8 relative max-w-4xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <button onClick={() => setShowPricing(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors">✕</button>
            <PricingModule onPurchase={(p) => console.log(p)} />
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