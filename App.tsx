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

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [mode, setMode] = useState<RecognitionMode>(RecognitionMode.MENU);
  const [dishes, setDishes] = useState<any[]>([]);
  const [storeResult, setStoreResult] = useState<StoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [selectedDish, setSelectedDish] = useState<any | null>(null);
  const [waiterContext, setWaiterContext] = useState<any | null>(null);
  const [showStaffHelper, setShowStaffHelper] = useState(false);
  const [legalView, setLegalView] = useState<any>(null);

  const [usage, setUsage] = useState<UserUsage>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { freeCredits: 15, paidCredits: 0, lastResetDate: new Date().toISOString().split('T')[0] };
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus(AppStatus.LOADING);
    setPreviewUrl(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        if (mode === RecognitionMode.MENU) {
          const res = await processMenuImage(base64);
          setDishes(res);
          setStatus(AppStatus.SUCCESS);
        } else {
          // Store mode...
          setStatus(AppStatus.SUCCESS);
        }
      } catch (err: any) {
        setError(err.message);
        setStatus(AppStatus.ERROR);
      }
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setStatus(AppStatus.IDLE);
    setDishes([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] font-['Roboto']">
      <A2HSManager />
      <div className="max-w-5xl mx-auto px-6 py-16">
        <header className="mb-16 text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-semibold text-slate-900 tracking-tighter font-['Poppins']">
            Read <span className="text-[#e11d48]">Chinese Menu</span>
          </h1>
          <p className="text-[#e11d48] font-bold uppercase tracking-widest text-[10px]">Explorer Edition</p>
        </header>

        <main>
          {status === AppStatus.IDLE && (
            <div className="space-y-24">
              <div className="bg-white p-12 md:p-20 text-center shadow-2xl rounded-[3rem] border border-slate-100 flex flex-col items-center">
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-3xl bg-[#e11d48] flex items-center justify-center mb-10 shadow-xl">
                  <CameraIcon className="w-10 h-10 text-white" />
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full max-w-xs bg-slate-900 text-white font-bold py-5 rounded-2xl shadow-lg">UPLOAD MENU</button>
              </div>
              
              {/* 这里恢复你的 Buy me a coffee 模块 */}
              <PricingModule onPurchase={() => {}} />
              <AboutUs />
              <Reviews />
            </div>
          )}

          {status === AppStatus.LOADING && <LoadingScreen />}

          {status === AppStatus.SUCCESS && (
            <div className="space-y-12">
              <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] sticky top-6 z-20">
                <h3 className="text-white font-bold">Results ({dishes.length})</h3>
                <button onClick={reset} className="bg-white px-6 py-2 rounded-xl text-xs font-bold">NEW SCAN</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {dishes.map((dish, i) => <DishCard key={i} dish={dish} onClick={() => setSelectedDish(dish)} />)}
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer onMenuScan={reset} onStreetScan={reset} onPricing={() => setShowPricing(true)} onPrivacy={() => {}} onTos={() => {}} />
      
      {selectedDish && (
        <DishDetailModal 
          dish={selectedDish} 
          onClose={() => setSelectedDish(null)}
          onIngredientClick={(ing) => setWaiterContext({ type: 'ingredient', ...ing })}
          onSpicyClick={() => {}}
        />
      )}
      {waiterContext && <WaiterCard {...waiterContext} onClose={() => setWaiterContext(null)} />}
    </div>
  );
};

export default App;