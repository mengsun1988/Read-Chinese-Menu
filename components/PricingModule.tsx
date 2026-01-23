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
    <div className="py-4 md:py-8 space-y-6 md:space-y-10">
      <div className="text-center space-y-2 px-4">
        <h3 className="text-2xl md:text-4xl font-semibold text-slate-900 uppercase tracking-tight">Upgrade Your Journey</h3>
        <p className="text-slate-500 max-w-lg mx-auto text-sm font-medium">Get unlimited access to hidden fat detection & pronunciation guides.</p>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-8 max-w-6xl mx-auto px-2 md:px-6 items-stretch">
        {PLANS.map((plan) => (
          <div 
            key={plan.id} 
            className={`modern-card p-3 md:p-10 flex flex-col justify-between transition-all duration-300 relative border-2 ${
              plan.highlight 
              ? 'bg-rose-600 border-rose-700 shadow-2xl scale-105 z-10' 
              : 'bg-white border-slate-100 hover:border-rose-300 shadow-sm'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[7px] md:text-[10px] font-semibold uppercase tracking-widest px-2 md:px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
                Most Popular
              </div>
            )}
            
            <div className="space-y-1 md:space-y-3 text-center mb-4 md:mb-8">
              <h4 className={`font-semibold text-[8px] md:text-xs uppercase tracking-widest ${plan.highlight ? 'text-white/80' : 'text-slate-400'}`}>
                {plan.name}
              </h4>
              <div className={`text-base md:text-4xl font-semibold leading-tight ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                {plan.description}
              </div>
              <div className={`text-xl md:text-7xl font-semibold ${plan.highlight ? 'text-white' : 'text-rose-600'}`}>
                {plan.price}
              </div>
            </div>
            
            <div className="space-y-2">
              {selectedPlanId === plan.id ? (
                <div className="animate-in fade-in zoom-in duration-300">
                  <PayPalButton 
                    amount={plan.amount.toString()} 
                    planName={plan.name} 
                    onSuccess={(details) => handlePaymentSuccess(plan, details)} 
                  />
                  <button 
                    onClick={() => setSelectedPlanId(null)}
                    className={`w-full mt-3 text-[8px] md:text-[10px] font-bold uppercase tracking-widest underline decoration-2 underline-offset-4 ${plan.highlight ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-rose-600'}`}
                  >
                    Cancel Selection
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`w-full py-4 rounded-2xl font-semibold text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 ${
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

      {/* Refund Policy Trigger */}
      <div className="text-center pt-4">
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