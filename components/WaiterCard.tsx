import React from 'react';
import { SpeakerIcon } from './Icons';

interface WaiterCardProps {
  type: 'ingredient' | 'spiciness';
  content_en: string;
  content_cn: string;
  onClose: () => void;
}

export const WaiterCard: React.FC<WaiterCardProps> = ({ type, content_en, content_cn, onClose }) => {
  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <button onClick={onClose} className="absolute top-8 right-8 text-white/40 text-2xl font-bold">✕ Close</button>
      
      <div className="max-w-xl w-full space-y-12">
        <header className="space-y-4">
          <p className="text-rose-500 font-bold uppercase tracking-[0.2em] text-xs">Show this to the staff</p>
          <h2 className="text-white text-2xl font-medium opacity-60 italic">"Does this have {content_en}?"</h2>
        </header>

        <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl space-y-8">
          <h3 className="chinese-font text-7xl md:text-8xl font-bold text-slate-900 leading-tight">
            这里面有<br/>
            <span className="text-rose-600 underline decoration-yellow-400 underline-offset-8 decoration-4">{content_cn}</span>
            吗？
          </h3>
          <button onClick={() => speak(`这里面有${content_cn}吗？`)} className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600 active:scale-90 transition-transform shadow-sm">
            <SpeakerIcon className="w-10 h-10" />
          </button>
        </div>

        {/* --- 互动逻辑：如果服务员说“有”，出示下一步 --- */}
        {type === 'ingredient' && (
          <div className="pt-8 border-t border-white/10 space-y-6 animate-in slide-in-from-bottom duration-500 delay-300">
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest italic">If they say YES, show this next:</p>
            <div className="bg-rose-600 rounded-[2.5rem] p-8 shadow-xl text-white relative group">
              <h4 className="chinese-font text-5xl font-bold mb-4">可以不放吗？</h4>
              <p className="text-rose-200 text-sm italic mb-6">"Can you cook it without it?"</p>
              <button onClick={() => speak("可以不放吗？")} className="bg-white/20 hover:bg-white/30 px-8 py-4 rounded-2xl flex items-center gap-3 mx-auto transition-colors active:scale-95">
                <SpeakerIcon className="w-6 h-6" />
                <span className="text-xs font-bold uppercase tracking-widest">Speak Now</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};