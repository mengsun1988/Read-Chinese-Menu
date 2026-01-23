
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

/** 
 * --- ENVIRONMENT SETUP ---
 * Syncs platform environment variables into process.env for SDK compatibility
 */
const syncEnvironment = () => {
  try {
    const envSource = (import.meta as any).env || {};
    if (!(window as any).process) (window as any).process = { env: {} };
    if (!(window as any).process.env) (window as any).process.env = {};
    
    // Explicitly handle API_KEY for Google GenAI SDK
    if (envSource.VITE_GEMINI_API_KEY) {
      (window as any).process.env.API_KEY = envSource.VITE_GEMINI_API_KEY;
    } else if (envSource.API_KEY) {
      (window as any).process.env.API_KEY = envSource.API_KEY;
    }

    Object.keys(envSource).forEach(key => {
      (window as any).process.env[key] = String(envSource[key]);
    });
  } catch (e) {
    console.warn("[Env Sync] Failed:", e);
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
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <PayPalScriptProvider options={paypalOptions}>
          <App />
        </PayPalScriptProvider>
      </React.StrictMode>
    );
  } catch (err) {
    console.error("React Mounting Failed:", err);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;">Failed to start application. Please refresh.</div>`;
  }
} else {
  console.error("Fatal Error: #root element not found.");
}
