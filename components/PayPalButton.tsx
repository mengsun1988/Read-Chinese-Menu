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

  useEffect(() => {
    if (isRejected) {
      console.error("PayPal SDK failed to load.");
    }
  }, [isRejected]);

  if (isRejected || localError) {
    return (
      <div className="w-full py-4 text-center animate-in fade-in">
        <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-tight">Connection Error</p>
        <button onClick={() => window.location.reload()} className="text-[9px] font-bold text-rose-600 underline uppercase mt-2">Retry</button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* 加载状态：移除了强制白色背景，改为轻量 loading */}
      {isPending && (
        <div className="flex flex-col items-center py-8 animate-pulse">
          <div className="w-6 h-6 border-[3px] border-slate-200 border-t-rose-600 rounded-full animate-spin mb-3"></div>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Connecting...</p>
        </div>
      )}

      {/* 按钮区域：允许高度自适应，防止溢出 */}
      <div className="w-full transition-all duration-500 min-h-[45px]">
        {isResolved && (
          <PayPalButtons
            key={amount + planName}
            style={{ 
              layout: "vertical", 
              shape: "pill", 
              color: "blue", 
              height: 45, // 微调高度使其更精致
              label: "paypal" 
            }}
            createOrder={(data, actions) => {
              return actions.order.create({
                intent: "CAPTURE",
                purchase_units: [{
                  description: `Support - ${planName}`,
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
                setLocalError("Transaction failed.");
              }
            }}
            onError={() => setLocalError("Gateway Error")}
          />
        )}
      </div>
      
      {/* 底部信任标：轻量化 */}
      {!isPending && (
        <div className="mt-4 flex items-center justify-center gap-1.5 opacity-30">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5 text-slate-900">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
          </svg>
          <span className="text-[8px] font-black text-slate-900 uppercase tracking-[0.1em]">
            PayPal SECURED
          </span>
        </div>
      )}
    </div>
  );
};
