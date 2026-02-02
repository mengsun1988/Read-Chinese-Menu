import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface CreditUpdateCardProps {
  message: string;
  onClose: () => void;
}

export const CreditUpdateCard: React.FC<CreditUpdateCardProps> = ({ message, onClose }) => {
  const { t } = useTranslation();
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(onClose, 500); 
    }, 2800);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  const isDeduction = message.includes('-');

  return (
    <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[10000] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
      !isFading ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-12 scale-90'
    } w-[92%] max-w-[380px]`}>
      
      {/* 苹果规范：毛玻璃 + 0.5px 边框感 + 柔和投影 */}
      <div className="bg-white/80 backdrop-blur-2xl border border-white/50 p-4 rounded-[2.2rem] flex items-center gap-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)]">
        
        {/* 左侧图标容器 */}
        <div className={`w-11 h-11 rounded-[1.1rem] flex items-center justify-center text-xl shadow-inner shrink-0 ${
          isDeduction ? 'bg-rose-50/80' : 'bg-emerald-50/80'
        }`}>
          {isDeduction ? '📉' : '🎁'}
        </div>

        {/* 文字主体 */}
        <div className="flex-1 text-left">
          <p className={`text-[10px] font-black uppercase tracking-[0.12em] leading-none mb-1.5 ${
            isDeduction ? 'text-rose-500' : 'text-emerald-600'
          }`}>
            {t('creditUpdate.title')}
          </p>
          <p className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
            {message}
          </p>
        </div>

        {/* 苹果风格的关闭/确认按钮 */}
        <button 
          onClick={() => { setIsFading(true); setTimeout(onClose, 300); }}
          className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-90 ${
            isDeduction 
              ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
              : 'bg-emerald-600 text-white shadow-[0_4px_12px_rgba(5,150,105,0.3)]'
          }`}
        >
          {t('creditUpdate.ok')}
        </button>
      </div>
    </div>
  );
};