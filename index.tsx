import './src/styles/main.css';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import './src/i18n/i18n';

/**
 * --- Minimal process.env shim for Gemini SDK ---
 */
try {
  if (!(window as any).process) {
    (window as any).process = { env: {} };
  } else if (!(window as any).process.env) {
    (window as any).process.env = {};
  }

  // 仅注入 Gemini 所需的关键变量
  (window as any).process.env.API_KEY =
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.VITE_API_KEY ||
    "";
} catch (e) {
  console.warn("[Env Shim] process.env injection failed", e);
}

/**
 * --- PAYPAL CONFIGURATION ---
 */
const paypalOptions = {
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "sb",
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
      {/* 将 fallback 设为 null。
        这样在 React 准备就绪前，用户会持续看到 index.html 中定义的原生 Loading 动画，
        避免了从 "原生 Loading" 跳到 "Reading menu..." 再跳到 "App 内容" 的多次闪烁。
      */}
      <Suspense fallback={null}>
        <PayPalScriptProvider options={paypalOptions}>
          <App />
        </PayPalScriptProvider>
      </Suspense>
    </React.StrictMode>
  );
} else {
  console.error("Fatal: #root not found.");
}