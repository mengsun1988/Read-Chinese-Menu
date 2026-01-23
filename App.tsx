import React, { useState, useRef, useEffect } from 'react';
import { AppStatus, Dish, UserUsage, RecognitionMode, StoreResult } from './types';
import { processMenuImage, processStorefrontImage } from './services/geminiService';
import { DishCard } from './components/DishCard';
import { LoadingScreen } from './components/LoadingScreen';
import { CameraIcon, WarningIcon } from './components/Icons';
import { DishDetailModal } from './components/DishDetailModal';
import { WaiterCard } from './components/WaiterCard';
import { AboutUs } from './components/AboutUs';
import { Reviews } from './components/Reviews';
import { PricingModule } from './components/PricingModule';
import { SupportSection } from './components/SupportSection';
import { A2HSManager } from './components/A2HSManager';
import { StoreCard } from './components/StoreCard';
import { StaffHelperModal } from './components/StaffHelperModal';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModals';

const STORAGE_KEY = 'rmc_user_usage_v3';
const TIP_STORAGE_KEY = 'rmc_hide_app_tip_v3';

/** 🔴 改这里：换成你自己的 Sandbox Client ID */
const PAYPAL_CLIENT_ID = 'AdY7cjJGhxSVjZOPZr-LoHhX8JHtyQfNjmr6I8HjO4cv3cqW_U2zr1hpxa67nU8o4i6GoH0sFIh0P1aS';

const getBeijingDate = () => {
  const d = new Date();
  const beijingTime = new Date(d.getTime() + (8 * 60 * 60 * 1000));
  return beijingTime.toISOString().split('T')[0];
};

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [mode, setMode] = useState<RecognitionMode>(RecognitionMode.MENU);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [storeResult, setStoreResult] = useState<StoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showAppTip, setShowAppTip] = useState(false);
  const [showStaffHelper, setShowStaffHelper] = useState(false);
  const [legalView, setLegalView] = useState<'privacy' | 'tos' | null>(null);

  /** ✅ PayPal SDK 注入 */
  useEffect(() => {
    if (!showPricing) return;

    if ((window as any).paypal) {
      renderPaypal();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=AdY7cjJGhxSVjZOPZr-LoHhX8JHtyQfNjmr6I8HjO4cv3cqW_U2zr1hpxa67nU8o4i6GoH0sFIh0P1aS&currency=USD&intent=capture`;
    script.async = true;
    script.onload = renderPaypal;
    document.body.appendChild(script);

    function renderPaypal() {
      const paypal = (window as any).paypal;
      if (!paypal) return;

      paypal.Buttons({
        createOrder: (_: any, actions: any) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: { value: '5.00' }
              }
            ]
          });
        },
        onApprove: async (_: any, actions: any) => {
          await actions.order.capture();
          alert('Payment successful (sandbox)');
        },
        onError: (err: any) => {
          console.error('PayPal error', err);
          alert('Payment failed');
        }
      }).render('#paypal-button-container');
    }
  }, [showPricing]);

  const [usage, setUsage] = useState<UserUsage>(() => {
    const todayStr = getBeijingDate();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserUsage;
        if (parsed.lastResetDate !== todayStr) {
          return { ...parsed, freeCredits: 15, lastResetDate: todayStr };
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Usage parsing failed", e);
    }
    return { freeCredits: 15, paidCredits: 0, lastResetDate: todayStr };
  });

  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [waiterContext, setWaiterContext] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* —— 以下内容未改动 —— */

  return (
    <div className="min-h-screen selection:bg-rose-600 selection:text-white pb-0 overflow-x-hidden">
      <A2HSManager />

      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        {/* ……中间内容原封不动…… */}
      </div>

      <Footer
        onMenuScan={() => {}}
        onStreetScan={() => {}}
        onPricing={() => setShowPricing(true)}
        onPrivacy={() => setLegalView('privacy')}
        onTos={() => setLegalView('tos')}
      />
