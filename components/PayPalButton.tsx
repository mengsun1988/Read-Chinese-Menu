import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface PayPalButtonProps {
  amount: string;
  planName: string;
  onSuccess: (details: any) => void;
}

export const PayPalButton: React.FC<PayPalButtonProps> = ({ amount, planName, onSuccess }) => {
  // ✅ Using import.meta.env to read variables from .env or .env.local in a Vite environment
  const clientId = (import.meta as any).env.VITE_PAYPAL_CLIENT_ID;

  return (
    // ✅ Fallback to "sb" (sandbox) if clientId is not found, providing a warning for debugging
    <PayPalScriptProvider options={{ clientId: clientId || "sb" }}>
      {!clientId && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl">
          <p className="text-rose-600 text-[10px] font-bold text-center uppercase tracking-wider">
            ⚠️ Warning: VITE_PAYPAL_CLIENT_ID not found in environment!
          </p>
        </div>
      )}
      
      <PayPalButtons
        style={{ layout: "vertical", shape: "pill", color: "blue" }}
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
          const details = await actions.order?.capture();
          if (details) {
            onSuccess(details);
          }
        }}
        onError={(err) => {
          console.error("PayPal Error:", err);
          alert("Payment failed. Please try again or check your internet connection.");
        }}
      />
    </PayPalScriptProvider>
  );
};