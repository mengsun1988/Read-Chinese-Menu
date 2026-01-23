
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

/** 
 * --- ENVIRONMENT SETUP ---
 * Ensures process.env is populated for third-party SDKs
 */
const syncEnvironment = () => {
  try {
    const envSource = (import.meta as any).env || {};
    if (!(window as any).process) (window as any).process = { env: {} };
    if (!(window as any).process.env) (window as any).process.env = {};
    
    // Specifically map API_KEY for Gemini SDK
    if (envSource.VITE_GEMINI_API_KEY) {
      (window as any).process.env.API_KEY = envSource.VITE_GEMINI_API_KEY;
    }

    Object.keys(envSource).forEach(key => {
      (window as any).process.env[key] = String(envSource[key]);
    });
  } catch (e) {
    console.warn("[Env] Sync failed:", e);
  }
};

syncEnvironment();

/** 
 * --- PAYPAL CONFIGURATION ---
 */
const DEFAULT_PAYPAL_CLIENT_ID = "AcC48c12BiT2mIq4tk1ZL5bx-wBeh_py5KL2tqCt_kroECMc2DAyuoR69RnwiNxesuJuyMQ9q5Ek7PbA"; 

const getPayPalClientId = () => {
  const env = (window as any).process?.env || {};
  const id = env.VITE_PAYPAL_CLIENT_ID || DEFAULT_PAYPAL_CLIENT_ID;
  return (id && id !== 'undefined' && id !== 'null') ? id : DEFAULT_PAYPAL_CLIENT_ID;
};

const paypalOptions = {
  clientId: getPayPalClientId(),
  currency: "USD",
  intent: "capture",
  components: "buttons",
  "data-namespace": "paypal_sdk",
  "disable-funding": "paylater,credit,card"
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <PayPalScriptProvider options={paypalOptions}>
        <App />
      </PayPalScriptProvider>
    </React.StrictMode>
  );
} else {
  console.error("Fatal Error: Target container #root not found in DOM.");
}
