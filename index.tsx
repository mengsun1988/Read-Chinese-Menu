
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Environment bridge: Mapping Vite/System envs to process.env for third-party SDK compatibility
try {
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = { env: {} };
  }

  // Detect available environment sources
  const envSource = (import.meta as any).env || (window as any).process?.env || {};
  
  // Consolidate variables into window.process.env for global SDK accessibility
  Object.keys(envSource).forEach(key => {
    const value = envSource[key];
    if (value !== undefined && value !== null) {
      // Strip VITE_ prefix for internal consistency if present
      const cleanKey = key.replace('VITE_', '');
      (window as any).process.env[cleanKey] = String(value);
      (window as any).process.env[key] = String(value);
    }
  });

  // Specifically ensure PAYPAL_CLIENT_ID is prioritized. Default to "sb" for testing.
  if (!(window as any).process.env.PAYPAL_CLIENT_ID || (window as any).process.env.PAYPAL_CLIENT_ID === 'undefined') {
    (window as any).process.env.PAYPAL_CLIENT_ID = (window as any).process.env.VITE_PAYPAL_CLIENT_ID || "sb";
  }
} catch (e) {
  console.warn("Environment bridge warning:", e);
}

// Global error suppression for common cross-origin preview issues
window.addEventListener('error', (event) => {
  if (event.message?.includes('window host') || event.message?.includes('Script error')) {
    event.preventDefault(); // Prevent these from bubbling and potentially crashing some environments
    console.warn('Suppressed cross-origin script error:', event.message);
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
