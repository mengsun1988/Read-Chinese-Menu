import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface WaiterCardProps {
  type: 'ingredient' | 'spiciness';
  content_en: string;
  content_cn: string; 
  onClose: () => void;
}

export const WaiterCard: React.FC<WaiterCardProps> = ({ type, content_en, content_cn, onClose }) => {
  const { t } = useTranslation();
  
  const displayContent = type === 'ingredient' 
    ? t(`ingredients.${content_en}`, { 
        defaultValue: content_en.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
      })
    : content_en;

  // 【核心防御】如果由于某种原因 content_cn 为空或异常文字
  // 强制回退到 content_en 的处理结果，确保不会出现“请问有吗”
  const safeContentCn = (content_cn && content_cn !== "这个食材") 
    ? content_cn 
    : content_en.replace(/_/g, ' ');

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
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const options = type === 'ingredient' 
    ? [
        { 
          en: t('waiterCard.containIngredient', { ingredient: displayContent }), 
          cn: `请问这道菜里有${safeContentCn}吗？` 
        },
        { 
          en: t('waiterCard.noIngredient', { ingredient: displayContent }), 
          cn: `不要放${safeContentCn}，谢谢。` 
        }
      ]
    : [
        { 
          en: t('waiterCard.isSpicy'), 
          cn: "请问这个菜辣吗？" 
        },
        { 
          en: t('waiterCard.nonSpicy'), 
          cn: "可以做不辣或微辣吗？" 
        }
      ];

  return createPortal(
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className="bg-[#fcfbf9] w-full max-w-[320px] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-red-600 px-6 py-5 text-center text-white relative">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mb-0.5">
            {t('common.communication')}
          </p>
          <h3 className="text-lg font-black tracking-tight uppercase">
            {t('common.showToWaiter')}
          </h3>
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/60 hover:text-white p-2 active:scale-75 transition-all"
          >
            <span className="text-xl font-light text-white">✕</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {options.map((opt, i) => (
            <div key={i} className="bg-red-600 rounded-[2rem] p-5 text-white shadow-lg active:brightness-90 transition-all border border-white/10">
              <div className="flex flex-col">
                <div className="flex items-start justify-between mb-3 border-b border-white/20 pb-3">
                  <p className="text-sm font-black text-white leading-tight uppercase tracking-tight flex-1 pr-3">
                    {opt.en}
                  </p>
                  <button 
                    onClick={() => speak(opt.cn)}
                    className="w-11 h-11 bg-white text-red-600 rounded-xl flex items-center justify-center shadow-xl active:scale-90 transition-transform flex-shrink-0"
                  >
                    <span className="text-xl">🔊</span>
                  </button>
                </div>
                
                <p className="text-[1.4rem] font-black leading-snug tracking-tight py-1">
                  {opt.cn}
                </p>
              </div>
            </div>
          ))}

          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-3 opacity-20">
              <div className="h-[1px] bg-slate-900 flex-1"></div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-900">
                {t('waiterCard.showScreenWaiter')?.split('・')[1] || "Waiter's Response"}
              </p>
              <div className="h-[1px] bg-slate-900 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => speak("好的，没问题")}
                className="bg-emerald-50 text-emerald-600 py-4 rounded-2xl font-black flex flex-col items-center active:bg-emerald-100 active:scale-95 transition-all border border-emerald-100"
              >
                <span className="text-xl leading-none mb-1">{t('common.yes').toUpperCase()}</span>
                <span className="text-[10px] font-bold opacity-60">是的 / 可以</span>
              </button>
              <button 
                onClick={() => speak("不好意思，不可以")}
                className="bg-rose-50 text-rose-600 py-4 rounded-2xl font-black flex flex-col items-center active:bg-rose-100 active:scale-95 transition-all border border-rose-100"
              >
                <span className="text-xl leading-none mb-1">{t('common.no').toUpperCase()}</span>
                <span className="text-[10px] font-bold opacity-60">没有 / 不可以</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="py-4 bg-slate-50 text-center border-t border-slate-100">
          <p className="text-[9px] font-black text-slate-300 tracking-[0.2em] uppercase">
            {t('common.communicationTool')}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};