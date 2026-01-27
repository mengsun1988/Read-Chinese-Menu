import React, { useState, useEffect, useRef } from 'react';
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
  const [activeId, setActiveId] = useState<string | null>('coffee'); 
  const scrollRef = useRef<HTMLDivElement>(null);
  const middleCardRef = useRef<HTMLDivElement>(null);

  const TIERS: SupportTier[] = [
    { id: 'soda', name: 'Buy me a Coke', price: '$2', amount: 2.0, credits: '150 Credits', meals: '(3 meals)', description: 'A small kick to keep us coding.', icon: '🥤' },
    { id: 'coffee', name: 'Buy me a Coffee', price: '$5', amount: 5.0, credits: '400 Credits', meals: '(8 meals)', description: 'Fueling our foodie explorations.', icon: '☕' },
    { id: 'cheesecake', name: 'Buy me a Cheesecake', price: '$9', amount: 9.0, credits: '1000 Credits', meals: '(20 meals)', description: 'The ultimate treat for hard work.', icon: '🍰' }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (middleCardRef.current && !selectedId) {
        middleCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedId]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || selectedId) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;

      let closestId = activeId;
      let minDistance = Infinity;

      container.querySelectorAll('[data-tier-id]').forEach((el) => {
        const rect = el.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const distance = Math.abs(centerX - cardCenterX);

        if (distance < minDistance) {
          minDistance = distance;
          closestId = el.getAttribute('data-tier-id');
        }
      });

      if (closestId !== activeId) setActiveId(closestId);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeId, selectedId]);

  const handleSuccess = (tier: SupportTier, details: any) => {
    onPurchase({ id: tier.id, name: tier.name, credits: parseInt(tier.credits), isDonation: true });
    setSelectedId(null);
  };

  return (
    <section className="bg-orange-50/50 rounded-[3rem] p-8 md:p-16 border border-orange-100/50 text-center space-y-10 relative mx-auto max-w-full lg:max-w-6xl">
      <div className="space-y-4 px-6">
        <h3 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Support Our Journey</h3>
        <p className="text-slate-500 max-w-xl mx-auto font-bold text-[10px] md:text-sm leading-relaxed uppercase tracking-wider">
          Help us keep the servers alive. <br/> In return, we'll refuel your account with credits.
        </p>
      </div>

      <div className="relative w-full">
        <div 
          ref={scrollRef}
          className={`flex flex-row md:grid md:grid-cols-3 gap-6 no-scrollbar overflow-x-auto px-20 md:px-0 -mx-8 md:mx-0 py-12 -my-12 ${
            selectedId ? '' : 'snap-x snap-mandatory'
          }`}
        >
          <div className="shrink-0 w-4 md:hidden" />
          
          {TIERS.map((tier) => {
            const isActive = activeId === tier.id || selectedId === tier.id;
            
            return (
              <div 
                key={tier.id} 
                data-tier-id={tier.id}
                ref={tier.id === 'coffee' ? middleCardRef : null}
                className={`shrink-0 w-[210px] md:w-full bg-white/95 backdrop-blur-md p-6 rounded-[2.5rem] border transition-all duration-500 ease-out flex flex-col items-center group relative ${
                  selectedId === null ? 'snap-center' : ''
                } ${
                  isActive 
                    ? 'border-orange-400 ring-[6px] ring-orange-100 scale-100 opacity-100 z-10 shadow-xl' 
                    : 'border-orange-100 scale-90 opacity-50 shadow-sm'
                } ${
                  selectedId && selectedId !== tier.id ? 'hidden md:flex opacity-0' : ''
                }`}
              >
                {/* Status Badge Area */}
                <div className="h-6 mb-2">
                  {tier.id === 'coffee' && (
                    <div className={`bg-orange-600 text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                      RECOMMENDED
                    </div>
                  )}
                </div>

                {/* Credit Info Label - Centered for better balance */}
                <div className="flex flex-col items-center mb-4">
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-lg shadow-sm uppercase tracking-tight">
                    +{tier.credits}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 mt-1 uppercase tracking-widest">{tier.meals}</span>
                </div>

                {/* Main Content */}
                <div className={`text-5xl mb-4 transition-transform duration-500 ${isActive ? 'scale-110 drop-shadow-md' : 'scale-90'}`}>
                  {tier.icon}
                </div>
                
                <h4 className="text-sm font-black text-slate-900 mb-1 uppercase tracking-tight leading-none">{tier.name}</h4>
                <p className="text-2xl font-black text-orange-600 uppercase tracking-tighter mb-4">{tier.price}</p>
                
                <p className="text-[10px] text-slate-400 font-bold mb-6 h-12 flex items-center justify-center leading-relaxed px-2 text-center">
                  {tier.description}
                </p>

                {/* Action Area */}
                <div className="w-full mt-auto">
                  {selectedId === tier.id ? (
                    <div className="w-full animate-in zoom-in duration-500 min-h-[140px] flex flex-col items-center justify-center">
                      <div className="w-full transform scale-90 origin-top">
                        <PayPalButton 
                          amount={tier.amount.toString()} 
                          planName={tier.name} 
                          onSuccess={(details) => handleSuccess(tier, details)} 
                        />
                      </div>
                      <button 
                        onClick={() => setSelectedId(null)} 
                        className="mt-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-orange-600 transition-colors py-2"
                      >
                        ← Back
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setSelectedId(tier.id)}
                      className={`w-full py-4 bg-slate-900 text-white rounded-full font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:bg-orange-600 transition-all active:scale-95 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
                    >
                      Send Support
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div className="shrink-0 w-4 md:hidden" />
        </div>
      </div>

      <div className="pt-4">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
          Secure payment via PayPal
        </p>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </section>
  );
};