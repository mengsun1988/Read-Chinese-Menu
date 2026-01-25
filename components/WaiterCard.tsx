import React from 'react';

interface WaiterCardProps {
  type: 'ingredient' | 'spiciness';
  content_en: string;
  content_cn: string;
  onClose: () => void;
}

export const WaiterCard: React.FC<WaiterCardProps> = ({ type, content_en, content_cn, onClose }) => {
  
  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const options = type === 'ingredient' 
    ? [
        { en: `Does this contain ${content_en}?`, cn: `请问有${content_cn}吗？` },
        { en: `I'm allergic to ${content_en}, please remove it.`, cn: `我对${content_cn}过敏，请不要放。` }
      ]
    : [
        { en: "Is this dish spicy?", cn: "请问这个菜辣吗？" },
        { en: "Can you make it non-spicy / mild?", cn: "可以做成不辣或微辣吗？" }
      ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部标题：醒目的红色背景 */}
        <div className="bg-red-600 p-6 text-center text-white relative">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Communication Card</p>
          <h3 className="text-xl font-bold mt-1">Show to Waiter</h3>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {options.map((opt, i) => (
            <div key={i} className="bg-red-600 rounded-[2rem] p-5 text-white shadow-lg space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-white/60 uppercase">English</p>
                <p className="text-sm font-bold leading-tight">{opt.en}</p>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-white/20 pt-4">
                <p className="text-2xl font-black flex-1 leading-tight">{opt.cn}</p>
                <button 
                  onClick={() => speak(opt.cn)}
                  className="w-12 h-12 bg-white text-red-600 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform flex-shrink-0"
                >
                  <span className="text-xl">🔊</span>
                </button>
              </div>
            </div>
          ))}

          {/* 交互反馈区：服务员回答按钮 */}
          <div className="pt-4 space-y-3">
            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waiter's Response</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => speak("好的")}
                className="bg-emerald-100 text-emerald-700 py-6 rounded-3xl font-black text-xl flex flex-col items-center gap-1 active:bg-emerald-200 transition-colors"
              >
                <span className="text-2xl">YES</span>
                <span className="text-sm">是 / 可以</span>
              </button>
              <button 
                onClick={() => speak("不可以，不好意思")}
                className="bg-rose-100 text-rose-700 py-6 rounded-3xl font-black text-xl flex flex-col items-center gap-1 active:bg-rose-200 transition-colors"
              >
                <span className="text-2xl">NO</span>
                <span className="text-sm">否 / 不行</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-slate-50 text-center">
          <p className="text-[10px] font-bold text-slate-400 italic">Reading Chinese Menu • 2026 Edition</p>
        </div>
      </div>
    </div>
  );
};