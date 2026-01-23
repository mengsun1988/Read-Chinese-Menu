
import React, { useState } from 'react';
import { PayPalButton } from './PayPalButton';

interface SupportTier {
  id: string;
  name: string;
  price: string;
  amount: number;
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
      description: 'A small kick to keep us coding.',
      icon: '🥤'
    },
    {
      id: 'coffee',
      name: 'Buy me a Coffee',
      price: '$5',
      amount: 5.00,
      description: 'Fueling our foodie explorations.',
      icon: '☕'
    },
    {
      id: 'cheesecake',
      name: 'Buy me a Cheesecake',
      price: '$9',
      amount: 9.00,
      description: 'The ultimate treat for our hard work.',
      icon: '🍰'
    }
  ];

  const handleSuccess = (tier: SupportTier, details: any) => {
    alert(`You're amazing! Thank you so much for the ${tier.name}. Your kindness fuels our mission!`);
    onPurchase({ id: tier.id, name: tier.name, isDonation: true });
    setSelectedId(null);
  };

  return (
    <section className="bg-orange-50/50 rounded-[3rem] p-10 md:p-20 border border-orange-100/50 text-center space-y-12">
      <div className="space-y-4">
        <h3 className="text-3xl md:text-5xl font-semibold text-slate-900 tracking-tight">Support Our Journey</h3>
        <p className="text-slate-500 max-w-xl mx-auto font-medium text-sm md:text-base leading-relaxed">
          "East meets West" — We're a small team building a bridge to the flavors of China. Your support keeps the servers running and the code fresh.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {TIERS.map((tier) => (
          <div 
            key={tier.id} 
            className="bg-white/80 backdrop-blur-sm p-8 rounded-[2.5rem] border border-orange-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center group"
          >
            <div className="text-5xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              {tier.icon}
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-1">{tier.name}</h4>
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-4">{tier.price}</p>
            <p className="text-xs text-slate-500 font-medium mb-8 h-8 flex items-center">{tier.description}</p>

            {selectedId === tier.id ? (
              <div className="w-full animate-in zoom-in duration-300 min-h-[120px]">
                <PayPalButton 
                  amount={tier.amount.toString()} 
                  planName={tier.name} 
                  onSuccess={(details) => handleSuccess(tier, details)} 
                />
                <button 
                  onClick={() => setSelectedId(null)}
                  className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest underline underline-offset-4"
                >
                  Back
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setSelectedId(tier.id)}
                className="w-full py-4 bg-slate-900 text-white rounded-full font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100/50 hover:bg-slate-800 transition-all active:scale-95"
              >
                Send Support
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
        Every bit of support fuels our passion for exploration
      </p>
    </section>
  );
};
