import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface PayPalButtonProps {
  amount: string;
  planName: string;
  onSuccess: (details: any) => void;
}

export const PayPalButton: React.FC<PayPalButtonProps> = ({ amount, planName, onSuccess }) => {
  // ✅ 核心修改 1：使用 import.meta.env 读取你在 .env.local 定义的变量
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  return (
    // ✅ 核心修改 2：如果 clientId 没读到，给一个控制台报错提示，方便调试
    <PayPalScriptProvider options={{ clientId: clientId || "sb" }}>
      {!clientId && <p style={{color: 'red'}}>Warning: PayPal Client ID not found!</p>}
      
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