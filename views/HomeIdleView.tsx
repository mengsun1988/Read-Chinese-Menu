import React, { useState, useEffect } from 'react';
import { RecognitionMode } from '../types';
import { CameraIcon, MessageSquareIcon, ChevronRightIcon } from '../components/Icons';
import { WordCloudMarquee } from '../components/WordCloudMarquee';

interface Props {
  mode: RecognitionMode;
  onModeChange: (m: RecognitionMode) => void;
  onUpload: () => void;
  onShare: () => void;
  onDishClick: (dish: any) => void;
  onOpenSurvivalCards: () => void; // 新增：打开求生卡的回调
}

export const HomeIdleView: React.FC<Props> = ({ 
  mode, 
  onModeChange, 
  onUpload, 
  onShare, 
  onDishClick,
  onOpenSurvivalCards
}) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="animate-in fade-in duration-500 pt-6">
      
      {/* 1. 顶部 Sticky Header */}
      <div 
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 flex items-center justify-center ${
          scrolled 
            ? 'h-14 bg-red-600 shadow-lg translate-y-0 opacity-100' 
            : 'h-14 bg-transparent -translate-y-full opacity-0'
        }`}
      >
        <span className="text-white font-black text-sm tracking-widest uppercase">
          Read Chinese Menu
        </span>
      </div>

      {/* 2. Logo & 品牌区 */}
      <div className="text-center mb-10 px-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">
          Read Chinese Menu
        </h1>
        <div className="space-y-2">
          <p className="text-slate-500 font-medium italic">Your Pocket Jiangnan Companion</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] flex flex-wrap justify-center gap-x-3 gap-y-1">
            <span>No Ads</span>
            <span className="opacity-30">•</span>
            <span>No Download</span>
            <span className="opacity-30">•</span>
            <span>中国旅行伴侣</span>
          </p>
        </div>
      </div>

      {/* 3. 主上传扫描区 */}
      <div className="bg-white border border-slate-100 p-10 md:p-16 text-center flex flex-col items-center shadow-xl mb-6 rounded-[3.5rem] relative overflow-hidden mx-4">
        <div className="relative mb-8">
          <button 
            onClick={onUpload} 
            className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-all active:scale-90 relative z-10 animate-bounce-slow
              ${mode === RecognitionMode.MENU ? 'bg-rose-600 shadow-rose-200' : 'bg-slate-900 shadow-slate-200'}`}
          >
            <CameraIcon className="w-12 h-12 text-white" />
          </button>
          <div className="absolute -top-4 -right-12 bg-slate-900 text-white text-[9px] font-black py-1.5 px-3 rounded-xl animate-float shadow-xl whitespace-nowrap">
            TAP TO SCAN ✨
          </div>
        </div>

        {/* 模式切换 */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-100/80 backdrop-blur-sm p-1 rounded-full flex gap-1 border border-slate-200/50">
            <button 
              onClick={() => onModeChange(RecognitionMode.MENU)} 
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                mode === RecognitionMode.MENU ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'
              }`}
            >
              🍴 Menu
            </button>
            <div className="relative">
              <button 
                onClick={() => onModeChange(RecognitionMode.STREET)} 
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  mode === RecognitionMode.STREET ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'
                }`}
              >
                📍 Street
              </button>
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-slate-900 text-[7px] px-1.5 py-0.5 rounded-md font-black animate-pulse">FREE</span>
            </div>
          </div>
        </div>

        <button 
          onClick={onUpload} 
          className={`w-full max-w-xs font-black py-5 rounded-full shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs
            ${mode === RecognitionMode.MENU ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}
        >
          {mode === RecognitionMode.MENU ? "Analyze Menu" : "Identify Store"}
        </button>
      </div>

      {/* 4. 求生卡入口 (Survival Cards Entry) - 单独板块 */}
      <div className="px-4 mb-6">
        <button 
          onClick={onOpenSurvivalCards}
          className="w-full bg-slate-900 p-5 rounded-[2.2rem] flex items-center justify-between group hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white group-hover:bg-rose-600 transition-colors">
              <MessageSquareIcon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Travel Survival</p>
              <p className="text-sm font-bold text-white leading-tight">Emergency Communication Cards</p>
              <p className="text-[9px] text-slate-400 font-medium">No Cilantro, Where's Toilet, etc. • Free & Offline</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:translate-x-1 transition-all">
            <ChevronRightIcon className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* 5. 分享板块 (Social Share) */}
      <div className="px-4 mb-10">
        <button 
          onClick={onShare} 
          className="w-full bg-emerald-50/50 border border-emerald-100 p-5 rounded-[2.2rem] flex items-center justify-between group hover:bg-emerald-50 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm">🎁</div>
            <div className="text-left">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Social Bonus</p>
              <p className="text-sm font-bold text-slate-900 leading-tight">Share to get +5 Free Scans</p>
            </div>
          </div>
          <span className="bg-emerald-600 text-white px-4 py-2 rounded-full text-[9px] font-black tracking-widest shadow-md">SHARE</span>
        </button>
      </div>

      {/* 6. 词云展示区 */}
      <div className="pb-10">
        <div className="px-6 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-rose-600 rounded-full animate-pulse"></div>
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Popular Dishes</h3>
          </div>
        </div>
        <WordCloudMarquee onShowDetail={onDishClick} />
      </div>

      {/* 关键动画样式 */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.03); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};