import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { RefundModal } from './RefundModal';
// 修改：将 PayPalButton 改为延迟加载
const PayPalButton = lazy(() => import('./PayPalButton').then(module => ({ default: module.PayPalButton })));
import { WORKER_URL, getOrCreateUserId } from '../services/geminiService';
import { useTranslation } from 'react-i18next';

interface Plan {
  id: string;
  nameKey: string;
  price: string;
  descriptionKey: string;
  amount: number;
  highlight?: boolean;
}

export const PricingModule: React.FC<{ onPurchase: (updatedUsage: any) => void; onLater?: () => void }> = ({ onPurchase, onLater }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false); 
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>('7-day');
  const [isVerifying, setIsVerifying] = useState(false); 
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const middleCardRef = useRef<HTMLDivElement>(null);

  const PLANS: Plan[] = [
    { id: '3-day', nameKey: 'pricing.threeDayPass.name', price: '$3.99', amount: 3.99, descriptionKey: 'pricing.threeDayPass.description' },
    { id: '7-day', nameKey: 'pricing.sevenDayPass.name', price: '$7.99', amount: 7.99, descriptionKey: 'pricing.sevenDayPass.description', highlight: true },
    { id: '15-day', nameKey: 'pricing.fifteenDayPass.name', price: '$15.99', amount: 15.99, descriptionKey: 'pricing.fifteenDayPass.description' }
  ];

  useEffect(() => {
    if (isExpanded) {
      const scrollTimer = setTimeout(() => {
        if (middleCardRef.current && !selectedPlanId) {
          middleCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 300);
      return () => clearTimeout(scrollTimer);
    }
  }, [isExpanded, selectedPlanId]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || selectedPlanId || !isExpanded) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;
      let closestId = activeId;
      let minDistance = Infinity;

      container.querySelectorAll('[data-plan-id]').forEach((el) => {
        const rect = el.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const distance = Math.abs(centerX - cardCenterX);
        if (distance < minDistance) {
          minDistance = distance;
          closestId = el.getAttribute('data-plan-id');
        }
      });
      if (closestId !== activeId) setActiveId(closestId);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeId, selectedPlanId, isExpanded]);

  const handlePaymentSuccess = async (plan: Plan, orderDetails: any) => {
    setIsVerifying(true);
    try {
      const response = await fetch(`${WORKER_URL}/api/verify_order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: getOrCreateUserId(), orderId: orderDetails.id, planId: plan.id })
      });
      if (!response.ok) throw new Error('Verification failed');
      const result = await response.json();
      if (result.success && result.usage) onPurchase(result.usage);
    } catch (error) {
      alert(t('common.connectionError'));
    } finally {
      setIsVerifying(false);
      setSelectedPlanId(null);
    }
  };

  return (
    <div className="py-2 space-y-4 max-w-full">
      {!isExpanded ? (
        <button 
          onClick={() => setIsExpanded(true)}
          className="w-full bg-rose-600 border border-rose-500/50 p-8 rounded-[3rem] flex items-center gap-6 shadow-md shadow-rose-100/50 active:scale-[0.98] hover:shadow-lg hover:shadow-rose-200/40 hover:-translate-y-1 transition-all group"
        >
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:rotate-12 transition-transform duration-300">
            <span className="text-3xl">💎</span>
          </div>
          <div className="text-left flex-1">
            <h3 className="text-white text-xl font-black tracking-tight uppercase leading-none">{t('home.wantDaypass')}</h3>
            <p className="text-rose-50 text-[11px] font-bold mt-1">{t('home.unlockFeatures')}</p>
          </div>
          <span className="text-white/50 font-black text-xl group-hover:translate-y-1 transition-transform">↓</span>
        </button>
      ) : (
        <div className="animate-in fade-in slide-in-from-top-2 duration-500 space-y-6 md:space-y-10">
          <div className="text-center space-y-2 px-6 relative pt-4">
            <h3 className="text-2xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">{t('home.upgradeJourney')}</h3>
            <p className="text-slate-500 max-w-lg mx-auto text-[10px] md:text-xs font-bold uppercase tracking-wide">
              {t('home.unlimitedAccess')}
            </p>
            <button 
              onClick={onLater || (() => setIsExpanded(false))}
              className="absolute top-0 right-6 text-slate-300 hover:text-slate-900 font-black text-lg transition-colors"
            >✕</button>
          </div>

          <div className="relative w-full">
            <div 
              ref={scrollRef}
              className={`flex flex-row md:grid md:grid-cols-3 gap-5 no-scrollbar overflow-x-auto px-16 md:px-6 -mx-10 md:mx-auto py-12 -my-12 ${selectedPlanId ? '' : 'snap-x snap-mandatory'}`}
            >
              <div className="shrink-0 w-4 md:hidden" />
              {PLANS.map((plan) => {
                const isActive = activeId === plan.id || selectedPlanId === plan.id;
                return (
                  <div 
                    key={plan.id}
                    data-plan-id={plan.id}
                    ref={plan.id === '7-day' ? middleCardRef : null}
                    className={`shrink-0 w-[230px] md:w-full modern-card rounded-[3rem] p-8 flex flex-col justify-between transition-all duration-500 ease-out relative border-2 ${selectedPlanId === null ? 'snap-center' : ''} ${plan.highlight ? 'bg-rose-600 border-rose-700 z-10 text-white' : 'bg-white border-slate-100 text-slate-900'} ${isActive ? 'ring-[6px] ring-rose-200 border-rose-400 scale-100 opacity-100 shadow-xl' : 'scale-90 opacity-40 blur-[0.3px] shadow-sm'} ${selectedPlanId && selectedPlanId !== plan.id ? 'hidden md:flex opacity-0' : ''}`}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
                        {t('pricing.sevenDayPass.highlightText')}
                      </div>
                    )}
                    <div className="space-y-2 text-center mb-8">
                      <h4 className={`font-black text-[10px] uppercase tracking-widest ${plan.highlight ? 'text-white/70' : 'text-slate-400'}`}>
                        {t(plan.nameKey)}
                      </h4>
                      <div className={`text-xl md:text-3xl font-black leading-tight tracking-tighter ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                        {t(plan.descriptionKey)}
                      </div>
                      <div className={`text-3xl md:text-5xl font-black tracking-tighter ${plan.highlight ? 'text-white' : 'text-rose-600'}`}>
                        {plan.price}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {selectedPlanId === plan.id ? (
                        <div className="animate-in fade-in zoom-in duration-500 min-h-[160px] relative z-[100]">
                          {isVerifying ? (
                            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                              <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                              <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">{t('common.verifyingPayment')}</p>
                            </div>
                          ) : (
                            <>
                              {/* 使用 Suspense 包裹 lazy 加载的组件 */}
                              <Suspense fallback={<div className="h-24 w-full bg-slate-50/10 animate-pulse rounded-2xl" />}>
                                <PayPalButton amount={plan.amount.toString()} planName={t(plan.nameKey)} onSuccess={(details) => handlePaymentSuccess(plan, details)} />
                              </Suspense>
                              <button onClick={() => setSelectedPlanId(null)} className={`w-full mt-4 text-[9px] font-black uppercase tracking-widest underline underline-offset-4 ${plan.highlight ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-rose-600'}`}>
                                {t('common.cancelSelection')}
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <button onClick={() => setSelectedPlanId(plan.id)} className={`w-full py-4 rounded-full font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'} ${plan.highlight ? 'bg-white text-rose-600 hover:bg-slate-50' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                          {t('common.selectPass')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="shrink-0 w-4 md:hidden" />
            </div>
          </div>

          <div className="text-center pt-2">
            <button onClick={() => setIsRefundModalOpen(true)} className="text-[9px] font-black text-slate-300 hover:text-rose-600 uppercase tracking-[0.2em] transition-colors underline decoration-slate-100 underline-offset-4">
              {t('pricing.refundPolicy')}
            </button>
          </div>
        </div>
      )}
      <RefundModal isOpen={isRefundModalOpen} onClose={() => setIsRefundModalOpen(false)} />
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};