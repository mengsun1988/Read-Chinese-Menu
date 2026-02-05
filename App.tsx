import React, { useState, useRef, useEffect } from 'react';
import { AppStatus, RecognitionMode, Ingredient, StoreResult } from './types';
import { processMenuImage, processStorefrontImage, getDishDeepDetail, WORKER_URL, getOrCreateUserId } from './services/geminiService';
import { useTranslation } from 'react-i18next';

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

// 12 种语言配置
const SUPPORTED_LANGS = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ja', label: '日本語', short: 'JP' },
  { code: 'ko', label: '한국어', short: 'KR' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'de', label: 'Deutsch', short: 'DE' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'th', label: 'ไทย', short: 'TH' },
  { code: 'it', label: 'Italiano', short: 'IT' },
  { code: 'id', label: 'Indo', short: 'ID' },
  { code: 'ms', label: 'Melayu', short: 'MS' },
  { code: 'ar', label: 'العربية', short: 'AR', rtl: true }
];

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // --- 新增：统计脚本动态注入逻辑 ---
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) return;

    // 延迟 3 秒加载，提升 Safari 兼容性，避开 ITP 拦截
    const timer = setTimeout(() => {
      // 1. Google Analytics (gtag.js)
      const gaScript = document.createElement('script');
      gaScript.src = "https://www.googletagmanager.com/gtag/js?id=G-YWYL2JQ1SD";
      gaScript.async = true;
      document.head.appendChild(gaScript);

      gaScript.onload = () => {
        // @ts-ignore
        window.dataLayer = window.dataLayer || [];
        function gtag() { (window as any).dataLayer.push(arguments); }
        // @ts-ignore
        gtag('js', new Date());
        // @ts-ignore
        gtag('config', 'G-YWYL2JQ1SD', { 
          transport_type: 'beacon',
          page_path: window.location.pathname 
        });
      };

      // 2. Umami Analytics
      const umamiScript = document.createElement('script');
      umamiScript.src = "https://cloud.umami.is/script.js";
      umamiScript.async = true;
      umamiScript.defer = true;
      umamiScript.setAttribute('data-website-id', '3357350e-4390-496e-92ce-6e1d43fab83c');
      document.head.appendChild(umamiScript);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // 语言切换核心：i18n + RTL 方向 + URL 参数持久化
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    const langConfig = SUPPORTED_LANGS.find(l => l.code === lng);
    const isRtl = !!langConfig?.rtl;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
    document.title = t('site.title');

    const newUrl = new URL(window.location.href);
    if (lng === 'en') {
      newUrl.searchParams.delete('lang');
    } else {
      newUrl.searchParams.set('lang', lng);
    }
    window.history.replaceState({}, '', newUrl.toString());

    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', newUrl.href);
    setIsLangMenuOpen(false);
  };

  const { usage, isUnlimited, syncWithBackend, handleDailyShare, handleGameWin, clearAchievement } = useUserUsage();

  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [mode, setMode] = useState<RecognitionMode>(RecognitionMode.MENU);
  const [dishes, setDishes] = useState<any[]>([]);
  const [storeResult, setStoreResult] = useState<StoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showStaffHelper, setShowStaffHelper] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showSurvival, setShowSurvival] = useState(false);
  const [legalView, setLegalView] = useState<'privacy' | 'tos' | null>(null);
  const [selectedDish, setSelectedDish] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [waiterContext, setWaiterContext] = useState<{ type: 'ingredient' | 'spiciness'; content_en: string; content_cn: string } | null>(null);
  const [creditUpdateMessage, setCreditUpdateMessage] = useState<string | null>(null);
  const [showIntroOverlay, setShowIntroOverlay] = useState(false);

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

  const scrollToPricing = () => {
    const element = document.getElementById('pricing-section');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToCamera = () => {
    const element = document.getElementById('camera-section');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const onPurchaseSuccess = (newUserData: any) => {
    syncWithBackend(newUserData);
    setShowPricing(false);

    const isPremium = newUserData.passExpiryDate && new Date(newUserData.passExpiryDate) > new Date();
    const msg = isPremium
      ? t('common.purchaseSuccessPremium')
      : t('common.purchaseSuccessCredits');

    setCreditUpdateMessage(msg);
    setTimeout(() => setCreditUpdateMessage(null), 4000);
  };

  const lastLangRef = useRef(i18n.language);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const reward = params.get('reward');

    if (reward === '50') {
      const GIFT_FLAG = 'app_intro_gift_v1';
      if (!localStorage.getItem(GIFT_FLAG) && usage && usage.credits !== undefined) {
        const newCredits = (usage.credits || 0) + 50;
        syncWithBackend({ ...usage, credits: newCredits });
        localStorage.setItem(GIFT_FLAG, 'true');
        setCreditUpdateMessage(`+50 Bonus Credits Received! 🎁`);
        setTimeout(() => setCreditUpdateMessage(null), 4000);
      }
    }

    if (action === 'upload' || action === 'store') {
      if (action === 'store') setMode(RecognitionMode.STREET);
      setShowIntroOverlay(true);
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [usage]);

  useEffect(() => {
    const rawLang = i18n.language.split('-')[0];
    const safeLang = SUPPORTED_LANGS.some(l => l.code === rawLang) ? rawLang : 'en';

    if (status !== AppStatus.SUCCESS || !selectedDish || i18n.language === lastLangRef.current) {
      lastLangRef.current = i18n.language;
      return;
    }

    let ignore = false;
    lastLangRef.current = i18n.language;

    const refreshDetail = async () => {
      try {
        const res = await getDishDeepDetail(selectedDish.name_cn, selectedDish.name_en, safeLang);
        if (!ignore && res) {
          setSelectedDish(prev => (prev ? { ...prev, ...res } : null));
          setDishes(prev => prev.map(d => (d.name_cn === selectedDish.name_cn ? { ...d, ...res } : d)));
        }
      } catch (e) {
        console.error("Language sync failed", e);
      }
    };

    refreshDetail();
    return () => { ignore = true; };
  }, [i18n.language, status]);

  const getCompressedBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 1024;
          let w = img.width, h = img.height;
          if (w > MAX || h > MAX) {
            const r = Math.min(MAX / w, MAX / h);
            w *= r; h *= r;
          }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          const base = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
          if (base) resolve(base);
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus(AppStatus.LOADING);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);

    try {
      const base64 = await getCompressedBase64(file);
      const currentLang = i18n.language;

      if (mode === RecognitionMode.MENU) {
        const result = await processMenuImage(base64, currentLang);

        if (result && result.error === "OUT_OF_CREDITS") {
          reset();
          setShowPricing(true);
          setTimeout(scrollToPricing, 300);
          return;
        }

        if (result && Array.isArray(result.dishes) && result.dishes.length > 0) {
          setDishes(result.dishes);
          if (result.usage) {
            syncWithBackend(result.usage);
            setCreditUpdateMessage(`-50 ${t('common.creditsLeft')}: ${result.usage.credits}`);
            setTimeout(() => setCreditUpdateMessage(null), 3000);
          }
          setStatus(AppStatus.SUCCESS);
        } else {
          throw new Error(t('common.errorNoDishes'));
        }
      } else {
        const rawResult = await processStorefrontImage(base64, currentLang);
        if (rawResult) {
          if (rawResult.usage) syncWithBackend(rawResult.usage);
          const finalStoreData = (rawResult as any).store ||
            (rawResult.store_name ? rawResult : null) ||
            {
              store_name: t('storeCard.localShop'),
              description: t('storeCard.defaultDescription'),
              cuisine_type: "",
              specialty_dishes: [],
              average_price_range: ""
            };
          setStoreResult(finalStoreData);
          setStatus(AppStatus.SUCCESS);
        } else {
          throw new Error(t('common.errorNoShop'));
        }
      }
    } catch (err: any) {
      setError(err.message || t('common.errorUnexpected'));
      setStatus(AppStatus.ERROR);
    }
  };

  const handleDishClick = async (dish: any) => {
    if (dish.isFullyAnalyzed) {
      setSelectedDish(dish);
      return;
    }
    setSelectedDish(dish);
    setLoadingDetail(true);
    try {
      const result = await getDishDeepDetail(dish.name_cn, dish.name_en, i18n.language);
      if (result) {
        if (result.usage) syncWithBackend(result.usage);
        const updatedDish = { ...dish, ...result, isFullyAnalyzed: true };
        setSelectedDish(updatedDish);
        setDishes(prev => prev.map(d => (d.name_cn === dish.name_cn || d.id === dish.id) ? updatedDish : d));
      }
    } catch (e) {
      console.error("Deep Analysis Failed:", e);
      setSelectedDish(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const currentLangObj = SUPPORTED_LANGS.find(l => i18n.language.startsWith(l.code)) || SUPPORTED_LANGS[0];

  return (
    <div className="min-h-screen pb-0 bg-[#fafafa] font-sans w-full overflow-x-hidden">
      {status === AppStatus.IDLE && !showPricing && !showSurvival && !selectedDish && !showStaffHelper && !legalView && !showGame && (
        <div className="fixed top-4 left-0 right-0 z-[5000] px-4 pointer-events-none">
          <header className="max-w-4xl mx-auto h-14 bg-rose-600 rounded-full shadow-[0_10px_30px_rgba(244,63,94,0.4)] flex items-center justify-between px-6 pointer-events-auto">
            <div className="flex items-center">
              <h1 className="text-white font-black text-sm uppercase tracking-tighter">Read Chinese Menu</h1>
            </div>
            <div className="relative">
              <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3.5 py-1.5 rounded-full transition-all border border-white/10 active:scale-95 shadow-inner">
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">{currentLangObj.short}</span>
                <span className={`text-[8px] transition-transform duration-300 ${isLangMenuOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {isLangMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[-1]" onClick={() => setIsLangMenuOpen(false)} />
                  <div className="absolute right-0 mt-4 w-35 bg-white rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.15)] border border-slate-100 p-2.5 grid grid-cols-1 gap-1 animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300">
                    {SUPPORTED_LANGS.map((lang) => (
                      <button key={lang.code} onClick={() => changeLanguage(lang.code)} className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all active:scale-95 ${i18n.language.startsWith(lang.code) ? 'bg-rose-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}`}>
                        <span className="text-xs font-bold tracking-tight">{lang.label}</span>
                        <span className={`text-[9px] font-black uppercase ${i18n.language.startsWith(lang.code) ? 'text-white/60' : 'text-slate-300'}`}>{lang.short}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </header>
        </div>
      )}

      <EffectLayer trigger={usage.achievementTriggered} onComplete={clearAchievement} />
      <A2HSManager />

      <main className="w-full relative pt-20">
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
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
            showGame={showGame}
            onOpenGame={() => setShowGame(true)}
            onCloseGame={() => setShowGame(false)}
          />
        )}
        <div className="max-w-5xl mx-auto px-6">
          {status === AppStatus.LOADING && <div className="py-20 animate-in fade-in duration-500"><LoadingScreen /></div>}
          {status === AppStatus.ERROR && (
            <div className="bg-white border border-rose-100 rounded-[3rem] p-16 text-center space-y-6 shadow-sm mt-10">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto"><WarningIcon className="w-10 h-10" /></div>
              <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tighter">{t('common.scanFailed')}</h2>
              <p className="text-slate-400 text-xs font-bold leading-relaxed">{error}</p>
              <button onClick={reset} className="bg-slate-900 text-white font-black py-4 px-12 rounded-full shadow-lg active:scale-95 transition-all uppercase tracking-widest text-[10px]">{t('common.retryScan')}</button>
            </div>
          )}
          {status === AppStatus.SUCCESS && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6 pb-32">
              <div className="flex justify-between items-center bg-slate-900 p-6 rounded-[2rem] shadow-2xl sticky top-24 z-[110] mx-2 border border-white/5">
                <div className="flex items-center gap-4">
                  {previewUrl && <img src={previewUrl} className="w-12 h-12 object-cover rounded-xl ring-2 ring-white/10" alt="Preview" />}
                  <div className="text-left">
                    <h3 className="font-bold text-white tracking-tight text-sm leading-none mb-1">{mode === RecognitionMode.MENU ? `${dishes.length} ${t('common.itemsFound')}` : t('common.shopIdentified')}</h3>
                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none">{isUnlimited ? t('common.premiumActive') : `${usage.credits} ${t('common.creditsLeft')}`}</p>
                  </div>
                </div>
                <button onClick={reset} className="bg-white/10 hover:bg-white/20 text-white font-black py-2.5 px-6 rounded-full text-[10px] uppercase tracking-wider backdrop-blur-sm transition-colors border border-white/10">{t('common.restart')}</button>
              </div>
              {mode === RecognitionMode.MENU ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                  {dishes.map((dish, index) => <DishCard key={dish.id || `dish-${index}`} dish={dish} onClick={() => handleDishClick(dish)} />)}
                </div>
              ) : (storeResult && <StoreCard store={storeResult} onShowStaff={() => setShowStaffHelper(true)} />)}
            </div>
          )}
        </div>
      </main>

      <Footer onMenuScan={() => { handleModeChange(RecognitionMode.MENU); setTimeout(scrollToCamera, 100); }} onStreetScan={() => { handleModeChange(RecognitionMode.STREET); setTimeout(scrollToCamera, 100); }} onSurvivalOpen={() => setShowSurvival(true)} onPricing={() => setShowPricing(true)} onPrivacy={() => setLegalView('privacy')} onTos={() => setLegalView('tos')} />
      <SurvivalCardView isOpen={showSurvival} onClose={() => setShowSurvival(false)} />

      {showPricing && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowPricing(false)} />
          <div className="relative w-full max-w-5xl animate-in fade-in zoom-in duration-300">
            <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl relative">
              <PricingModule onPurchase={onPurchaseSuccess} onLater={() => setShowPricing(false)} />
              <button onClick={() => setShowPricing(false)} className="absolute top-6 right-8 text-slate-400 hover:text-slate-900 font-black text-2xl z-50">✕</button>
            </div>
          </div>
        </div>
      )}

      {selectedDish && (
        <DishDetailModal
          dish={selectedDish} onClose={() => setSelectedDish(null)} isLoadingDetail={loadingDetail}
          onIngredientClick={(ing: Ingredient) => setWaiterContext({ type: 'ingredient', content_en: ing.name_en, content_cn: ing.name_cn })}
          onSpicyClick={() => setWaiterContext({ type: 'spiciness', content_en: 'spiciness', content_cn: '辣度' })}
        />
      )}

      {waiterContext && <WaiterCard {...waiterContext} onClose={() => setWaiterContext(null)} />}
      {showStaffHelper && <StaffHelperModal onClose={() => setShowStaffHelper(false)} />}
      {legalView && <LegalModal type={legalView} onClose={() => setLegalView(null)} />}

      {showIntroOverlay && (
        <div className="fixed inset-0 z-[11000] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
          <button
            onClick={() => { setShowIntroOverlay(false); triggerUpload(); }}
            className="group flex flex-col items-center gap-6 active:scale-95 transition-all"
          >
            <div className="w-28 h-28 bg-rose-600 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(225,29,72,0.5)] group-hover:bg-rose-500">
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Tap to Start</span>
          </button>
        </div>
      )}

      {creditUpdateMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[10000] w-full max-w-xs px-4 pointer-events-none">
          <div className="pointer-events-auto">
            <CreditUpdateCard message={creditUpdateMessage} onClose={() => setCreditUpdateMessage(null)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;