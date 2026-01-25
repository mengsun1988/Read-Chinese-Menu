import React, { useEffect, useCallback } from 'react';

interface WaiterCardProps {
  type: 'ingredient' | 'spiciness';
  content_en: string;
  content_cn: string;
  onClose: () => void;
}

export const WaiterCard: React.FC<WaiterCardProps> = ({ type, content_en, content_cn, onClose }) => {
  
  // 核心语音函数：优先调用系统内置的高质量语音
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    // 取消当前正在播放的语音
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85; // 稍微慢一点，让服务员听得更清楚
    utterance.pitch = 1.0;

    // 尝试寻找系统内置的高质量中文语音（离线可用）
    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find(v => 
      (v.lang.includes('zh-CN') || v.lang.includes('zh_CN')) && !v.name.includes('Google')
    ) || voices.find(v => v.lang.includes('zh'));

    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, []);

  // 针对某些移动端浏览器需要预加载语音列表
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const options = type === 'ingredient' 
    ? [
        { en: `Does this contain ${content_en}?`, cn: `请问这个有${content_cn}吗？` },
        { en: `I'm allergic to ${content_en}, please remove it.`, cn: `我对${content_cn}过敏，请不要放。` }
      ]
    : [
        { en: "Is this dish spicy?", cn: "请问这个菜辣吗？" },
        { en: "Can you make it non-spicy / mild?", cn: "可以做成不辣或微辣吗？" }
      ];

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity" 
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-sm max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部标题：更紧凑的 Header */}
        <div className="bg-red-600 p-5 text-center text-white relative flex-shrink-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Communication Card</p>
          <h3 className="text-lg font-bold">Show to Waiter</h3>
          <button 
            onClick={onClose} 
            className="absolute top-4 right-5 text-white/60 hover:text-white text-xl p-2 active:scale-90 transition-transform"
          >
            ✕
          </button>
        </div>

        {/* 中间滚动区 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {options.map((opt, i) => (
            <div key={i} className="bg-red-600 rounded-[2rem] p-5 text-white shadow-lg space-y-3 active:bg-red-700 transition-colors">
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold text-white/50 uppercase tracking-tighter">English Query</p>
                <p className="text-sm font-bold leading-tight">{opt.en}</p>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                <p className="text-2xl font-black flex-1 leading-tight tracking-tight">{opt.cn}</p>
                <button 
                  onClick={() => speak(opt.cn)}
                  className="w-11 h-11 bg-white text-red-600 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform flex-shrink-0"
                >
                  <span className="text-xl">🔊</span>
                </button>
              </div>
            </div>
          ))}

          {/* 交互反馈区：服务员回答按钮 */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-[1px] bg-slate-100 flex-1"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waiter's Response</p>
              <div className="h-[1px] bg-slate-100 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => speak("好的，没问题")}
                className="bg-emerald-50 text-emerald-600 py-4 rounded-[1.8rem] font-black flex flex-col items-center gap-0.5 active:bg-emerald-100 active:scale-95 transition-all border border-emerald-100"
              >
                <span className="text-xl">YES</span>
                <span className="text-[10px] font-bold">可以 / 好的</span>
              </button>
              <button 
                onClick={() => speak("不好意思，不可以")}
                className="bg-rose-50 text-rose-600 py-4 rounded-[1.8rem] font-black flex flex-col items-center gap-0.5 active:bg-rose-100 active:scale-95 transition-all border border-rose-100"
              >
                <span className="text-xl">NO</span>
                <span className="text-[10px] font-bold">不可以 / 不行</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* 底部备注 */}
        <div className="p-3 bg-slate-50 text-center flex-shrink-0">
          <p className="text-[9px] font-bold text-slate-400 tracking-tighter uppercase opacity-60">
            Offline Voice Enabled • Read Chinese Menu 2026
          </p>
        </div>
      </div>
    </div>
  );
};