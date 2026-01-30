import './src/styles/main.css';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import './src/i18n/i18n'; // 确保 i18n 初始化在 App 渲染前

/** * --- ENVIRONMENT SETUP ---
 * Hardens the environment for the Gemini SDK and other services.
 */
const syncEnvironment = () => {
  try {
    const envSource = (import.meta as any).env || {};
    if (!(window as any).process) (window as any).process = { env: {} };
    if (!(window as any).process.env) (window as any).process.env = {};
    
    const apiKey = envSource.VITE_API_KEY || envSource.VITE_GEMINI_API_KEY || envSource.API_KEY || "";
    (window as any).process.env.API_KEY = apiKey;

    Object.keys(envSource).forEach(key => {
      (window as any).process.env[key] = String(envSource[key]);
    });
  } catch (e) {
    console.error("[Env Sync] Failed:", e);
  }
};

syncEnvironment();

/** * --- PAYPAL CONFIGURATION ---
 */
const getPayPalClientId = () => {
  const envSource = (import.meta as any).env || {};
  const clientId = envSource.VITE_PAYPAL_CLIENT_ID || (window as any).process?.env?.VITE_PAYPAL_CLIENT_ID;
  
  if (!clientId || clientId === "undefined" || clientId === "" || clientId === "null") {
    return "sb"; 
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
  // 注意：为了 LCP 性能，建议逐步弃用 Tailwind CDN 并移除这里的 setTimeout。
  // 如果必须保留，请确保延迟时间尽可能短。
  setTimeout(() => {
    try {
      const root = ReactDOM.createRoot(rootElement);
      root.render(
        <React.StrictMode>
          {/* Suspense 是处理 i18next-http-backend 异步加载翻译文件的关键 */}
          <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>}>
            <PayPalScriptProvider options={paypalOptions}>
              <App />
            </PayPalScriptProvider>
          </Suspense>
        </React.StrictMode>
      );
    } catch (err) {
      console.error("Failed to render React application:", err);
      rootElement.innerHTML = `<div style="padding: 20px; text-align: center; color: #e11d48; font-family: sans-serif;">
        <h2>Application Error</h2>
        <p>There was an error initializing the application. Please try refreshing the page.</p>
      </div>`;
    }
  }, 50); // 将 100ms 缩短为 50ms 以微调性能
} else {
  console.error("Fatal: #root not found.");
}