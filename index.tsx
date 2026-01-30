import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import './src/i18n/i18n'; // 假设 index.tsx 在根目录

/** 
 * --- ENVIRONMENT SETUP ---
 * Hardens the environment for the Gemini SDK and other services.
 */
const syncEnvironment = () => {
  try {
    const envSource = (import.meta as any).env || {};
    if (!(window as any).process) (window as any).process = { env: {} };
    if (!(window as any).process.env) (window as any).process.env = {};
    
    // Map VITE_API_KEY or VITE_GEMINI_API_KEY to process.env.API_KEY for @google/genai
    const apiKey = envSource.VITE_API_KEY || envSource.VITE_GEMINI_API_KEY || envSource.API_KEY || "";
    (window as any).process.env.API_KEY = apiKey;

    // Sync all Vite-style variables to process.env
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
const DEFAULT_PAYPAL_CLIENT_ID = "AdY7cjJGhxSVjZOPZr-LoHhX8JHtyQfNjmr6I8HjO4cv3cqW_U2zr1hpxa67nU8o4i6GoH0sFIh0P1aS"; 

const getPayPalClientId = () => {
  const envSource = (import.meta as any).env || {};
  const clientId = envSource.VITE_PAYPAL_CLIENT_ID || (window as any).process?.env?.VITE_PAYPAL_CLIENT_ID;
  
  // Hardened check: if empty, undefined string, or null, fallback to "sb" (sandbox) or default
  if (!clientId || clientId === "undefined" || clientId === "" || clientId === "null") {
    return "sb"; // Fallback to sandbox to prevent SDK crash
  }
  return clientId;
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
  // Use a small delay to ensure Tailwind CDN has processed the base DOM before React hydration
  // and to avoid initial mounting race conditions.
  setTimeout(() => {
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
      console.error("Failed to render React application:", err);
      rootElement.innerHTML = `<div style="padding: 20px; text-align: center; color: #e11d48; font-family: sans-serif;">
        <h2>Application Error</h2>
        <p>There was an error initializing the application. Please try refreshing the page.</p>
      </div>`;
    }
  }, 100);
} else {
  console.error("Fatal: #root not found.");
}