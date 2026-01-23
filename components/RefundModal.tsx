import React from 'react';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({ isOpen, onClose }) => {
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
          <h3 className="text-3xl font-semibold text-slate-900 tracking-tight">Fair & Simple Refunds</h3>
          <p className="text-slate-500 font-medium italic text-sm">
            "We want to be your bridge to flavors, not a hurdle. If our tool isn't helping you explore, we don't want your money."
          </p>
        </div>

        {/* Policy Content */}
        <div className="px-8 pb-10 space-y-8">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 font-semibold text-xs">01</div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">The 24h Window</h4>
                <p className="text-slate-500 text-xs leading-relaxed font-medium">Request a refund within 24 hours of purchase, provided you've consumed 3 or fewer credits.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 font-semibold text-xs">02</div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">Technical Guarantee</h4>
                <p className="text-slate-500 text-xs leading-relaxed font-medium">If our AI completely fails to read a clear, well-lit photo of a menu, you are entitled to a 100% full refund regardless of usage.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 font-semibold text-xs">03</div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">No-Fuss Process</h4>
                <p className="text-slate-500 text-xs leading-relaxed font-medium">Simply email your PayPal transaction ID or a screenshot of your payment to <span className="text-rose-600 font-semibold">support@readchinesemenu.com</span>. No login or forms required.</p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-white font-semibold py-4 rounded-2xl shadow-xl transition-all active:scale-95 text-sm uppercase tracking-widest hover:bg-slate-800"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};