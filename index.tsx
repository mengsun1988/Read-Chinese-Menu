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
 * 统一在顶层管理，App.tsx 内部不再声明
 */
const paypalOptions = {
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "default-paypal-client-id",
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
      {/* fallback 设为 null 是非常聪明的做法。
        它能无缝承接 index.html 里的原生 LCP 渲染，直到 i18n 资源和 JS 逻辑全部就绪。
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