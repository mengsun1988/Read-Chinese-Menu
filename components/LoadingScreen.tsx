import React, { useState, useEffect } from 'react';
import { ChopsticksIcon } from './Icons';

const messages = [
  "Deep-scanning line by line...",
  "Consulting the culinary database...",
  "Identifying spicy levels and hidden fats...",
  "Translating names for you...",
  "Checking for lard and tallow...",
  "Finalizing your gourmet list..."
];

export const LoadingScreen: React.FC = () => {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % messages.length);
    }, 2500);

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) return prev;
        const increment = prev < 50 ? 2 : (prev < 85 ? 0.8 : 0.2);
        return Math.min(prev + increment, 99);
      });
    }, 200);

    return () => {
      clearInterval(msgTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] p-10 bg-white">
      <div className="relative mb-12">
        <div className="w-24 h-24 border-[6px] border-slate-50 border-t-rose-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
           <ChopsticksIcon className="w-10 h-10 text-rose-600" />
        </div>
      </div>
      
      <div className="w-full max-w-sm space-y-4 mb-8">
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-rose-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menu Analysis</span>
          <span className="text-xs font-bold text-rose-600">{Math.floor(progress)}%</span>
        </div>
      </div>

      <div className="text-center space-y-4">
        <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">Processing Menu</h3>
        <p className="text-slate-500 font-medium italic transition-all h-6">
          {messages[msgIdx]}
        </p>
      </div>
    </div>
  );
};