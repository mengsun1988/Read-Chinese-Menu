import React, { useEffect, useState } from 'react';

interface EffectLayerProps {
  trigger: string | null;
  onComplete: () => void;
}

export const EffectLayer: React.FC<EffectLayerProps> = ({ trigger, onComplete }) => {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (trigger) {
      setActive(trigger);
      // 动画持续 3 秒后自动清理状态
      const timer = setTimeout(() => {
        setActive(null);
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[3000] overflow-hidden">
      {/* 场景 1: 第 4 顿饭后的奖励喷发 (milestone_4_reward) */}
      {active === 'milestone_4_reward' && (
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 bottom-0 text-2xl animate-coin-fly"
              style={{
                left: `${45 + Math.random() * 10}%`,
                animationDelay: `${i * 0.1}s`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            >
              {['💰', '🧧', '✨', '🎁'][i % 4]}
            </div>
          ))}
          <div className="absolute inset-0 flex items-center justify-center animate-message-pop">
            <div className="bg-white/90 backdrop-blur-xl border-2 border-rose-500 px-8 py-4 rounded-[2rem] shadow-2xl">
              <p className="text-rose-600 font-black text-xl italic uppercase tracking-tighter">
                Reward Unlocked! +50 Credits
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 场景 2: 每日分享奖励 (daily_share_bonus) */}
      {active === 'daily_share_bonus' && (
        <div className="absolute inset-0 flex items-center justify-center animate-message-pop">
           <div className="bg-emerald-600 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <p className="font-black uppercase tracking-widest text-sm">Boosted! +50 Credits</p>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes coin-fly {
          0% { transform: translateY(0) scale(0.5) rotate(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(-100vh) scale(1.5) rotate(720deg); opacity: 0; }
        }
        @keyframes message-pop {
          0% { transform: scale(0.5); opacity: 0; }
          15% { transform: scale(1.1); opacity: 1; }
          85% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0; }
        }
        .animate-coin-fly {
          animation: coin-fly 2s ease-out forwards;
        }
        .animate-message-pop {
          animation: message-pop 2.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}} />
    </div>
  );
};