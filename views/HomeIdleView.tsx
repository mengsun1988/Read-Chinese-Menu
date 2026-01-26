import React, { useState, useEffect } from 'react';
import { RecognitionMode, UserUsage } from '../types';
import { CameraIcon, MessageSquareIcon, WarningIcon } from '../components/Icons';
import { WordCloudMarquee } from '../components/WordCloudMarquee';
import { PricingModule } from '../components/PricingModule';
import { AboutUs } from '../components/AboutUs';
import { Reviews } from '../components/Reviews';
import { SupportSection } from '../components/SupportSection';

const MapIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
    <line x1="8" y1="2" x2="8" y2="18"></line>
    <line x1="16" y1="6" x2="16" y2="22"></line>
  </svg>
);

interface Props {
  mode: RecognitionMode;
  onModeChange: (mode: RecognitionMode) => void;
  onTriggerUpload: () => void;
  onOpenSurvival: () => void;
  onPurchase: (plan: any) => void;
  onHandleDailyShare: () => void;
  usage: UserUsage; // 确保包含 credits, scanCount, achievementTriggered
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
  
  // 映射后端逻辑
  const credits = usage.credits ?? 150;
  const scanCount = usage.scanCount ?? 0;
  const isUnlimited = usage.passExpiryDate ? new Date(usage.passExpiryDate).getTime() > Date.now() : false;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 150);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 监听成就触发
  useEffect(() => {
    if (usage.achievementTriggered) {
      // 这里可以触发你项目中的全局 Toast 或 Confetti 动画
      console.log("Achievement Unlocked:", usage.achievementTriggered);
    }
  }, [usage.achievementTriggered]);

  // 核心拦截逻辑：判断是否允许扫描
  const handleMainAction = () => {
    // 如果是第 6 顿（index >= 5）且没钱了，弹出付费
    if (scanCount >= 5 && credits < 50 && !isUnlimited) {
      setShowPricingModal(true);
    } else {
      onTriggerUpload();
    }
  };

  // 动态渲染副标题文案
  const renderSubtext = () => {
    if (isUnlimited) return `${Math.max(0, Math.ceil((new Date(usage.passExpiryDate!).getTime() - Date.now()) / 86400000))}d Premium Active`;
    if (scanCount === 4) return <span className="text-rose-600 font-black animate-pulse">🎁 Reward meal · No payment needed</span>;
    if (scanCount >= 5 && credits < 50) return <span className="text-amber-600 font-black text-[8px]">Support us or Share to unlock more meals</span>;
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
        <span className="text-white font-black text-sm tracking-tighter">Read Chinese Menu</span>
      </div>

      {/* 2. Brand Header */}
      <header className="mb-8 space-y-4 text-center pt-10 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full">
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
          <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">Your China Travel Mate</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tighter leading-none">
          Read <span className="text-rose-600">Chinese Menu</span>
        </h1>
        <p className="text-slate-400 font-bold text-[10px] md:text-xs tracking-[0.2em] uppercase">
          Identify dishes • Check ingredients • 30+ Milestones
        </p>
      </header>

      <main className="max-w-xl mx-auto px-4">
        
        {/* 3. Share Bonus - 仅在需要时或第5顿后突出显示 */}
        {scanCount >= 5 && (
          <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
            <button 
              onClick={onHandleDailyShare} 
              className="w-full bg-emerald-50/40 border border-emerald-100 p-4 rounded-[2rem] flex items-center justify-between group hover:bg-emerald-50 transition-all active:scale-95 shadow-sm"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm group-hover:rotate-12 transition-transform">🎁</div>
                <div>
                  <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Daily Reward</p>
                  <p className="text-xs font-bold text-slate-900">Share once for +50 Credits</p>
                </div>
              </div>
              <span className="bg-emerald-600 text-white px-3 py-1.5 rounded-full text-[8px] font-black shadow-md">SHARE</span>
            </button>
          </div>
        )}

        {/* 4. Switcher - 与 Credits 联动 */}
        <div className="flex flex-col gap-6 mb-6">
          <div className="bg-slate-100/50 p-1.5 rounded-2xl flex gap-1 border border-slate-200/50 w-full relative">
            <button 
              onClick={() => onModeChange(RecognitionMode.MENU)} 
              className={`relative flex-1 h-[46px] flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === RecognitionMode.MENU ? 'bg-white text-rose-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
            >
              Order Food
              <span 
                onClick={(e) => { e.stopPropagation(); setShowPricingModal(true); }}
                className={`absolute -top-2 -right-1 px-2 py-0.5 rounded-md font-black shadow-sm border border-white transition-all text-[8px] h-[18px] flex items-center ${
                  credits > 0 || isUnlimited ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white animate-bounce'
                }`}
              >
                {isUnlimited ? '∞' : credits} CREDITS
              </span>
            </button>
            <button 
              onClick={() => onModeChange(RecognitionMode.STREET)} 
              className={`relative flex-1 h-[46px] flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === RecognitionMode.STREET ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'}`}
            >
              Streets
              <span className="absolute -top-2 -right-1 bg-amber-400 text-[8px] text-slate-900 px-2 py-0.5 rounded-md font-black shadow-sm border border-white whitespace-nowrap h-[18px] flex items-center">FREE</span>
            </button>
          </div>
        </div>

        {/* 5. Camera Button Section */}
        <div className="bg-white border border-slate-100 p-10 md:p-12 text-center flex flex-col items-center shadow-xl mb-6 rounded-[3rem] relative overflow-hidden group">
          <div className={`absolute -top-24 -right-24 w-48 h-48 blur-3xl opacity-10 rounded-full transition-colors ${mode === RecognitionMode.MENU ? 'bg-rose-500' : 'bg-slate-900'}`} />
          
          <button 
            onClick={handleMainAction} 
            className={`w-24 h-24 rounded-[2.2rem] flex items-center justify-center shadow-2xl transition-all active:scale-90 relative z-10 animate-pulse-slow mb-6 ${
              mode === RecognitionMode.MENU ? 'bg-rose-600 shadow-rose-200' : 'bg-slate-900 shadow-slate-200'
            }`}
          >
            <CameraIcon className="w-10 h-10 text-white" />
          </button>
          
          <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter">
            {mode === RecognitionMode.MENU ? "Scan Menu" : "Explore Signs"}
          </h2>
          
          <button 
            onClick={handleMainAction} 
            className="w-full bg-slate-900 text-white font-black py-5 rounded-full shadow-xl hover:bg-slate-800 active:scale-[0.97] transition-all uppercase tracking-[0.2em] text-xs"
          >
            {scanCount >= 5 && credits < 50 ? "Unlock More Meals" : "Scan or Upload"}
          </button>

          <div className="mt-5 flex items-center gap-2 opacity-80">
            <div className={`w-1.5 h-1.5 rounded-full ${credits > 0 || isUnlimited ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">
              {renderSubtext()}
            </span>
          </div>
        </div>

        {/* 6. Survival Cards */}
        <button 
          onClick={onOpenSurvival}
          className="group relative w-full bg-white border border-slate-100 p-8 rounded-[3rem] flex items-center gap-6 shadow-lg active:scale-[0.98] transition-all mb-10"
        >
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shrink-0">
              <MessageSquareIcon className="w-8 h-8" />
          </div>
          <div className="text-left flex-1">
              <h3 className="text-slate-900 text-xl font-black tracking-tight uppercase leading-none">Survival Cards</h3>
              <p className="text-slate-400 text-[11px] font-bold mt-1">100+ phrases for safe travel</p>
          </div>
          <span className="text-slate-300 font-bold">→</span>
        </button>
      </main>

      {/* 7. Footer & Content */}
      <div className="py-12 border-t border-slate-50">
        <WordCloudMarquee onShowDetail={onShowDishDetail} />
      </div>

      <div className="space-y-20 pb-20">
        <AboutUs />
        <Reviews />
        <div id="support" className="px-4">
           <SupportSection onPurchase={onPurchase} />
        </div>
      </div>

      {/* 8. Fullscreen Pricing Modal (Only when triggered) */}
      {showPricingModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPricingModal(false)} />
          <div className="relative w-full max-w-sm">
            <PricingModule 
              onPurchase={(p) => { onPurchase(p); setShowPricingModal(false); }} 
              onLater={() => setShowPricingModal(false)} 
            />
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};