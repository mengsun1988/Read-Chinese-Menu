import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface CreditUpdateCardProps {
  message: string;
  onClose: () => void;
}

export const CreditUpdateCard: React.FC<CreditUpdateCardProps> = ({ message, onClose }) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(onClose, 300);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] transition-all duration-300 ${
      isVisible && !isFading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      <div className="bg-emerald-50/40 border border-emerald-100 p-5 rounded-[2rem] flex items-center justify-between group hover:bg-emerald-50 transition-all active:scale-95 shadow-xl">
        <div className="flex items-center gap-4 text-left">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm group-hover:rotate-12 transition-transform">
            🎁
          </div>
          <div>
            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">
              {t('creditUpdate.title')}
            </p>
            <p className="text-xs font-bold text-slate-900">{message}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="bg-emerald-600 text-white px-3 py-1.5 rounded-full text-[8px] font-black shadow-md uppercase tracking-wider"
        >
          {t('creditUpdate.ok')}
        </button>
      </div>
    </div>
  );
};