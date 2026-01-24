import React, { useState } from 'react';
import { SpeakerIcon } from './Icons';

interface WaiterCardProps {
  type: 'ingredient' | 'spiciness';
  content_en: string;
  content_cn: string;
  onClose: () => void;
}

export const WaiterCard: React.FC<WaiterCardProps> = ({ type, content_en, content_cn, onClose }) => {
  // 状态：'ask' (询问是否有) | 'request' (请求不放)
  const [step, setStep] = useState<'ask' | 'request'>('ask');

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      {/* 点击背景关闭 */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="bg-[#fcfbf9] w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        {/* 顶部状态条 */}
        <div className={`h-2 w-full transition-all duration-500 ${step === 'ask' ? 'bg-rose-500' : 'bg-rose-600'}`}></div>
        
        {/* 顶部关闭按钮 */}
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full text-slate-400 z-10 hover:bg-slate-200 transition-colors">✕</button>

        {step === 'ask' ? (
          /* --- 第一步：询问是否有该食材 --- */
          <div className="p-8 md:p-12 text-center space-y-8">
            <header className="space-y-2">
              <p className="text-rose-500 font-bold uppercase tracking-[0.2em] text-[10px]">Step 1: Ask Staff</p>
              <h2 className="text-slate-400 text-lg italic font-medium">"Does this have {content_en}?"</h2>
            </header>

            <div className="py-4 space-y-6">
              <h3 className="chinese-font text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
                这里面有<br/>
                <span className="text-rose-600 underline decoration-yellow-400 underline-offset-8 decoration-4">{content_cn}</span>
                吗？
              </h3>
              <button 
                onClick={() => speak(`这里面有${content_cn}吗？`)}
                className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600 active:scale-90 transition-transform shadow-sm"
              >
                <SpeakerIcon className="w-8 h-8" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button 
                onClick={() => {
                  setStep('request');
                  speak("可以不放吗？");
                }}
                className="bg-rose-600 text-white py-6 rounded-2xl shadow-lg shadow-rose-100 flex flex-col items-center gap-1 active:scale-95 transition-all"
              >
                <span className="text-2xl font-bold">有 / 是</span>
                <span className="text-[10px] font-bold uppercase opacity-70 italic">YES / Contain</span>
              </button>
              
              <button 
                onClick={onClose}
                className="bg-slate-200 text-slate-600 py-6 rounded-2xl flex flex-col items-center gap-1 active:scale-95 transition-all"
              >
                <span className="text-2xl font-bold">没有</span>
                <span className="text-[10px] font-bold uppercase opacity-70 italic">NO / None</span>
              </button>
            </div>
          </div>
        ) : (
          /* --- 第二步：请求不放 --- */
          <div className="p-8 md:p-12 text-center space-y-8 animate-in slide-in-from-right duration-300">
            <header className="space-y-2">
              <p className="text-rose-500 font-bold uppercase tracking-[0.2em] text-[10px]">Step 2: Request Change</p>
              <h2 className="text-slate-400 text-lg italic font-medium">"Can you leave it out?"</h2>
            </header>

            <div className="py-4 space-y-6">
              <h3 className="chinese-font text-6xl md:text-7xl font-bold text-slate-900 leading-tight">
                可以不放吗？
              </h3>
              <button 
                onClick={() => speak("可以不放吗？")}
                className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600 active:scale-90 transition-transform shadow-sm"
              >
                <SpeakerIcon className="w-8 h-8" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button 
                onClick={onClose}
                className="bg-emerald-500 text-white py-6 rounded-2xl shadow-lg shadow-emerald-100 flex flex-col items-center gap-1 active:scale-95 transition-transform"
              >
                <span className="text-2xl font-bold">可以</span>
                <span className="text-[10px] font-bold uppercase opacity-80 italic">YES / OK</span>
              </button>
              <button 
                onClick={onClose}
                className="bg-slate-800 text-white py-6 rounded-2xl shadow-lg shadow-slate-200 flex flex-col items-center gap-1 active:scale-95 transition-transform"
              >
                <span className="text-2xl font-bold">不可以</span>
                <span className="text-[10px] font-bold uppercase opacity-80 italic">NO / Cannot</span>
              </button>
            </div>

            <button 
              onClick={() => setStep('ask')}
              className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] pt-4 hover:text-rose-500 transition-colors"
            >
              ← Back to first question
            </button>
          </div>
        )}
      </div>
    </div>
  );
};