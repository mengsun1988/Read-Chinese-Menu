import React from 'react';
import { SpeakerIcon } from './Icons';

interface StaffHelperModalProps {
  onClose: () => void;
}

export const StaffHelperModal: React.FC<StaffHelperModalProps> = ({ onClose }) => {
  const messageEn = "I'd like to eat here. Is there a table available?";
  const messageCn = "我想在这里吃饭，请问还有位子吗？";

  const speakText = () => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(messageCn);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-rose-600 text-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 p-4 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="max-w-2xl w-full space-y-16">
        <div className="space-y-6">
          <p className="text-xl opacity-80 font-medium uppercase tracking-[0.2em]">English Translation</p>
          <h2 className="text-4xl md:text-5xl font-semibold leading-tight">{messageEn}</h2>
        </div>

        <div className="h-1 w-32 bg-yellow-400 mx-auto rounded-full shadow-lg"></div>

        <div className="space-y-8">
          <h2 className="text-6xl md:text-8xl font-bold leading-tight chinese-font text-yellow-300">
            {messageCn}
          </h2>
          <p className="text-lg opacity-60 italic font-medium">Wǒ xiǎng zài zhèlǐ chīfàn, qǐngwèn hái yǒu wèizi ma?</p>
        </div>

        <button 
          onClick={speakText}
          className="bg-white text-rose-600 px-10 py-6 rounded-[2.5rem] font-bold text-2xl flex items-center justify-center gap-4 mx-auto shadow-2xl hover:scale-105 active:scale-95 transition-all"
        >
          <SpeakerIcon className="w-8 h-8" />
          <span>Play Audio / 播放语音</span>
        </button>
      </div>

      <p className="absolute bottom-12 text-[10px] font-semibold uppercase tracking-[0.4em] opacity-40">
        Show this screen to the waiter • 请出示给服务员
      </p>
    </div>
  );
};