import React, { useState, useEffect } from 'react';
import { RecognitionMode, UserUsage } from '../types';
import { CameraIcon, MessageSquareIcon, WarningIcon } from '../components/Icons';
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
  const totalCredits = (usage.freeCredits || 0) + (usage.paidCredits || 0);
  const isUnlimited = usage.passExpiryDate ? new Date(usage.passExpiryDate).getTime() > Date.now() : false;

  // 计算剩余天数
  const getRemainingDays = () => {
    if (!usage.passExpiryDate) return 0;
    const diff = new Date(usage.passExpiryDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="animate-in fade-in duration-700">
      {/* 1. Header 部分 */}
      <header className="mb-16 space-y-6 text-center pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full mb-4">
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
          <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">AI Vision v3.0</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tighter leading-none">
          Read <span className="text-rose-600">Chinese Menu</span>
        </h1>
        <p className="text-slate-400 font-bold text-[10px] md:text-xs tracking-[0.2em] max-w-xl mx-auto uppercase px-4">
          Identify dishes • Check ingredients • Communicate with staff
        </p>
      </header>

      <main className="max-w-xl mx-auto px-2">
        {/* 2. Share Bonus 模块 */}
        <div className="mb-10">
          <button 
            onClick={onHandleDailyShare} 
            className="w-full bg-emerald-50/50 border border-emerald-100 p-6 rounded-[2.5rem] flex items-center justify-between group hover:bg-emerald-50 transition-all active:scale-95 shadow-sm"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">🎁</div>
              <div>
                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Share Bonus</p>
                <p className="text-sm font-bold text-slate-900">+5 Free Credits Daily</p>
              </div>
            </div>
            <span className="bg-emerald-600 text-white px-4 py-2 rounded-full text-[9px] font-black">CLAIM</span>
          </button>
        </div>

        {/* 3. Mode Switcher & Survival Card 入口 */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex justify-center">
            <div className="bg-slate-100/50 p-1.5 rounded-2xl flex gap-1 border border-slate-200/50 w-full max-w-sm">
              <button 
                onClick={() => onModeChange(RecognitionMode.MENU)} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === RecognitionMode.MENU ? 'bg-white text-rose-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
              >
                Menu Mode
              </button>
              <button 
                onClick={() => onModeChange(RecognitionMode.STREET)} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === RecognitionMode.STREET ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'}`}
              >
                Street Mode
              </button>
            </div>
          </div>

          {/* 求生卡首页快捷入口 - 深度优化 UI */}
          <button 
            onClick={onOpenSurvival}
            className="group relative w-full bg-white border border-slate-100 p-6 rounded-[2.5rem] flex items-center gap-5 shadow-sm active:scale-[0.98] transition-all hover:border-rose-200"
          >
            <div className="w-14 h-14 bg-rose-50 rounded-[1.25rem] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
               <MessageSquareIcon className="w-7 h-7 text-rose-600" />
            </div>
            <div className="text-left flex-1">
               <h3 className="text-slate-900 text-base font-black tracking-tight">Survival Cards</h3>
               <p className="text-slate-400 text-[11px] font-bold">Show phrases to staff for allergies & help</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-rose-600 group-hover:text-white transition-colors">
               <span className="text-xs">→</span>
            </div>
          </button>
        </div>

        {/* 4. Main Scan Button */}
        <div className="bg-white border border-slate-100 p-12 md:p-16 text-center flex flex-col items-center shadow-xl mb-12 rounded-[3.5rem] relative overflow-hidden group">
          {/* 背景装饰 */}
          <div className={`absolute -top-24 -right-24 w-48 h-48 blur-3xl opacity-10 rounded-full transition-colors ${mode === RecognitionMode.MENU ? 'bg-rose-500' : 'bg-slate-900'}`} />
          
          <button 
            onClick={onTriggerUpload} 
            className={`w-24 h-24 rounded-[2.2rem] flex items-center justify-center mb-8 shadow-2xl transition-all group-active:scale-90 relative z-10 ${mode === RecognitionMode.MENU ? 'bg-rose-600 shadow-rose-200' : 'bg-slate-900 shadow-slate-200'}`}
          >
            <CameraIcon className="w-10 h-10 text-white" />
          </button>
          
          <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter">
            {mode === RecognitionMode.MENU ? "Scan a Menu" : "Identify Storefront"}
          </h2>
          
          <button 
            onClick={onTriggerUpload} 
            className="w-full bg-slate-900 text-white font-black py-5 rounded-full shadow-xl hover:bg-slate-800 transition-colors uppercase tracking-[0.2em] text-xs"
          >
            START SCAN
          </button>

          {/* Credits 展示 */}
          <div className="mt-6 flex items-center gap-2 opacity-50">
            <div className={`w-1.5 h-1.5 rounded-full ${isUnlimited ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">
              {isUnlimited ? `${getRemainingDays()}d Premium Active` : `${totalCredits} Credits Remaining`}
            </span>
          </div>
        </div>
      </main>

      {/* 5. 词云组件 */}
      <div className="py-10">
        <WordCloudMarquee onShowDetail={onShowDishDetail} />
      </div>

      {/* 6. 原版功能模块区 - 根据 App.tsx 要求回归 */}
      <div className="space-y-32 mt-20 pb-32">
        <section id="pricing">
          <PricingModule onPurchase={onPurchase} />
        </section>
        
        <AboutUs />
        
        <Reviews />
        
        <SupportSection onPurchase={onPurchase} />

        {/* 免责声明声明 */}
        <div className="max-w-sm mx-auto flex gap-3 items-start opacity-30 px-6">
          <WarningIcon className="w-4 h-4 shrink-0" />
          <p className="text-[9px] font-bold leading-relaxed text-slate-600 text-center">
            AI results are for reference only. Always confirm ingredients with staff if you have severe allergies. Data accuracy depends on image quality.
          </p>
        </div>
      </div>
    </div>
  );
};