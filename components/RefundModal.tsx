import React from 'react';
import { useTranslation } from 'react-i18next';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-[#fcfbf9] w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Warm Icon */}
        <div className="pt-10 pb-6 px-8 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto rotate-3 shadow-sm border border-rose-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </div>
          <h3 className="text-3xl font-semibold text-slate-900 tracking-tight">
            {t('refund.title')}
          </h3>
          <p className="text-slate-500 font-medium italic text-sm">
            {t('refund.quote')}
          </p>
        </div>

        {/* Policy Content */}
        <div className="px-8 pb-10 space-y-8">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 font-semibold text-xs">01</div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">{t('refund.windowTitle')}</h4>
                <p className="text-slate-500 text-xs leading-relaxed font-medium">{t('refund.windowContent')}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 font-semibold text-xs">02</div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">{t('refund.techTitle')}</h4>
                <p className="text-slate-500 text-xs leading-relaxed font-medium">{t('refund.techContent')}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 font-semibold text-xs">03</div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">{t('refund.processTitle')}</h4>
                <p className="text-slate-500 text-xs leading-relaxed font-medium">
                  {t('refund.processContent')}
                  <span className="text-rose-600 font-semibold">info@readchinesemenu.com</span>
                  {t('refund.processContentEnd')}
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-white font-semibold py-4 rounded-2xl shadow-xl transition-all active:scale-95 text-sm uppercase tracking-widest hover:bg-slate-800"
          >
            {t('refund.understand')}
          </button>
        </div>
      </div>
    </div>
  );
};