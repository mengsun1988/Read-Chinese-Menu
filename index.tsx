
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

/** 
 * --- PAYPAL CONFIGURATION ---
 * Replace 'sb' with your actual PayPal Client ID.
 * If you set an environment variable PAYPAL_CLIENT_ID, it will use that first.
 */
const DEFAULT_PAYPAL_CLIENT_ID = "sb"; // <--- Add your ID here

const getPayPalClientId = () => {
  const envId = (window as any).process?.env?.PAYPAL_CLIENT_ID || (window as any).process?.env?.VITE_PAYPAL_CLIENT_ID;
  return (envId && envId !== 'undefined' && envId !== '') ? envId : DEFAULT_PAYPAL_CLIENT_ID; 
};

// Environment bridge logic
try {
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = { env: {} };
  }
  const envSource = (import.meta as any).env || (window as any).process?.env || {};
  Object.keys(envSource).forEach(key => {
    const value = envSource[key];
    if (value !== undefined && value !== null) {
      (window as any).process.env[key.replace('VITE_', '')] = String(value);
      (window as any).process.env[key] = String(value);
    }
  });
} catch (e) {
  console.warn("Env bridge warning:", e);
}

// Prevent cross-origin script errors from crashing the React tree
window.addEventListener('error', (event) => {
  if (event.message?.includes('window host') || event.message?.includes('paypal')) {
    event.stopImmediatePropagation();
    console.warn('Suppressed PayPal cross-origin error:', event.message);
  }
});

const paypalOptions = {
  clientId: getPayPalClientId(),
  currency: "USD",
  intent: "capture",
  components: "buttons",
  "data-namespace": "paypal_sdk",
  "disable-funding": "paylater,credit,card"
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <PayPalScriptProvider options={paypalOptions}>
      <App />
    </PayPalScriptProvider>
  </React.StrictMode>
);
