import React, { useState, useEffect, useRef } from 'react';
import { PayPalButton } from './PayPalButton';
import { WORKER_URL, getOrCreateUserId } from '../services/geminiService';

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

export const SupportSection: React.FC<{ 
  onPurchase: (updatedUsage: any) => void; // 修正：接收后端返回的最新状态
  credits: number;
}> = ({ onPurchase, credits }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>('coffee');
  const [isVerifying, setIsVerifying] = useState(false); // 新增：验证状态
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const middleCardRef = useRef<HTMLDivElement>(null);

  const TIERS: SupportTier[] = [
    { id: 'soda', name: 'Buy me a Coke', price: '$2', amount: 2.0, credits: '150 Credits', meals: '(3 meals)', description: 'A small kick to keep us coding.', icon: '🥤' },
    { id: 'coffee', name: 'Buy me a Coffee', price: '$5', amount: 5.0, credits: '400 Credits', meals: '(8 meals)', description: 'Fueling our foodie explorations.', icon: '☕' },
    { id: 'cheesecake', name: 'Buy me a Cheesecake', price: '$9', amount: 9.0, credits: '1000 Credits', meals: '(20 meals)', description: 'The ultimate treat for hard work.', icon: '🍰' }
  ];

  // 1. 实现滚动检测
  useEffect(() => {
    const observerOptions = {
      root: scrollRef.current,
      threshold: 0.6,
      rootMargin: '0px -25% 0px -25%'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-id');
          setActiveId(id);
        }
      });
    }, observerOptions);

    const cards = document.querySelectorAll('.support-card');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  // 2. 初始化默认居中
  useEffect(() => {
    const timer = setTimeout(() => {
      if (middleCardRef.current && credits < 50) {
        middleCardRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest', 
          inline: 'center' 
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [credits]);

  /**
   * 关键闭环逻辑：支付成功后通知后端增加点数
   */
  const handleSuccess = async (tier: SupportTier, orderDetails: any) => {
    setIsVerifying(true);
    try {
      const response = await fetch(`${WORKER_URL}/api/verify_order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getOrCreateUserId(),
          orderId: orderDetails.id,
          planId: tier.id, // 后端通过 ID 判断增加点数还是天数
          isDonation: true // 标记这是捐赠点数充值
        })
      });

      if (!response.ok) throw new Error('Credit update failed');
      
      const result = await response.json();
      
      if (result.success && result.usage) {
        // 同步到全局 State
        onPurchase(result.usage);
      }
    } catch (error) {
      console.error("Support update error:", error);
      alert("Support received! But credit sync failed. Please contact us.");
    } finally {
      setIsVerifying(false);
      setSelectedId(null);
    }
  };

  return (
    <section id="support-section" className="bg-orange-50/50 rounded-[3rem] p-8 md:p-16 border border-orange-100/50 text-center space-y-10 relative mx-auto max-w-full lg:max-w-6xl overflow-hidden">
      <div className="space-y-4 px-6">
        <h3 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Support Our Journey</h3>
        <p className="text-slate-500 max-w-xl mx-auto font-bold text-[10px] md:text-sm leading-relaxed uppercase tracking-wider">
          Help us keep the servers alive. <br/> In return, we'll refuel your account with credits.
        </p>
      </div>

      <div className="relative w-full">
        <div 
          ref={scrollRef}
          className="flex flex-row md:grid md:grid-cols-3 gap-4 md:gap-6 no-scrollbar overflow-x-auto px-[20vw] md:px-0 py-12 -my-12 snap-x snap-mandatory"
        >
          {TIERS.map((tier) => {
            const isCenter = activeId === tier.id;
            const isSelected = selectedId === tier.id;
            
            return (
              <div 
                key={tier.id} 
                data-id={tier.id}
                ref={tier.id === 'coffee' ? middleCardRef : null}
                className={`support-card snap-center shrink-0 w-[240px] md:w-full bg-white/95 backdrop-blur-md p-6 rounded-[2.5rem] border transition-all duration-500 ease-out flex flex-col items-center group relative ${
                  isCenter 
                    ? 'border-orange-400 z-10 shadow-xl scale-110 opacity-100' 
                    : 'border-orange-100 shadow-sm opacity-50 scale-90'
                } ${isSelected ? 'ring-[6px] ring-orange-100' : ''}`}
              >
                <div className="h-6 mb-2">
                  {tier.id === 'coffee' && (
                    <div className={`bg-orange-600 text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg transition-opacity duration-300 ${isCenter ? 'opacity-100' : 'opacity-0'}`}>
                      RECOMMENDED
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center mb-4">
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-lg shadow-sm uppercase tracking-tight">
                    +{tier.credits}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 mt-1 uppercase tracking-widest">{tier.meals}</span>
                </div>

                <div className={`text-5xl mb-4 transition-transform duration-700 ${isCenter ? 'scale-110 rotate-3' : 'scale-90 opacity-50'}`}>
                  {tier.icon}
                </div>
                
                <h4 className="text-sm font-black text-slate-900 mb-1 uppercase tracking-tight leading-none">{tier.name}</h4>
                <p className="text-2xl font-black text-orange-600 uppercase tracking-tighter mb-4">{tier.price}</p>
                
                <p className="text-[10px] text-slate-400 font-bold mb-6 h-12 flex items-center justify-center leading-relaxed px-2 text-center">
                  {tier.description}
                </p>

                <div className="w-full mt-auto">
                  {selectedId === tier.id ? (
                    <div className="w-full animate-in zoom-in duration-300 min-h-[140px] flex flex-col items-center justify-center">
                      {isVerifying ? (
                        <div className="flex flex-col items-center py-4 space-y-3">
                          <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-orange-600 animate-pulse">Syncing Credits...</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-full max-w-[300px] mx-auto">
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
                        </>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={() => setSelectedId(tier.id)}
                      className="w-full py-4 bg-slate-900 text-white rounded-full font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-30"
                      disabled={!isCenter && window.innerWidth < 768}
                    >
                      Send Support
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
          Secure payment via PayPal
        </p>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; } 
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </section>
  );
};