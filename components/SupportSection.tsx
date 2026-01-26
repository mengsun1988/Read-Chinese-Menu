import React, { useState } from 'react';
import { PayPalButton } from './PayPalButton';

interface SupportTier {
  id: string;
  name: string;
  price: string;
  amount: number;
  credits: string;
  meals: string; 
  description: string;
  icon: string;
}

export const SupportSection: React.FC<{ onPurchase: (plan: any) => void }> = ({ onPurchase }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const TIERS: SupportTier[] = [
    {
      id: 'soda',
      name: 'Buy me a Coke',
      price: '$2',
      amount: 2.00,
      credits: '150 Credits',
      meals: '(3 meals)',
      description: 'A small kick to keep us coding.',
      icon: '🥤'
    },
    {
      id: 'coffee',
      name: 'Buy me a Coffee',
      price: '$5',
      amount: 5.00,
      credits: '400 Credits',
      meals: '(8 meals)',
      description: 'Fueling our foodie explorations.',
      icon: '☕'
    },
    {
      id: 'cheesecake',
      name: 'Buy me a Cheesecake',
      price: '$9',
      amount: 9.00,
      credits: '1000 Credits',
      meals: '(20 meals)',
      description: 'The ultimate treat for hard work.',
      icon: '🍰'
    }
  ];

  const handleSuccess = (tier: SupportTier, details: any) => {
    onPurchase({ 
      id: tier.id, 
      name: tier.name, 
      credits: parseInt(tier.credits), 
      isDonation: true 
    });
    setSelectedId(null);
  };

  return (
    <section className="bg-orange-50/50 rounded-[3rem] p-10 md:p-16 lg:p-20 border border-orange-100/50 text-center space-y-12 relative overflow-hidden mx-auto max-w-6xl">
      
      <div className="space-y-4">
        <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Support Our Journey</h3>
        <p className="text-slate-500 max-w-xl mx-auto font-bold text-xs md:text-sm leading-relaxed uppercase tracking-wider">
          Help us keep the servers alive. <br/>
          In return, we'll refuel your account with credits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {TIERS.map((tier) => (
          <div 
            key={tier.id} 
            className={`bg-white/80 backdrop-blur-sm p-8 rounded-[2.5rem] border transition-all duration-300 flex flex-col items-center group relative ${
              selectedId === tier.id 
                ? 'border-orange-400 ring-4 ring-orange-100 scale-[1.02]' 
                : 'border-orange-100 shadow-sm hover:shadow-md'
            }`}
          >
            {/* Credit Badge */}
            <div className="absolute top-4 right-4 flex flex-col items-end">
              <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-md shadow-sm uppercase tracking-tighter">
                +{tier.credits}
              </span>
              <span className="text-[8px] font-black text-emerald-600 mt-1 uppercase opacity-80">
                {tier.meals}
              </span>
            </div>

            <div className="text-5xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              {tier.icon}
            </div>
            
            <h4 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-tight">{tier.name}</h4>
            <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] mb-4">{tier.price}</p>
            <p className="text-[11px] text-slate-400 font-bold mb-8 h-8 flex items-center leading-tight">
              {tier.description}
            </p>

            <div className="w-full mt-auto flex flex-col items-center">
              {selectedId === tier.id ? (
                <div className="w-full animate-in zoom-in duration-300 flex flex-col items-center">
                  <div className="w-full flex justify-center items-center relative">
                    <div className="w-full">
                      <PayPalButton 
                        amount={tier.amount.toString()} 
                        planName={tier.name} 
                        onSuccess={(details) => handleSuccess(tier, details)} 
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedId(null)}
                    className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-rose-600 transition-colors"
                  >
                    ← Back to Tiers
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setSelectedId(tier.id)}
                  className="w-full py-4 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-orange-100/50 hover:bg-rose-600 hover:shadow-rose-200 transition-all active:scale-95"
                >
                  Send Support
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
          Secure payment via PayPal
        </p>
      </div>
    </section>
  );
};