import React, { useState } from 'react';
import { RefundModal } from './RefundModal';
import { PayPalButton } from './PayPalButton';

interface Plan {
  id: string;
  name: string;
  price: string;
  amount: number;
  credits?: number;
  description: string;
  icon?: string;
  type: 'donation' | 'pass';
}

interface Props {
  onPurchase: (plan: Plan) => void;
  onLater?: () => void;
}

export const PricingModule: React.FC<Props> = ({ onPurchase, onLater }) => {
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showPasses, setShowPasses] = useState(false);

  // 1. 社交捐赠模式 (符合 "Buy me a..." 逻辑)
  const DONATIONS: Plan[] = [
    { id: 'bagel', name: 'Buy me a Bagel', price: '$1.99', amount: 1.99, credits: 150, description: '3 Full Meals', icon: '🥯', type: 'donation' },
    { id: 'coffee', name: 'Buy me a Coffee', price: '$4.99', amount: 4.99, credits: 450, description: '9 Full Meals', icon: '☕', type: 'donation' },
    { id: 'cake', name: 'Buy me a Cake', price: '$9.99', amount: 9.99, credits: 1000, description: '20+ Full Meals', icon: '🍰', type: 'donation' },
  ];

  // 2. 无限次通行证 (折叠展示)
  const PASSES: Plan[] = [
    { id: '3day', name: '3 Days Pass', price: '$5.99', amount: 5.99, description: 'Unlimited Scans', type: 'pass' },
    { id: '7day', name: '7 Days Pass', price: '$8.99', amount: 8.99, description: 'Unlimited Scans', type: 'pass' },
  ];

  const handlePaymentSuccess = (plan: Plan, details: any) => {
    onPurchase(plan);
    setSelectedPlanId(null);
  };

  const renderPlanCard = (plan: Plan) => {
    const isSelected = selectedPlanId === plan.id;
    
    return (
      <div 
        key={plan.id}
        className={`relative transition-all duration-300 rounded-[2rem] border-2 ${
          isSelected 
            ? 'bg-white border-rose-500 shadow-xl p-6' 
            : 'bg-slate-50 border-transparent hover:border-slate-200 p-4'
        }`}
      >
        {!isSelected ? (
          <button 
            onClick={() => setSelectedPlanId(plan.id)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl group-hover:rotate-12 transition-transform">{plan.icon || '🎟️'}</span>
              <div className="text-left">
                <p className="text-sm font-black text-slate-900">{plan.name}</p>
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">{plan.description}</p>
              </div>
            </div>
            <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl font-black text-xs">
              {plan.price}
            </div>
          </button>
        ) : (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-4">
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">{plan.name}</p>
              <h4 className="text-2xl font-black text-slate-900">{plan.price}</h4>
            </div>
            
            <PayPalButton 
              amount={plan.amount.toString()} 
              planName={plan.name} 
              onSuccess={(details) => handlePaymentSuccess(plan, details)} 
            />
            
            <button 
              onClick={() => setSelectedPlanId(null)}
              className="w-full mt-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
            >
              Back to Menu
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[3rem] p-6 md:p-10 shadow-2xl border border-slate-100 max-w-sm mx-auto animate-in fade-in zoom-in duration-500">
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Support our AI</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Unlock more meals & help us grow</p>
      </div>

      {/* 1. Donation List */}
      <div className="space-y-3 mb-6">
        {DONATIONS.map(renderPlanCard)}
      </div>

      {/* 2. Collapsible Day Pass Section */}
      <div className="mb-8">
        {!showPasses ? (
          <button 
            onClick={() => setShowPasses(true)}
            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:border-rose-300 hover:text-rose-500 transition-all"
          >
            + Need Unlimited Day Pass?
          </button>
        ) : (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between px-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time-limited Passes</span>
              <button onClick={() => setShowPasses(false)} className="text-[9px] font-black text-rose-600 uppercase underline">Hide</button>
            </div>
            {PASSES.map(renderPlanCard)}
          </div>
        )}
      </div>

      {/* 3. Footer Actions */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex justify-center gap-8">
          <button 
            onClick={onLater} 
            className="text-slate-300 hover:text-slate-500 font-black text-[10px] uppercase tracking-widest transition-colors"
          >
            Not now
          </button>
          <button 
            onClick={() => setIsRefundModalOpen(true)}
            className="text-slate-300 hover:text-slate-500 font-black text-[10px] uppercase tracking-widest transition-colors"
          >
            Refund Policy
          </button>
        </div>
        
        <div className="flex items-center gap-2 opacity-20">
          <div className="w-1 h-1 bg-slate-900 rounded-full" />
          <p className="text-[8px] font-bold text-slate-900 uppercase">Secure Payment via PayPal</p>
          <div className="w-1 h-1 bg-slate-900 rounded-full" />
        </div>
      </div>

      <RefundModal 
        isOpen={isRefundModalOpen} 
        onClose={() => setIsRefundModalOpen(false)} 
      />
    </div>
  );
};