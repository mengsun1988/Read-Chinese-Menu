import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

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

    // 优化的发音人查找逻辑
    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find(v => 
      (v.lang.includes('zh-CN') || v.lang.includes('zh_CN')) && !v.name.includes('Google')
    ) || voices.find(v => v.lang.includes('zh'));
    
    if (chineseVoice) utterance.voice = chineseVoice;
    window.speechSynthesis.speak(utterance);
  }, []);

  // 确保在移动端浏览器准备好语音引擎
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = window.speechSynthesis.getVoices;
      }
    }
  }, []);

  const options = type === 'ingredient' 
    ? [
        { en: `Contain ${content_en}?`, cn: `请问有${content_cn}吗？` },
        { en: `No ${content_en}, please.`, cn: `不要放${content_cn}，谢谢。` }
      ]
    : [
        { en: "Is it spicy?", cn: "请问这个菜辣吗？" },
        { en: "Non-spicy / Mild?", cn: "可以做不辣或微辣吗？" }
      ];

  return createPortal(
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-[320px] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: 红色警示色调 */}
        <div className="bg-red-600 px-6 py-4 text-center text-white relative">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mb-0.5">Communication</p>
          <h3 className="text-lg font-black tracking-tight uppercase">Show to Waiter</h3>
          <button 
            onClick={onClose} 
            className="absolute top-3 right-4 text-white/60 hover:text-white p-2 active:scale-75 transition-all"
          >
            <span className="text-xl font-light">✕</span>
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-5 space-y-4">
          {options.map((opt, i) => (
            <div key={i} className="bg-red-600 rounded-[2rem] p-5 text-white shadow-lg active:bg-red-700 transition-colors border border-white/10">
              <div className="flex flex-col">
                {/* 英文提示：放大且置顶 */}
                <div className="flex items-start justify-between mb-3 border-b border-white/20 pb-2">
                  <p className="text-base font-black text-white leading-tight uppercase tracking-tight flex-1 pr-3">
                    {opt.en}
                  </p>
                  <button 
                    onClick={() => speak(opt.cn)}
                    className="w-11 h-11 bg-white text-red-600 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform flex-shrink-0"
                  >
                    <span className="text-xl">🔊</span>
                  </button>
                </div>
                
                {/* 中文核心内容：保持醒目大尺寸供服务员阅读 */}
                <p className="text-[1.35rem] font-black leading-snug tracking-tight py-1">
                  {opt.cn}
                </p>
              </div>
            </div>
          ))}

          {/* 快捷回复区 */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-3 opacity-20">
              <div className="h-[1px] bg-slate-900 flex-1"></div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-900">Waiter's Response</p>
              <div className="h-[1px] bg-slate-900 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => speak("好的，没问题")}
                className="bg-emerald-50 text-emerald-600 py-4 rounded-2xl font-black flex flex-col items-center active:bg-emerald-100 active:scale-95 transition-all border border-emerald-100"
              >
                <span className="text-xl leading-none mb-1">YES</span>
                <span className="text-[10px] font-bold opacity-60">可以 / 好的</span>
              </button>
              <button 
                onClick={() => speak("不好意思，不可以")}
                className="bg-rose-50 text-rose-600 py-4 rounded-2xl font-black flex flex-col items-center active:bg-rose-100 active:scale-95 transition-all border border-rose-100"
              >
                <span className="text-xl leading-none mb-1">NO</span>
                <span className="text-[10px] font-bold opacity-60">不行 / 不可以</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* 底部脚注 */}
        <div className="py-3 bg-slate-50 text-center border-t border-slate-100">
          <p className="text-[9px] font-black text-slate-300 tracking-[0.2em] uppercase">
            Communication Tool for Travelers
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};