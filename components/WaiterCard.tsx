import React, { useEffect } from 'react';

interface WaiterCardProps {
  type: 'ingredient' | 'spiciness';
  content_en: string;
  content_cn: string;
  onClose: () => void;
}

export const WaiterCard: React.FC<WaiterCardProps> = ({ type, content_en, content_cn, onClose }) => {
  
  // 语音功能修复：确保在现代浏览器和移动端生效
  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    
    // 1. 取消正在排队的语音
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85; // 稍微放慢语速，方便服务员听清
    utterance.pitch = 1;
    
    // 某些移动端浏览器需要重新激活上下文
    window.speechSynthesis.speak(utterance);
  };

  // 业务逻辑修复：区分食材询问与辣度询问
  const options = type === 'ingredient' 
    ? [
        { 
          en: `Does this contain ${content_en}?`, 
          cn: `请问这个菜里有${content_cn}吗？`,
          label: "Inquiry"
        },
        { 
          en: `I'm allergic to ${content_en}, please remove it.`, 
          cn: `我对${content_cn}过敏，请不要放。`,
          label: "Allergy Alert"
        }
      ]
    : [
        { 
          en: "Is this dish spicy?", 
          cn: "请问这个菜辣吗？",
          label: "Heat Level"
        },
        { 
          en: "Can you make it non-spicy / mild?", 
          cn: "可以做成不辣或者微辣吗？",
          label: "Customization"
        }
      ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">
              Waiter Communication
            </h3>
            <button onClick={onClose} className="text-slate-400 p-2">✕</button>
          </div>

          <div className="space-y-4">
            {options.map((opt, i) => (
              <div key={i} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter">{opt.label}</span>
                </div>
                <p className="text-sm font-semibold text-slate-700 leading-tight">{opt.en}</p>
                
                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className="text-xl font-bold text-slate-900 leading-tight flex-1">{opt.cn}</p>
                  <button 
                    onClick={() => speak(opt.cn)}
                    className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform flex-shrink-0"
                  >
                    <span className="text-lg">🔊</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-center text-slate-400 font-medium pb-2">
            Tap the speaker to play audio for the staff
          </p>
        </div>
      </div>
    </div>
  );
};