import React, { useState } from 'react';
import { RefundModal } from './RefundModal';
import { PayPalButton } from './PayPalButton';

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  amount: number;
  highlight?: boolean;
}

export const PricingModule: React.FC<{ onPurchase: (plan: Plan) => void }> = ({ onPurchase }) => {
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // 保持今天最新的 3/7/15 天价格体系
  const PLANS: Plan[] = [
    { id: '3-day', name: '3-Day Pass', price: '$3.99', amount: 3.99, description: '3 Days Pass' },
    { id: '7-day', name: '7-Day Pass', price: '$7.99', amount: 7.99, description: '7 Days Pass', highlight: true },
    { id: '15-day', name: '15-Day Pass', price: '$15.99', amount: 15.99, description: '15 Days Pass' }
  ];

  const handlePaymentSuccess = (plan: Plan, details: any) => {
    alert(`Thank you, ${details.payer.name?.given_name || 'Explorer'}! Your ${plan.name} is now active.`);
    onPurchase(plan);
    setSelectedPlanId(null);
  };

  return (
    <div className="py-4 md:py-16 space-y-8 md:space-y-12">
      {/* 头部：采用昨天的字体大小规范 */}
      <div className="text-center space-y-4 px-4">
        <h3 className="text-3xl md:text-5xl font-semibold text-slate-900 uppercase tracking-tight">Upgrade Your Journey</h3>
        <p className="text-slate-500 max-w-lg mx-auto text-sm md:text-base font-medium">
          Get unlimited access to hidden fat detection & pronunciation guides.
        </p>
      </div>

      {/* 栅格：保持昨天的间距和最大宽度 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6 items-stretch">
        {PLANS.map((plan) => (
          <div 
            key={plan.id} 
            className={`modern-card rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between transition-all duration-300 relative border-2 ${
              plan.highlight 
              ? 'bg-rose-600 border-rose-700 shadow-2xl md:scale-105 z-10' 
              : 'bg-white border-slate-100 hover:border-rose-300 shadow-sm'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-semibold uppercase tracking-widest px-6 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                Most Popular
              </div>
            )}
            
            <div className="space-y-3 text-center mb-10">
              <h4 className={`font-semibold text-xs uppercase tracking-widest ${plan.highlight ? 'text-white/80' : 'text-slate-400'}`}>
                {plan.name}
              </h4>
              <div className={`text-3xl md:text-4xl font-semibold leading-tight ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                {plan.description}
              </div>
              <div className={`text-5xl md:text-6xl font-semibold ${plan.highlight ? 'text-white' : 'text-rose-600'}`}>
                {plan.price}
              </div>
            </div>
            
            <div className="space-y-4">
              {selectedPlanId === plan.id ? (
                <div className="animate-in fade-in zoom-in duration-300 min-h-[150px]">
                  <PayPalButton 
                    amount={plan.amount.toString()} 
                    planName={plan.name} 
                    onSuccess={(details) => handlePaymentSuccess(plan, details)} 
                  />
                  <button 
                    onClick={() => setSelectedPlanId(null)}
                    className={`w-full mt-4 text-[10px] font-bold uppercase tracking-widest underline decoration-2 underline-offset-4 ${
                      plan.highlight ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-rose-600'
                    }`}
                  >
                    Cancel Selection
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setSelectedPlanId(plan.id)}
                  // 这里的 py-5 是昨天的规范尺寸
                  className={`w-full py-5 rounded-full font-semibold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 ${
                    plan.highlight 
                      ? 'bg-white text-rose-600 hover:bg-slate-50' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Choose {plan.name}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 底部：回归昨天的间距和字号 */}
      <div className="text-center pt-8">
        <button 
          onClick={() => setIsRefundModalOpen(true)}
          className="text-[10px] font-semibold text-slate-400 hover:text-rose-600 uppercase tracking-[0.2em] transition-colors underline decoration-slate-200 underline-offset-4 decoration-2"
        >
          Refund Policy
        </button>
      </div>

      <RefundModal 
        isOpen={isRefundModalOpen} 
        onClose={() => setIsRefundModalOpen(false)} 
      />
    </div>
  );
};