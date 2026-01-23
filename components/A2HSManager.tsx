import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'rmc_a2hs_hidden_until';

export const A2HSManager: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showiOSGuide, setShowiOSGuide] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if already installed
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // 2. Check dismissal state
    const hiddenUntil = localStorage.getItem(STORAGE_KEY);
    const isDismissed = hiddenUntil && new Date().getTime() < parseInt(hiddenUntil);

    // 3. Android/Chrome logic: Listen for the native install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // For Chrome/Android, we show the button if not dismissed and not standalone
      if (!isStandalone && !isDismissed) {
        setIsVisible(true);
      }
    };

    // 4. iOS Detection: iOS doesn't have an automated prompt event, so we detect OS
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) && !(window as any).MSStream;
    
    // In production, we show based on device. 
    // In development/demo, you might not see it on desktop unless we force it.
    if (!isStandalone && !isDismissed) {
      if (isIOS) {
        setIsVisible(true);
      } else {
        // Fallback: If browser supports beforeinstallprompt, it will trigger handleBeforeInstallPrompt
        // On desktop Chrome, if criteria are met, it fires.
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isStandalone]);

  const handleInstallClick = async () => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (deferredPrompt) {
      // Trigger native Chrome/Android install dialog
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // Trigger custom iOS guide
      setShowiOSGuide(true);
    } else {
      // For desktop or other browsers where prompt hasn't fired yet
      alert("To install: Click the 'Install' icon in your browser's address bar or use the browser menu.");
    }
  };

  const dismissPermanently = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    // Hide for 24 hours
    const tomorrow = new Date().getTime() + (24 * 60 * 60 * 1000);
    localStorage.setItem(STORAGE_KEY, tomorrow.toString());
  };

  if (!isVisible || isStandalone) return null;

  return (
    <>
      {/* Trigger Button - Floating Bottom Left */}
      <div className="fixed bottom-6 left-6 z-[60] flex items-center animate-in slide-in-from-left-10 duration-700">
        <div className="relative group">
          {/* Pulsing decoration */}
          <div className="absolute inset-0 bg-rose-500/20 rounded-2xl animate-ping pointer-events-none"></div>
          
          <button 
            onClick={handleInstallClick}
            className="relative flex items-center gap-3 bg-white/95 backdrop-blur-md border border-slate-200 px-5 py-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:border-rose-300 transition-all active:scale-95 group"
          >
            <div className="w-8 h-8 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-200 group-hover:rotate-12 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-[9px] font-semibold text-rose-600 uppercase tracking-widest leading-none mb-1">Stay Connected</p>
              <p className="text-sm font-semibold text-slate-900 leading-none">Save App to Home</p>
            </div>
          </button>
          
          <button 
            onClick={dismissPermanently}
            className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 border border-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* iOS Install Guide Modal */}
      {showiOSGuide && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowiOSGuide(false)}>
          <div 
            className="bg-[#fcfbf9] w-full max-w-sm rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* iOS specific indicator for swipe down */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2 sm:hidden"></div>

            <div className="p-8 pt-4 sm:pt-8 text-center space-y-6">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-rose-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">Add to iPhone</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                  Get instant access from your home screen just like a native app. No more searching for links.
                </p>
              </div>

              <div className="bg-white/50 border border-slate-100 rounded-3xl p-6 space-y-6 text-left">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 font-semibold text-xs">1</div>
                  <p className="text-slate-700 text-sm font-medium">
                    Tap the <span className="inline-block p-1 bg-slate-100 rounded-md mx-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                      </svg>
                    </span> <strong>Share</strong> button below.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 font-semibold text-xs">2</div>
                  <p className="text-slate-700 text-sm font-medium">
                    Choose <strong>"Add to Home Screen"</strong> from the menu.
                  </p>
                  <div className="ml-auto w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowiOSGuide(false)}
                className="w-full bg-slate-900 text-white font-semibold py-4 rounded-2xl shadow-xl transition-all active:scale-95 text-sm uppercase tracking-widest hover:bg-slate-800"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};