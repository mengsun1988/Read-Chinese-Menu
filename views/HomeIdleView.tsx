import React, { useState, useEffect, lazy, Suspense } from 'react';
import { RecognitionMode, UserUsage } from '../types';
import { CameraIcon, MessageSquareIcon } from '../components/Icons';
import { useTranslation } from 'react-i18next';

// [Performance] 1. 核心资源：保持同步导入，确保首屏渲染速度
import { WordCloudMarquee } from '../components/WordCloudMarquee';

// [Performance] 2. 非核心资源：改为动态导入，显著减小首屏 JS 体积
const PricingModule = lazy(() => import('../components/PricingModule').then(m => ({ default: m.PricingModule })));
const AboutUs = lazy(() => import('../components/AboutUs').then(m => ({ default: m.AboutUs })));
const Reviews = lazy(() => import('../components/Reviews').then(m => ({ default: m.Reviews })));
const SupportSection = lazy(() => import('../components/SupportSection').then(m => ({ default: m.SupportSection })));
const MenuMasterMind = lazy(() => import('../components/MenuMasterMind'));

interface Props {
  mode: RecognitionMode;
  onModeChange: (mode: RecognitionMode) => void;
  onTriggerUpload: () => void;
  onOpenSurvival: () => void;
  onPurchase: (plan: any) => void;
  onHandleDailyShare: () => void;
  usage: UserUsage;
  onShowDishDetail: (dish: any) => void;
  onGameWin: () => void; 
}

export const HomeIdleView: React.FC<Props> = ({
  mode,
  onModeChange,
  onTriggerUpload,
  onOpenSurvival,
  onPurchase,
  onHandleDailyShare,
  usage,
  onShowDishDetail,
  onGameWin 
}) => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showGame, setShowGame] = useState(false); 
  
  const totalCredits = usage.credits ?? 0;
  const isUnlimited = usage.passExpiryDate ? new Date(usage.passExpiryDate).getTime() > Date.now() : false;

  useEffect(() => {
    if (!isUnlimited && totalCredits <= 0 && usage.scanCount > 0) {
      const timer = setTimeout(() => {
        const supportSection = document.getElementById('support-section');
        const pricingSection = document.getElementById('pricing-section');
        if (supportSection) {
          supportSection.scrollIntoView({ behavior: 'smooth' });
        } else if (pricingSection) {
          pricingSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [totalCredits, isUnlimited, usage.scanCount]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMainAction = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (mode === RecognitionMode.STREET) {
      onTriggerUpload();
      return;
    }
    if (!isUnlimited && totalCredits < 50) {
      setShowPricingModal(true);
      return;
    }
    onTriggerUpload();
  };

  const renderSubtext = () => {
    if (isUnlimited) {
      const daysLeft = Math.max(0, Math.ceil((new Date(usage.passExpiryDate!).getTime() - Date.now()) / 86400000));
      return `${daysLeft}d ${t('common.premiumActive')}`;
    }
    if (totalCredits <= 0) return t('common.creditsExhausted');
    return t('common.readyToScan');
  };

  const faqItems = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') }
  ];

  return (
    <div className="animate-in fade-in duration-500 w-full overflow-x-hidden bg-slate-50">
      {/* 1. Hero Section */}
      <header className="mb-10 space-y-6 text-center pt-16 px-4 max-w-4xl mx-auto">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">{t('home.chinaTravelMate')}</span>
          </div>
          
          {/* 【LCP 核心】大小写已恢复，类名对齐 index.html 的静态渲染 */}
          <h1 className="lcp-title text-4xl md:text-6xl font-black text-slate-800 tracking-tighter leading-[1.1]">
            Read <span className="text-rose-600">Chinese Menu</span>
          </h1>
        </div>

        <div className="space-y-6">
          <div className="text-slate-500 font-medium text-sm md:text-base leading-relaxed max-w-md mx-auto">
            {t('home.understandMenus')} {t('home.menuDetails')}
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 px-4 max-w-2xl mx-auto">
            {[t('common.noAds'), t('common.noSignup'), t('common.paypalSecurity'), t('common.privacyFirst')].map((tag) => (
              <div key={tag} className="px-3 py-1.5 bg-white border border-slate-200/60 rounded-full flex items-center gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:scale-105 transition-transform">
                <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                <span className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* 2. Interaction Area */}
      <div className="max-w-lg mx-auto px-6 mb-16 space-y-5">
        {(!usage.dailyShareDate || usage.dailyShareDate !== new Date().toISOString().split('T')[0]) && usage.shareCount < 5 && (
          <div className="animate-in slide-in-from-top-4 duration-500">
            <button onClick={onHandleDailyShare} className="w-full bg-emerald-50/50 border border-emerald-100/80 p-5 rounded-[2.5rem] flex items-center justify-between group hover:bg-emerald-100/40 transition-all active:scale-98 shadow-sm">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm group-hover:rotate-12 transition-transform">🎁</div>
                <div>
                  <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">{t('common.dailyReward')}</p>
                  <p className="text-xs font-bold text-slate-800">{t('common.shareForCredits')}</p>
                </div>
              </div>
              <span className="bg-emerald-600 text-white px-3 py-1.5 rounded-full text-[8px] font-black shadow-md shadow-emerald-200 uppercase tracking-wider">{t('common.share')}</span>
            </button>
          </div>
        )}

        <div className="bg-slate-200/40 p-1.5 rounded-[2rem] flex gap-1 border border-slate-200/50 w-full relative">
          <button 
            onClick={() => onModeChange(RecognitionMode.MENU)} 
            className={`relative flex-1 h-[54px] flex items-center justify-center rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest transition-all ${mode === RecognitionMode.MENU ? 'bg-white text-rose-600 shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100' : 'text-slate-400 hover:text-slate-500'}`}
          >
            {t('home.orderFood')}
            <span 
              onClick={(e) => { e.stopPropagation(); setShowPricingModal(true); }} 
              className={`absolute -top-2 -right-1 px-2 py-0.5 rounded-md font-black shadow-sm border border-white transition-all text-[8px] h-[18px] flex items-center gap-1 whitespace-nowrap ${totalCredits > 0 || isUnlimited ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white animate-bounce'}`}
            >
              {isUnlimited ? '∞' : `${totalCredits}`}
              <span className="opacity-80 uppercase">
                {isUnlimited ? t('common.unlimited') : t('common.freeCredits')}
              </span>
            </span>
          </button>
          <button onClick={() => onModeChange(RecognitionMode.STREET)} className={`relative flex-1 h-[54px] flex items-center justify-center rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest transition-all ${mode === RecognitionMode.STREET ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-500'}`}>
            {t('home.storefront')}
            <span className="absolute -top-2 -right-1 bg-amber-400 text-[8px] text-slate-800 px-2 py-0.5 rounded-md font-black shadow-sm border border-white whitespace-nowrap h-[18px] flex items-center">{t('home.free')}</span>
          </button>
        </div>

        <div className="bg-white border border-slate-200/60 p-10 text-center flex flex-col items-center shadow-[0_15px_40px_rgba(0,0,0,0.03)] rounded-[3.5rem] relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(225,29,72,0.08)] hover:border-rose-100 hover:-translate-y-1.5 transition-all duration-700">
          <div className={`absolute -top-24 -right-24 w-48 h-48 blur-3xl opacity-[0.06] rounded-full transition-colors duration-1000 ${mode === RecognitionMode.MENU ? 'bg-rose-500' : 'bg-slate-900'}`} />
          
          <button onClick={(e) => handleMainAction(e)} className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-all active:scale-90 group-hover:rotate-3 relative z-10 animate-pulse-slow mb-8 ${mode === RecognitionMode.MENU ? 'bg-rose-600 shadow-rose-200' : 'bg-slate-900 shadow-slate-300'}`}>
            <CameraIcon className="w-10 h-10 text-white" />
          </button>
          
          <h2 className="text-3xl font-black text-slate-800 mb-6 tracking-tighter">{mode === RecognitionMode.MENU ? t('common.scanMenu') : t('common.exploreSigns')}</h2>
          
          <button onClick={(e) => handleMainAction(e)} className="w-full bg-slate-900 text-white font-black py-5 rounded-full shadow-xl shadow-slate-200 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all uppercase tracking-[0.2em] text-xs">
            {t('common.uploadImage')}
          </button>
          
          <div className="mt-8 flex flex-col items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400 text-center leading-tight px-2">
              {mode === RecognitionMode.MENU ? t('home.uploadMenu') : t('home.uploadSigns')}
            </span>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${totalCredits >= 50 || isUnlimited ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-800 opacity-40">{renderSubtext()}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowGame(true)}
          className="w-full bg-emerald-600 border border-emerald-500/50 p-8 rounded-[3rem] flex items-center gap-6 shadow-xl shadow-emerald-100 active:scale-[0.98] hover:shadow-2xl hover:shadow-emerald-200/50 hover:-translate-y-1 transition-all group"
        >
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:rotate-12 transition-transform duration-300">
            <span className="text-3xl">🥟</span>
          </div>
          <div className="text-left flex-1">
            <h3 className="text-white text-xl font-black tracking-tight uppercase leading-none">{t('home.menuMasterMind')}</h3>
            <p className="text-emerald-50 text-[11px] font-bold mt-1 opacity-80">{t('home.gameDescription')}</p>
          </div>
          <span className="text-white/40 font-black text-xl group-hover:translate-x-1 transition-transform">→</span>
        </button>

        <button onClick={onOpenSurvival} className="group relative w-full bg-white border border-slate-200/40 p-8 rounded-[3rem] flex items-center gap-6 shadow-md active:scale-[0.98] hover:shadow-xl hover:border-rose-100/50 hover:-translate-y-1 transition-all">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300"><MessageSquareIcon className="w-8 h-8" /></div>
          <div className="text-left flex-1">
            <h3 className="text-slate-800 text-xl font-black tracking-tight uppercase leading-none">{t('home.survivalCards')}</h3>
            <p className="text-slate-400 text-[11px] font-bold mt-1">{t('home.commonPhrases')}</p>
          </div>
          <span className="text-slate-200 font-bold group-hover:translate-x-2 transition-transform">→</span>
        </button>
      </div>

      {/* 3. Footer & Sections - 使用 Suspense 包裹懒加载组件 */}
      <Suspense fallback={<div className="h-40 flex items-center justify-center text-slate-200">...</div>}>
        <div className="w-full space-y-24 pb-20 bg-slate-50 border-t border-slate-100">
          <div id="pricing-section" className="max-w-4xl mx-auto px-4 pt-20">
            <SupportSection onPurchase={onPurchase} credits={totalCredits} />
          </div>

          <div className="max-w-5xl mx-auto px-4">
            <PricingModule onPurchase={onPurchase} />
          </div>

          <div className="py-20 border-y border-slate-200/30 bg-white/30 backdrop-blur-sm">
            <WordCloudMarquee onShowDetail={onShowDishDetail} />
          </div>

          <div className="max-w-4xl mx-auto px-4">
            <AboutUs />
          </div>
          
          <div className="space-y-8 w-full">
            <h3 className="text-center text-3xl font-black text-slate-800 uppercase tracking-tighter">{t('home.gourmetFeed')}</h3>
            <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory no-scrollbar px-[5vw]">
              <Reviews isHorizontal />
            </div>
          </div>

          <div className="space-y-8 pt-8 border-t border-slate-200/60 w-full py-12">
            <h3 className="text-center text-3xl font-black text-slate-800 uppercase tracking-tighter">{t('home.commonQuestions')}</h3>
            <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory no-scrollbar px-[5vw]">
              {faqItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className="min-w-[320px] md:min-w-[400px] bg-white p-8 rounded-[3.5rem] snap-center flex flex-col border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]"
                >
                  <p className="text-slate-800 font-black text-xl leading-tight mb-3">{item.q}</p>
                  <div className="h-px w-8 bg-rose-200 mb-4" />
                  <p className="text-slate-500 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026<br/>Read Chinese Menu</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">{t('common.allRightsReserved')}</p>
          </div>
        </div>
      </Suspense>

      {/* 4. Overlays - 模态框同样使用 Suspense */}
      {showPricingModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setShowPricingModal(false)} />
          <div className="relative w-full max-w-5xl animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-500 ease-out">
            <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-2xl relative border border-white/20">
                <Suspense fallback={<div className="h-[60vh] flex items-center justify-center">Loading...</div>}>
                  <PricingModule onPurchase={(p) => { onPurchase(p); setShowPricingModal(false); }} />
                </Suspense>
                <button 
                  onClick={() => setShowPricingModal(false)}
                  className="absolute top-6 right-8 text-slate-300 hover:text-slate-800 font-light text-3xl z-50 transition-colors"
                >✕</button>
            </div>
          </div>
        </div>
      )}

      {showGame && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setShowGame(false)} />
          <div className="relative w-full max-w-lg animate-in fade-in zoom-in-90 slide-in-from-bottom-12 duration-500 ease-out-expo">
            <Suspense fallback={null}>
              <MenuMasterMind 
                onFinish={() => setShowGame(false)} 
                onAwardPoints={onGameWin} 
              />
            </Suspense>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .snap-mandatory { scroll-snap-type: x mandatory; scroll-behavior: smooth; }
        .snap-center { scroll-snap-align: center; }
        @keyframes pulse-slow { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .ease-out-expo { transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1); }
      `}} />
    </div>
  );
};