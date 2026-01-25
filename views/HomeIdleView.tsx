import React, { useState, useEffect } from 'react';
import { RecognitionMode } from '../types';
import { CameraIcon } from '../components/Icons';
import { WordCloudMarquee } from '../components/WordCloudMarquee';

interface Props {
  mode: RecognitionMode;
  onModeChange: (m: RecognitionMode) => void;
  onUpload: () => void;
  onShare: () => void;
  onDishClick: (dish: any) => void;
}

export const HomeIdleView: React.FC<Props> = ({ 
  mode, 
  onModeChange, 
  onUpload, 
  onShare, 
  onDishClick 
}) => {
  const [scrolled, setScrolled] = useState(false);

  // 1. 监听滚动逻辑：控制顶部 Header 显示
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="animate-in fade-in duration-500 pt-6">
      
      {/* 1. 顶部红色 Sticky Header */}
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

      {/* 2. Logo & 品牌 Slogan 升级区 */}
      <div className="text-center mb-10 px-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">
          Read Chinese Menu
        </h1>
        <div className="space-y-2">
          <p className="text-slate-500 font-medium italic">Your Pocket Jiangnan Companion</p>
          {/* 信任标签 */}
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] flex flex-wrap justify-center gap-x-3 gap-y-1">
            <span>No Ads</span>
            <span className="opacity-30">•</span>
            <span>No Download</span>
            <span className="opacity-30">•</span>
            <span>Built with Heart</span>
            <span className="opacity-30">•</span>
            <span>中国旅行伴侣</span>
          </p>
        </div>
      </div>

      {/* 5. Share Bonus Section - 增加社交媒体说明 */}
      <div className="max-w-xl mx-auto mb-10 px-4">
        <button 
          onClick={onShare} 
          className="w-full bg-emerald-50/50 border border-emerald-100 p-6 rounded-[2.5rem] flex items-center justify-between group hover:bg-emerald-50 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:rotate-12 transition-transform">🎁</div>
            <div>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Social Share Bonus</p>
              <p className="text-sm font-bold text-slate-900">Share to Friends or Social Media</p>
              <p className="text-[10px] text-emerald-600/70">+5 Free Credits Every Day</p>
            </div>
          </div>
          <span className="bg-emerald-600 text-white px-5 py-2.5 rounded-full text-[10px] font-black tracking-widest shadow-lg shadow-emerald-100">SHARE</span>
        </button>
      </div>

      {/* 4 & 5. Mode Switcher - 文案趣味化与 FREE 标签 */}
      <div className="flex justify-center mb-10">
        <div className="bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-[1.5rem] flex gap-1 border border-slate-200/50 relative">
          <button 
            onClick={() => onModeChange(RecognitionMode.MENU)} 
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === RecognitionMode.MENU 
                ? 'bg-white text-rose-600 shadow-md scale-105' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            🍴 Feed Me!
          </button>
          
          <div className="relative">
            <button 
              onClick={() => onModeChange(RecognitionMode.STREET)} 
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                mode === RecognitionMode.STREET 
                  ? 'bg-slate-900 text-white shadow-md scale-105' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              📍 Where am I?
            </button>
            {/* Free 标签 */}
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-slate-900 text-[8px] px-1.5 py-0.5 rounded-md font-black border-2 border-white shadow-sm animate-pulse">
              FREE
            </span>
          </div>
        </div>
      </div>

      {/* 3. Upload Area - 增加相机动效 */}
      <div className="bg-white border border-slate-100 p-12 md:p-20 text-center flex flex-col items-center shadow-xl mb-12 rounded-[3.5rem] relative overflow-hidden group">
        {/* 背景光晕装饰 */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 transition-colors ${mode === RecognitionMode.MENU ? 'bg-rose-400' : 'bg-slate-400'}`}></div>

        <div className="relative mb-10">
          <button 
            onClick={onUpload} 
            className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-all active:scale-90 hover:rotate-3 relative z-10 animate-bounce-slow
              ${mode === RecognitionMode.MENU ? 'bg-rose-600 shadow-rose-200' : 'bg-slate-900 shadow-slate-200'}`}
          >
            <CameraIcon className="w-14 h-14 text-white" />
          </button>
          
          {/* “添加到桌面”样式的诱导气泡 */}
          <div className="absolute -top-4 -right-16 bg-slate-900 text-white text-[9px] font-black py-1.5 px-3 rounded-xl animate-float shadow-xl whitespace-nowrap">
            TAP TO SCAN ✨
            <div className="absolute -bottom-1 left-2 w-2 h-2 bg-slate-900 rotate-45"></div>
          </div>
        </div>

        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
          {mode === RecognitionMode.MENU ? "Scan a Menu" : "Identify Store"}
        </h2>
        <p className="text-slate-400 text-xs font-medium mb-8">
          {mode === RecognitionMode.MENU 
            ? "Analyze dishes & ingredients instantly" 
            : "Free shop identification & info"}
        </p>

        <button 
          onClick={onUpload} 
          className={`w-full max-w-xs font-black py-5 rounded-full shadow-2xl transition-all active:scale-95 uppercase tracking-widest text-xs
            ${mode === RecognitionMode.MENU 
              ? 'bg-rose-600 text-white hover:bg-rose-700' 
              : 'bg-slate-900 text-white hover:bg-slate-800'}`}
        >
          START SCANNING
        </button>
      </div>

      {/* 词云组件 */}
      <div className="pb-10">
        <WordCloudMarquee onShowDetail={onDishClick} />
      </div>

      {/* 自定义动画样式 */}
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