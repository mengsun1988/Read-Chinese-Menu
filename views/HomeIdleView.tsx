import React, { useState, useEffect } from 'react';
import { RecognitionMode, UserUsage } from '../types';
import { CameraIcon, MessageSquareIcon, WarningIcon } from '../components/Icons';
import { WordCloudMarquee } from '../components/WordCloudMarquee';
import { PricingModule } from '../components/PricingModule';
import { AboutUs } from '../components/AboutUs';
import { Reviews } from '../components/Reviews';
import { SupportSection } from '../components/SupportSection';

// 补齐缺失的 MapIcon 定义
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
  const totalCredits = (usage.freeCredits || 0) + (usage.paidCredits || 0);
  const isUnlimited = usage.passExpiryDate ? new Date(usage.passExpiryDate).getTime() > Date.now() : false;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getRemainingDays = () => {
    if (!usage.passExpiryDate) return 0;
    const diff = new Date(usage.passExpiryDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="animate-in fade-in duration-700">
      {/* 1. Sticky Bar */}
      <div 
        onClick={scrollToTop}
        className={`fixed top-0 left-0 right-0 z-[150] h-14 flex items-center justify-center transition-all duration-500 cursor-pointer ${
          isScrolled 
            ? 'translate-y-0 opacity-100 bg-rose-600/90 backdrop-blur-md shadow-lg' 
            : '-translate-y-full opacity-0 bg-transparent'
        }`}
      >
        <span className="text-white font-black text-sm tracking-tighter">Read Chinese Menu</span>
      </div>

      {/* 2. Brand Header */}
      <header className="mb-8 space-y-4 text-center pt-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full">
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
          <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">Your China Travel Mate</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tighter leading-none">
          Read <span className="text-rose-600">Chinese Menu</span>
        </h1>
        <div className="space-y-2">
          <p className="text-slate-400 font-bold text-[10px] md:text-xs tracking-[0.2em] max-w-xl mx-auto uppercase px-4">
            Identify dishes • Check ingredients • Communicate with staff
          </p>
          <p className="text-slate-300 font-bold text-[9px] tracking-[0.15em] uppercase flex items-center justify-center gap-2">
            No Ads <span>·</span> No Download <span>·</span> Built with Heart
          </p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4">
        {/* 3. Share Bonus */}
        <div className="mb-6">
          <button 
            onClick={onHandleDailyShare} 
            className="w-full bg-emerald-50/40 border border-emerald-100 p-4 rounded-[2rem] flex items-center justify-between group hover:bg-emerald-50 transition-all active:scale-95 shadow-sm"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm group-hover:rotate-12 transition-transform">🎁</div>
              <div>
                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Spread the word</p>
                <p className="text-xs font-bold text-slate-900">Share to WhatsApp/Social for 5+ scans</p>
              </div>
            </div>
            <span className="bg-emerald-600 text-white px-3 py-1.5 rounded-full text-[8px] font-black shadow-md">CLAIM</span>
          </button>
        </div>

        {/* 4. Switcher */}
        <div className="flex flex-col gap-6 mb-6">
          <div className="flex justify-center">
            <div className="bg-slate-100/50 p-1.5 rounded-2xl flex gap-1 border border-slate-200/50 w-full relative">
              <button 
                onClick={() => onModeChange(RecognitionMode.MENU)} 
                className={`relative flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === RecognitionMode.MENU ? 'bg-white text-rose-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
              >
                Order Food
                <span className={`absolute -top-2 -right-1 bg-emerald-500 text-[8px] text-white px-2 py-0.5 rounded-md font-black shadow-sm border border-white transition-opacity whitespace-nowrap ${mode === RecognitionMode.MENU ? 'opacity-100' : 'opacity-50'}`}>
                  {isUnlimited ? '∞' : totalCredits} CREDITS LEFT
                </span>
              </button>
              <button 
                onClick={() => onModeChange(RecognitionMode.STREET)} 
                className={`relative flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === RecognitionMode.STREET ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'}`}
              >
                Explore Streets
                <span className="absolute -top-2 -right-1 bg-amber-400 text-[8px] text-slate-900 px-2 py-0.5 rounded-md font-black shadow-sm border border-white whitespace-nowrap">FREE</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5. Camera Button Section */}
        <div className="bg-white border border-slate-100 p-10 md:p-12 text-center flex flex-col items-center shadow-xl mb-6 rounded-[3rem] relative overflow-hidden group">
          <div className={`absolute -top-24 -right-24 w-48 h-48 blur-3xl opacity-10 rounded-full transition-colors ${mode === RecognitionMode.MENU ? 'bg-rose-500' : 'bg-slate-900'}`} />
          
          <div className="relative mb-6">
            <button 
              onClick={onTriggerUpload} 
              className={`w-24 h-24 rounded-[2.2rem] flex items-center justify-center shadow-2xl transition-all group-active:scale-90 relative z-10 animate-pulse-slow ${
                mode === RecognitionMode.MENU ? 'bg-rose-600 shadow-rose-200' : 'bg-slate-900 shadow-slate-200'
              }`}
            >
              <CameraIcon className="w-10 h-10 text-white" />
            </button>
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter leading-none">
            {mode === RecognitionMode.MENU ? "Scan Menu" : "Explore Signs"}
          </h2>
          
          <button 
            onClick={onTriggerUpload} 
            className="w-full bg-slate-900 text-white font-black py-5 rounded-full shadow-xl hover:bg-slate-800 active:scale-[0.97] transition-all uppercase tracking-[0.2em] text-xs relative overflow-hidden"
          >
            Scan or Upload
          </button>

          <div className="mt-5 flex items-center gap-2 opacity-50">
            <div className={`w-1.5 h-1.5 rounded-full ${isUnlimited ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">
              {isUnlimited ? `${getRemainingDays()}d Premium Active` : `Vision AI Connected`}
            </span>
          </div>
        </div>

        {/* 6. Survival Cards (Height Increased by 30%, Text/Icon Enlarged) */}
        <button 
          onClick={onOpenSurvival}
          className="group relative w-full bg-white border border-slate-100 p-8 rounded-[3rem] flex items-center gap-6 shadow-sm active:scale-[0.98] transition-all hover:border-rose-200 mb-10"
        >
          <div className="w-20 h-20 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform duration-300 relative overflow-hidden shrink-0">
              <MapIcon className="absolute w-16 h-16 opacity-10 -rotate-12 -right-2 -bottom-2" />
              <MessageSquareIcon className="w-10 h-10 relative z-10" />
          </div>
          <div className="text-left flex-1">
              <h3 className="text-slate-900 text-xl font-black tracking-tight uppercase">China 100 Essential Cards</h3>
              <p className="text-slate-400 text-xs font-bold leading-tight mt-1.5">Show cards to staff for allergies, help, or directions</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <span className="text-sm font-bold">→</span>
          </div>
        </button>
      </main>

      {/* 7. 核心词云 (过渡带) */}
      <div className="py-12 border-t border-slate-50">
        <WordCloudMarquee onShowDetail={onShowDishDetail} />
      </div>

      {/* 8. Footer Sections */}
      <div className="space-y-20 pb-20">
        <section id="pricing">
          <PricingModule onPurchase={onPurchase} />
        </section>
        
        <AboutUs />
        <Reviews />
        
        <div className="px-4">
           <SupportSection onPurchase={onPurchase} />
        </div>

        <div className="max-w-xs mx-auto flex gap-3 items-start opacity-30 px-6">
          <WarningIcon className="w-4 h-4 shrink-0" />
          <p className="text-[9px] font-bold leading-relaxed text-slate-600 text-center">
            AI results are for reference. Always confirm ingredients with staff if you have severe allergies.
          </p>
        </div>
      </div>

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