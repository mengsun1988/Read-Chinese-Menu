import React, { useState, useEffect } from 'react';
import { ChopsticksIcon } from './Icons';

interface LoadingScreenProps {
  mode?: 'menu' | 'street';
  // 传入当前真实的系统状态：'compressing' | 'uploading' | 'analyzing' | 'success'
  status?: 'compressing' | 'uploading' | 'analyzing' | 'success';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  mode = 'menu', 
  status = 'analyzing' 
}) => {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  // 1. 感性文案：负责提供“情绪价值”
  const messages = mode === 'menu' 
    ? [
        "Preparing chopsticks... 🥢",
        "Consulting the culinary database... 📚",
        "Decoding Grandma's secret recipe... 👵",
        "Identifying spicy levels & allergens... 🔥",
        "Checking for hidden fats... 🐄",
        "Almost there, stay hungry!  dumpling"
      ]
    : [
        "Wandering through the alleyways... 🏘️",
        "Checking the neighborhood map... 📍",
        "Asking the local shopkeeper... 🏮",
        "Polishing the storefront sign... ✨",
        "Identifying hidden gems... 💎",
        "Almost there, don't get lost! 🚶"
      ];

  // 2. 进度条逻辑
  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % messages.length);
    }, 2800);

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        // 根据不同阶段调整进度条感官速度
        if (status === 'compressing') return Math.min(prev + 2, 20);
        if (status === 'uploading') return Math.min(prev + 1, 45);
        if (prev < 90) return prev + 0.5;
        if (prev < 99.8) return prev + 0.05; // 极慢逼近，绝不卡死
        return prev;
      });
    }, 150);

    return () => {
      clearInterval(msgTimer);
      clearInterval(progressTimer);
    };
  }, [messages.length, status]);

  // 3. 成功后的 Bon Appétit 动画层
  if (status === 'success') {
    return (
      <div className="fixed inset-0 z-[200] bg-rose-600 flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="text-center space-y-6">
          <div className="text-6xl mb-4 animate-bounce">🥘</div>
          <h2 className="text-white text-5xl font-black italic tracking-tighter animate-in zoom-in duration-700">
            Bon Appétit!
          </h2>
          <p className="text-rose-100 font-bold tracking-widest uppercase text-xs opacity-80 animate-pulse">
            Enjoy your meal in China
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-10 bg-white rounded-[2.2rem] animate-in fade-in duration-500">
      
      {/* 动画中心 */}
      <div className="relative mb-14">
        <div className="absolute -inset-4 border-2 border-dashed border-slate-100 rounded-full animate-[spin_10s_linear_infinite]"></div>
        <div className={`w-28 h-28 border-[6px] border-slate-50 rounded-full animate-spin ${
          status === 'compressing' ? 'border-t-amber-500' : 
          status === 'uploading' ? 'border-t-blue-500' : 'border-t-rose-600'
        }`}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white p-4 rounded-full shadow-sm">
            <ChopsticksIcon className={`w-10 h-10 transition-colors duration-500 ${
              status === 'compressing' ? 'text-amber-500' : 
              status === 'uploading' ? 'text-blue-500' : 'text-rose-600'
            }`} />
          </div>
        </div>
      </div>
      
      {/* 进度条区域 */}
      <div className="w-full max-w-sm space-y-5 mb-10">
        <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
          <div 
            className="h-full transition-all duration-700 ease-out relative"
            style={{ 
              width: `${progress}%`,
              backgroundColor: status === 'compressing' ? '#f59e0b' : status === 'uploading' ? '#3b82f6' : '#e11d48'
            }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[shimmer_1.5s_infinite]"></div>
          </div>
        </div>

        <div className="flex justify-between items-center px-1">
          {/* 系统状态文字：明确告知用户后台动作 */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                status === 'compressing' ? 'bg-amber-400' : status === 'uploading' ? 'bg-blue-400' : 'bg-rose-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                status === 'compressing' ? 'bg-amber-600' : status === 'uploading' ? 'bg-blue-600' : 'bg-rose-600'
              }`}></span>
            </span>
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">
              {status === 'compressing' && "Compressing Image..."}
              {status === 'uploading' && "Sending to AI Server..."}
              {status === 'analyzing' && "AI Deep Thinking..."}
            </span>
          </div>
          <span className="text-sm font-black text-slate-900 tabular-nums">
            {Math.floor(progress)}%
          </span>
        </div>
      </div>

      {/* 感性趣味文案 */}
      <div className="text-center space-y-4 max-w-xs">
        <div className="h-10 flex items-center justify-center">
          <p className="text-slate-500 font-bold italic transition-all duration-500 animate-in fade-in slide-in-from-bottom-2">
            {messages[msgIdx]}
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};
