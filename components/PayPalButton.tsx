import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface PayPalButtonProps {
  amount: string;
  planName: string;
  onSuccess: (details: any) => void;
}

export const PayPalButton: React.FC<PayPalButtonProps> = ({ amount, planName, onSuccess }) => {
  // Use pre-configured PAYPAL_CLIENT_ID from process.env if available, otherwise fallback to sandbox 'sb'
  const clientId = (process.env as any).PAYPAL_CLIENT_ID || "sb";

  return (
    <PayPalScriptProvider options={{ "client-id": clientId }}>
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