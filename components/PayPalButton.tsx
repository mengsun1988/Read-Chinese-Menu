import React, { useState, useEffect } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";

interface PayPalButtonProps {
  amount: string;
  planName: string;
  onSuccess: (details: any) => void;
}

export const PayPalButton: React.FC<PayPalButtonProps> = ({ amount, planName, onSuccess }) => {
  const [{ isPending, isRejected, isResolved }] = usePayPalScriptReducer();
  const [localError, setLocalError] = useState<string | null>(null);

  // Debugging log to track PayPal status if needed
  useEffect(() => {
    if (isRejected) {
      console.error("PayPal SDK failed to load.");
    }
  }, [isRejected]);

  if (isRejected || localError) {
    return (
      <div className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 text-center animate-in fade-in">
        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <p className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-1">Payment Module Offline</p>
        <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">
          Please check your connection or try another browser.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 text-[10px] font-bold text-rose-600 underline"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="w-full relative min-h-[160px] flex flex-col justify-center bg-slate-50/50 rounded-[2rem] p-6 border-2 border-slate-100 shadow-inner overflow-hidden">
      {isPending && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10 rounded-[1.8rem] backdrop-blur-[2px] transition-opacity">
          <div className="w-10 h-10 border-[4px] border-slate-100 border-t-rose-600 rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">
            Securing Connection...
          </p>
        </div>
      )}

      <div className="relative">
        {isResolved && (
          <PayPalButtons
            key={amount + planName}
            style={{ 
              layout: "vertical", 
              shape: "pill", 
              color: "blue", 
              height: 50,
              label: "checkout"
            }}
            createOrder={(data, actions) => {
              return actions.order.create({
                intent: "CAPTURE",
                purchase_units: [{
                  description: `Read Chinese Menu - ${planName}`,
                  amount: { 
                    currency_code: "USD",
                    value: amount 
                  }
                }]
              });
            }}
            onApprove={async (data, actions) => {
              try {
                const details = await actions.order?.capture();
                if (details) onSuccess(details);
              } catch (err) {
                console.error("Payment capture error:", err);
                setLocalError("Transaction failed during capture.");
              }
            }}
            onError={(err: any) => {
              console.error("PayPal Button Error:", err);
              setLocalError("The payment gateway encountered an error.");
            }}
          />
        )}
      </div>
      
      <div className="mt-4 flex items-center justify-center gap-2 opacity-50">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-emerald-600">
          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
        </svg>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">
          Powered by PayPal • Encrypted
        </span>
      </div>
    </div>
  );
};