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

  const PLANS: Plan[] = [
    { id: 'starter', name: 'Starter Pack', price: '$4.99', amount: 4.99, description: '60 Credits' },
    { id: 'traveler', name: 'Traveler Pass', price: '$8.99', amount: 8.99, description: '7 Days Pass', highlight: true },
    { id: 'foodie', name: 'Foodie Pass', price: '$24.99', amount: 24.99, description: '30 Days Pass' }
  ];

  const handlePaymentSuccess = (plan: Plan, details: any) => {
    alert(`Thank you, ${details.payer.name?.given_name || 'Explorer'}! Your ${plan.name} is now active.`);
    onPurchase(plan);
    setSelectedPlanId(null);
  };

  return (
    <div className="py-4 md:py-16 space-y-8 md:space-y-16">
      <div className="text-center space-y-4 px-4">
        <h3 className="text-3xl md:text-5xl font-semibold text-slate-900 uppercase tracking-tight">Upgrade Your Journey</h3>
        <p className="text-slate-500 max-w-lg mx-auto text-sm md:text-base font-medium">Get unlimited access to hidden fat detection & pronunciation guides.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6 items-stretch">
        {PLANS.map((plan) => (
          <div 
            key={plan.id} 
            className={`modern-card p-8 md:p-10 flex flex-col justify-between transition-all duration-300 relative border-2 ${
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
                    className={`w-full mt-4 text-[10px] font-bold uppercase tracking-widest underline decoration-2 underline-offset-4 ${plan.highlight ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-rose-600'}`}
                  >
                    Cancel Selection
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`w-full py-5 rounded-2xl font-semibold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 ${
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