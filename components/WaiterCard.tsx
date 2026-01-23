import React, { useState } from 'react';
import { SpeakerIcon } from './Icons';

interface WaiterCardProps {
  type: 'ingredient' | 'spiciness';
  content_en: string;
  content_cn: string;
  onClose: () => void;
}

export const WaiterCard: React.FC<WaiterCardProps> = ({ type, content_en, content_cn, onClose }) => {
  const [response, setResponse] = useState<'YES' | 'NO' | null>(null);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeakMain = () => {
    if (type === 'ingredient') {
      speakText(`这道菜里有 ${content_cn} 吗？`);
    } else {
      speakText(`这个菜辣吗？可以做不辣吗？`);
    }
  };

  const handleWaiterResponse = (res: 'YES' | 'NO') => {
    setResponse(res);
    if (window.navigator.vibrate) window.navigator.vibrate(50);
  };

  return (
    <div className={`fixed inset-0 z-[100] transition-colors duration-500 flex flex-col items-center justify-between p-8 text-white text-center animate-in fade-in zoom-in duration-300 ${
      response === 'YES' ? 'bg-green-600' : response === 'NO' ? 'bg-slate-900' : 'bg-red-600'
    }`}>
      {/* Top Controls */}
      <div className="w-full flex justify-between items-center">
        <button 
          onClick={handleSpeakMain}
          className="p-4 bg-white/20 rounded-2xl hover:bg-white/30 active:scale-95 transition-all flex items-center gap-3"
        >
          <SpeakerIcon className="w-8 h-8" />
          <span className="font-semibold text-sm uppercase tracking-widest">Speak / 语音</span>
        </button>
        
        <button 
          onClick={onClose}
          className="p-4 bg-white/20 rounded-full hover:bg-white/30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Central Question */}
      <div className="space-y-12 max-w-2xl w-full flex-1 flex flex-col justify-center">
        {response ? (
          <div className="animate-in zoom-in duration-300 text-center space-y-4">
            <h2 className="text-9xl font-semibold">YES</h2>
            <h3 className="text-6xl font-bold chinese-font">{response === 'YES' ? '是 / 有' : '不 / 没有'}</h3>
            <button 
              onClick={() => setResponse(null)}
              className="mt-8 text-white/60 font-medium underline"
            >
              Reset / 重置
            </button>
          </div>
        ) : (
          <>
            {type === 'ingredient' ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="text-xl opacity-80 font-medium uppercase tracking-widest">Question for Staff</p>
                  <h2 className="text-4xl font-semibold leading-tight">
                    Does this dish contain <span className="underline decoration-yellow-400 decoration-4">{content_en}</span>?
                  </h2>
                </div>
                <div className="h-2 w-24 bg-yellow-400 mx-auto rounded-full shadow-lg"></div>
                <div className="space-y-4">
                  <h2 className="text-7xl font-bold leading-tight chinese-font">
                    这道菜里有<br/><span className="text-yellow-300 font-bold">"{content_cn}"</span>吗？
                  </h2>
                </div>
              </div>
            ) : (
              <div className="space-y-10">
                <div className="bg-white/10 p-6 rounded-[2rem] border border-white/20 relative group">
                  <button 
                    onClick={() => speakText('这个菜辣吗？')}
                    className="absolute top-4 right-4 p-2 bg-white/20 rounded-lg hover:bg-white/30 active:scale-90 transition-all"
                  >
                    <SpeakerIcon className="w-5 h-5" />
                  </button>
                  <p className="text-lg font-semibold bg-white/10 inline-block px-4 py-1 rounded-full uppercase tracking-tighter mb-4">Question 1</p>
                  <h3 className="text-3xl font-semibold mb-1">Is this dish spicy?</h3>
                  <h3 className="text-5xl font-bold chinese-font text-yellow-300">这个菜辣吗？</h3>
                </div>
                
                <div className="h-px w-24 bg-white/20 mx-auto"></div>

                <div className="bg-white/10 p-6 rounded-[2rem] border border-white/20 relative group">
                  <button 
                    onClick={() => speakText('可以做不辣吗？')}
                    className="absolute top-4 right-4 p-2 bg-white/20 rounded-lg hover:bg-white/30 active:scale-90 transition-all"
                  >
                    <SpeakerIcon className="w-5 h-5" />
                  </button>
                  <p className="text-lg font-semibold bg-white/10 inline-block px-4 py-1 rounded-full uppercase tracking-tighter mb-4">Question 2</p>
                  <h3 className="text-2xl font-semibold opacity-80 italic mb-1">Can you make it not spicy?</h3>
                  <h3 className="text-4xl font-bold chinese-font text-yellow-300">可以做不辣吗？</h3>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Bottom Response Board for Waiter */}
      <div className="w-full max-w-2xl grid grid-cols-2 gap-6 pt-12 border-t border-white/20">
        <button 
          onClick={() => handleWaiterResponse('YES')}
          className="bg-green-500 hover:bg-green-400 text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center gap-2 border-b-8 border-green-700 active:border-b-0 active:translate-y-2 transition-all"
        >
          <span className="text-4xl font-semibold">YES</span>
          <span className="text-5xl font-bold chinese-font">是 / 有</span>
        </button>
        
        <button 
          onClick={() => handleWaiterResponse('NO')}
          className="bg-slate-800 hover:bg-slate-700 text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center gap-2 border-b-8 border-slate-950 active:border-b-0 active:translate-y-2 transition-all"
        >
          <span className="text-4xl font-semibold">NO</span>
          <span className="text-5xl font-bold chinese-font">不 / 没</span>
        </button>
      </div>

      <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.3em] opacity-40">
        Show this screen to staff • 请出示给服务员
      </p>
    </div>
  );
};