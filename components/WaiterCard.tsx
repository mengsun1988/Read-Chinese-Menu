import React, { useEffect, useCallback } from 'react';

interface WaiterCardProps {
  type: 'ingredient' | 'spiciness';
  content_en: string;
  content_cn: string;
  onClose: () => void;
}

export const WaiterCard: React.FC<WaiterCardProps> = ({ type, content_en, content_cn, onClose }) => {
  
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;

    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find(v => 
      (v.lang.includes('zh-CN') || v.lang.includes('zh_CN')) && !v.name.includes('Google')
    ) || voices.find(v => v.lang.includes('zh'));
    if (chineseVoice) utterance.voice = chineseVoice;
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    if (window.speechSynthesis) window.speechSynthesis.getVoices();
  }, []);

  const options = type === 'ingredient' 
    ? [
        { en: `Contain ${content_en}?`, cn: `请问有${content_cn}吗？` },
        { en: `No ${content_en}, allergic.`, cn: `不要放${content_cn}，过敏。` }
      ]
    : [
        { en: "Is it spicy?", cn: "请问这个菜辣吗？" },
        { en: "Non-spicy / Mild?", cn: "可以做不辣或微辣吗？" }
      ];

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity" 
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-[320px] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: 极简紧凑 */}
        <div className="bg-red-600 px-5 py-3 text-center text-white relative">
          <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Communication</p>
          <h3 className="text-base font-black">Show to Waiter</h3>
          <button 
            onClick={onClose} 
            className="absolute top-2 right-3 text-white/60 p-2 active:scale-75 transition-all text-sm"
          >
            ✕
          </button>
        </div>

        {/* 内容区：减少间距 */}
        <div className="p-4 space-y-3">
          {options.map((opt, i) => (
            <div key={i} className="bg-red-600 rounded-[1.5rem] p-3 text-white shadow-md active:bg-red-700 transition-colors">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                   <p className="text-[10px] font-bold text-white/60 leading-none">ENG: {opt.en}</p>
                   <button 
                    onClick={() => speak(opt.cn)}
                    className="w-8 h-8 bg-white text-red-600 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform flex-shrink-0"
                  >
                    <span className="text-sm">🔊</span>
                  </button>
                </div>
                <p className="text-xl font-black leading-tight py-1">{opt.cn}</p>
              </div>
            </div>
          ))}

          {/* 快捷回复区：更扁平的按钮 */}
          <div className="pt-1 space-y-2">
            <div className="flex items-center gap-2 opacity-30">
              <div className="h-[1px] bg-slate-300 flex-1"></div>
              <p className="text-[8px] font-black uppercase">Response</p>
              <div className="h-[1px] bg-slate-300 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => speak("好的，没问题")}
                className="bg-emerald-50 text-emerald-600 py-3 rounded-2xl font-black flex flex-col items-center active:bg-emerald-100 active:scale-95 transition-all border border-emerald-100"
              >
                <span className="text-lg">YES</span>
                <span className="text-[8px] opacity-70">可以 / 好的</span>
              </button>
              <button 
                onClick={() => speak("不好意思，不可以")}
                className="bg-rose-50 text-rose-600 py-3 rounded-2xl font-black flex flex-col items-center active:bg-rose-100 active:scale-95 transition-all border border-rose-100"
              >
                <span className="text-lg">NO</span>
                <span className="text-[8px] opacity-70">不行 / 不可以</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* 底部备注：极小化 */}
        <div className="py-2 bg-slate-50 text-center">
          <p className="text-[8px] font-bold text-slate-300 tracking-tighter uppercase">
            Offline Voice • 2026 Edition
          </p>
        </div>
      </div>
    </div>
  );
};