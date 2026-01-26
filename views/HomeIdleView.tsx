import React, { useState, useEffect } from 'react';
import { RecognitionMode, UserUsage } from '../types';
import { CameraIcon, MessageSquareIcon } from '../components/Icons';
import { WordCloudMarquee } from '../components/WordCloudMarquee';
import { PricingModule } from '../components/PricingModule';
import { AboutUs } from '../components/AboutUs';
import { Reviews } from '../components/Reviews';
import { SupportSection } from '../components/SupportSection';

interface Props {
  mode: RecognitionMode;
  onModeChange: (mode: RecognitionMode) => void;
  onTriggerUpload: () => void;
  onOpenSurvival: () => void;
  onPurchase: (plan: any) => void;
  onHandleDailyShare: () => void;
  usage: UserUsage;
  onShowDishDetail: (dish: any) => void;
}

export const HomeIdleView: React.FC<Props> = ({
  mode,
  onModeChange,
  onTriggerUpload,
  onOpenSurvival,
  onPurchase,
  onHandleDailyShare,
  usage,
  onShowDishDetail
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  
  const credits = usage.credits ?? 150;
  const scanCount = usage.scanCount ?? 0;
  const isUnlimited = usage.passExpiryDate ? new Date(usage.passExpiryDate).getTime() > Date.now() : false;
  
  // 这里的逻辑确保在 localhost 开发时 VITE_DEBUG=true 就能看到所有模块
  const isDebug = process.env.VITE_DEBUG === 'true';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 150);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMainAction = () => {
    if (scanCount >= 5 && credits < 50 && !isUnlimited) {
      setShowPricingModal(true);
    } else {
      onTriggerUpload();
    }
  };

  const getAchievementTitle = () => {
    if (scanCount >= 20) return "🏆 China Dining Master";
    if (scanCount >= 10) return "🎖️ Gourmet Foodie";
    if (scanCount >= 5) return "🥈 Brave Explorer";
    return null;
  };

  const renderSubtext = () => {
    if (isUnlimited) return `${Math.max(0, Math.ceil((new Date(usage.passExpiryDate!).getTime() - Date.now()) / 86400000))}d Premium Active`;
    if (usage.achievementTriggered === 'milestone_4_reward') return <span className="text-rose-600 font-black animate-bounce">✨ Bonus Credits Added!</span>;
    if (scanCount === 4) return <span className="text-rose-600 font-black animate-pulse">🎁 Reward meal · Free of charge</span>;
    const achievement = getAchievementTitle();
    if (achievement && scanCount < 20) return <span className="text-slate-900 font-black opacity-60 uppercase tracking-widest">{achievement}</span>;
    if (scanCount >= 5 && credits < 50) return <span className="text-amber-600 font-black text-[9px]">Credits exhausted · Support to unlock</span>;
    return "Vision AI Connected";
  };

  return (
    <div className="animate-in fade-in duration-700">
      {/* 1. Sticky Bar */}
      <div 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed top-0 left-0 right-0 z-[150] h-14 flex items-center justify-center transition-all duration-500 cursor-pointer ${
          isScrolled ? 'translate-y-0 opacity-100 bg-rose-600/90 backdrop-blur-md shadow-lg' : '-translate-y-full opacity-0 bg-transparent'
        }`}
      >
        <span className="text-white font-black text-sm tracking-tighter uppercase">Read Chinese Menu</span>
      </div>

      {/* 2. Brand Header */}
      <header className="mb-8 space-y-4 text-center pt-10 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full">
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
          <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">Your China Travel Mate</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tighter leading-none">
          Read <span className="text-rose-600">Chinese Menu</span>
        </h1>
        <p className="text-slate-400 font-bold text-[10px] md:text-xs tracking-[0.2em] uppercase">
          NO ADS • NO LOGIN • NO DOWNLOAD
        </p>
      </header>

      {/* 3-5. 核心交互区 (窄屏容器) */}
      <div className="max-w-xl mx-auto px-4 mb-12">
        {/* Daily Share Reward */}
        {scanCount >= 5 && credits < 100 && (
          <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
            <button onClick={onHandleDailyShare} className="w-full bg-emerald-50/40 border border-emerald-100 p-4 rounded-[2rem] flex items-center justify-between group hover:bg-emerald-50 transition-all active:scale-95 shadow-sm">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm group-hover:rotate-12 transition-transform">🎁</div>
                <div>
                  <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Daily Reward</p>
                  <p className="text-xs font-bold text-slate-900">Share for +50 Credits</p>
                </div>
              </div>
              <span className="bg-emerald-600 text-white px-3 py-1.5 rounded-full text-[8px] font-black shadow-md uppercase tracking-wider">Share</span>
            </button>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="flex flex-col gap-6 mb-6">
          <div className="bg-slate-100/50 p-1.5 rounded-2xl flex gap-1 border border-slate-200/50 w-full relative">
            <button 
              onClick={() => onModeChange(RecognitionMode.MENU)} 
              className={`relative flex-1 h-[46px] flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === RecognitionMode.MENU ? 'bg-white text-rose-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
            >
              Order Food
              <span onClick={(e) => { e.stopPropagation(); setShowPricingModal(true); }} className={`absolute -top-2 -right-1 px-2 py-0.5 rounded-md font-black shadow-sm border border-white transition-all text-[8px] h-[18px] flex items-center ${credits > 0 || isUnlimited ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white animate-bounce'}`}>
                {isUnlimited ? '∞' : credits} CREDITS
              </span>
            </button>
            <button onClick={() => onModeChange(RecognitionMode.STREET)} className={`relative flex-1 h-[46px] flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === RecognitionMode.STREET ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'}`}>
              Streets
              <span className="absolute -top-2 -right-1 bg-amber-400 text-[8px] text-slate-900 px-2 py-0.5 rounded-md font-black shadow-sm border border-white whitespace-nowrap h-[18px] flex items-center">FREE</span>
            </button>
          </div>
        </div>

        {/* Main Camera Card */}
        <div className="bg-white border border-slate-100 p-10 md:p-12 text-center flex flex-col items-center shadow-xl mb-6 rounded-[3rem] relative overflow-hidden group">
          <div className={`absolute -top-24 -right-24 w-48 h-48 blur-3xl opacity-10 rounded-full transition-colors ${mode === RecognitionMode.MENU ? 'bg-rose-500' : 'bg-slate-900'}`} />
          <button onClick={handleMainAction} className={`w-24 h-24 rounded-[2.2rem] flex items-center justify-center shadow-2xl transition-all active:scale-90 relative z-10 animate-pulse-slow mb-6 ${mode === RecognitionMode.MENU ? 'bg-rose-600 shadow-rose-200' : 'bg-slate-900 shadow-slate-200'}`}>
            <CameraIcon className="w-10 h-10 text-white" />
          </button>
          <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter">{mode === RecognitionMode.MENU ? "Scan Menu" : "Explore Signs"}</h2>
          <button onClick={handleMainAction} className="w-full bg-slate-900 text-white font-black py-5 rounded-full shadow-xl hover:bg-slate-800 active:scale-[0.97] transition-all uppercase tracking-[0.2em] text-xs">
            {scanCount >= 5 && credits < 50 ? "Unlock More Meals" : "Upload Image"}
          </button>
          <div className="mt-5 flex items-center gap-2 opacity-80">
            <div className={`w-1.5 h-1.5 rounded-full ${credits > 0 || isUnlimited ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">{renderSubtext()}</span>
          </div>
        </div>

        {/* Survival Cards (Inner) */}
        <button onClick={onOpenSurvival} className="group relative w-full bg-white border border-slate-100 p-8 rounded-[3rem] flex items-center gap-6 shadow-lg active:scale-[0.98] transition-all mb-4">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shrink-0 group-hover:bg-rose-100 transition-colors"><MessageSquareIcon className="w-8 h-8" /></div>
          <div className="text-left flex-1">
            <h3 className="text-slate-900 text-xl font-black tracking-tight uppercase leading-none">Survival Cards</h3>
            <p className="text-slate-400 text-[11px] font-bold mt-1">100+ phrases for safe travel</p>
          </div>
          <span className="text-slate-300 font-bold group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>

      {/* 6. 宽屏展示区 (无限制容器) */}
      <div className="px-4 md:px-8 lg:px-12 max-w-7xl mx-auto space-y-16 pb-20">
        
        {/* SupportSection: Debug 或 扫描满5次展示 */}
        {(isDebug || scanCount >= 5) && (
          <div className="animate-in slide-in-from-bottom-6 duration-700">
            <SupportSection onPurchase={onPurchase} />
          </div>
        )}

        {/* PricingModule: 仅在 Debug 模式下平铺展示，且此时不被窄容器挤压 */}
        {isDebug && (
          <div className="animate-in slide-in-from-bottom-6 duration-700 pt-8 border-t border-slate-100">
            <div className="mb-8 text-center">
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">Debug Mode: Pricing Preview</span>
            </div>
            <PricingModule onPurchase={onPurchase} />
          </div>
        )}

        {/* Footer Content */}
        <div className="py-12 border-t border-slate-100">
          <WordCloudMarquee onShowDetail={onShowDishDetail} />
        </div>

        <div className="space-y-24">
          <AboutUs />
          <Reviews />
        </div>

        <div className="text-center pt-10">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 Read Chinese Menu • Safe Travels</p>
        </div>
      </div>

      {/* Pricing Modal: 正常触发逻辑 (点击 Credits 按钮等) */}
      {showPricingModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPricingModal(false)} />
          <div className="relative w-full max-w-5xl"> {/* 弹窗内也给到 5xl 宽度防止挤压 */}
            <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl">
               <PricingModule onPurchase={(p) => { onPurchase(p); setShowPricingModal(false); }} />
               <button 
                onClick={() => setShowPricingModal(false)}
                className="absolute top-6 right-8 text-slate-400 hover:text-slate-900 font-black text-2xl"
               >✕</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};