
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

/** 
 * --- ENVIRONMENT SETUP ---
 * Ensures process.env.API_KEY is populated for the Google GenAI SDK
 */
const syncEnvironment = () => {
  try {
    const envSource = (import.meta as any).env || {};
    if (!(window as any).process) (window as any).process = { env: {} };
    if (!(window as any).process.env) (window as any).process.env = {};
    
    // Map available keys to the standard process.env.API_KEY used by the SDK
    const apiKey = envSource.VITE_GEMINI_API_KEY || envSource.API_KEY || "";
    (window as any).process.env.API_KEY = apiKey;

    // Copy other env vars
    Object.keys(envSource).forEach(key => {
      (window as any).process.env[key] = String(envSource[key]);
    });
  } catch (e) {
    console.error("[Env Sync] Failed:", e);
  }
};

syncEnvironment();

/** 
 * --- PAYPAL CONFIGURATION ---
 */
const DEFAULT_PAYPAL_CLIENT_ID = "AcC48c12BiT2mIq4tk1ZL5bx-wBeh_py5KL2tqCt_kroECMc2DAyuoR69RnwiNxesuJuyMQ9q5Ek7PbA"; 

const getPayPalClientId = () => {
  const env = (window as any).process?.env || {};
  return env.VITE_PAYPAL_CLIENT_ID || DEFAULT_PAYPAL_CLIENT_ID;
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
  console.error("Fatal: #root not found.");
}
