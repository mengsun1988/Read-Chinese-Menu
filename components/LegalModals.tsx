import React from 'react';

interface LegalModalProps {
  type: 'privacy' | 'tos';
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const isPrivacy = type === 'privacy';

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-2xl rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 pb-4 flex justify-between items-center border-b border-slate-100">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-600 text-sm leading-relaxed">
          {isPrivacy ? (
            <>
              <section className="space-y-3">
                <h3 className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">Information We Collect</h3>
                <p>We do not store your raw photos on our servers. Images processed by our AI are used solely for the real-time conversion of menus and storefronts. Once the analysis is complete, images are discarded.</p>
              </section>
              <section className="space-y-3">
                <h3 className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">Data Usage</h3>
                <p>We use local storage to track your remaining credits and daily rewards. This data resides on your device. We use third-party services like Google Gemini for text recognition and analysis.</p>
              </section>
              <section className="space-y-3">
                <h3 className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">Camera Permissions</h3>
                <p>The app requests camera access to allow you to take photos of physical menus. We do not access your camera without your explicit action (clicking the camera icon).</p>
              </section>
              <section className="space-y-3">
                <h3 className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">Cookies</h3>
                <p>We use essential cookies and local storage to maintain your user session and credit balance. We do not use tracking cookies for advertising.</p>
              </section>
            </>
          ) : (
            <>
              <section className="space-y-3">
                <h3 className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">Usage Agreement</h3>
                <p>By using Read Chinese Menu, you agree to use the tool for personal, non-commercial exploration. You are responsible for any dining decisions made based on AI-generated translations.</p>
              </section>
              <section className="space-y-3">
                <h3 className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">Accuracy Disclaimer</h3>
                <p>AI translation and analysis is not 100% accurate. We cannot guarantee that all ingredients, allergens, or prices are correctly identified. Always confirm with restaurant staff before consuming any food if you have severe allergies.</p>
              </section>
              <section className="space-y-3">
                <h3 className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">Payments & Credits</h3>
                <p>Credits purchased are non-transferable. Subscriptions (Passes) expire according to the chosen timeframe. Refund policies are detailed in the specific Refund Policy section available in the Pricing module.</p>
              </section>
              <section className="space-y-3">
                <h3 className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">Abuse of Service</h3>
                <p>We reserve the right to block users who attempt to bypass credit limits, scrape data, or use the service for automated large-scale processing.</p>
              </section>
            </>
          )}
          <div className="pt-8 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Last Updated: January 2026</p>
          </div>
        </div>

        <div className="p-8 pt-4 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-white font-semibold py-4 rounded-2xl shadow-xl transition-all active:scale-95 text-xs uppercase tracking-widest hover:bg-slate-800"
          >
            I Accept
          </button>
        </div>
      </div>
    </div>
  );
};
