import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface EffectLayerProps {
  trigger: string | null;
  onComplete: () => void;
}

export const EffectLayer: React.FC<EffectLayerProps> = ({ trigger, onComplete }) => {
  const { t } = useTranslation();
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

  // 辅助函数：解析 Milestone 数字
  const getMilestoneNum = (str: string) => {
    const match = str.match(/\d+/);
    return match ? match[0] : "";
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[3000] overflow-hidden">
      {/* 场景 1: 里程碑奖励 */}
      {(active.includes('milestone')) && (
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
            <div className="bg-white/90 backdrop-blur-xl border-2 border-rose-500 px-8 py-4 rounded-[2rem] shadow-2xl text-center">
              <p className="text-rose-600 font-black text-xl italic uppercase tracking-tighter">
                {active.includes('milestone') && !active.includes('reward') 
                  ? t('effects.milestoneReached', { num: getMilestoneNum(active) }) 
                  : t('effects.rewardUnlocked')}
              </p>
              <p className="text-rose-400 font-bold text-sm uppercase">
                {t('effects.plusCredits', { count: 50 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 场景 2: 每日分享奖励 */}
      {(active === 'share_bonus' || active === 'daily_share_bonus') && (
        <div className="absolute inset-0 flex items-center justify-center animate-message-pop">
            <div className="bg-emerald-600 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 border-2 border-white/20">
              <span className="text-2xl">⚡</span>
              <div className="flex flex-col">
                <p className="font-black uppercase tracking-widest text-sm leading-none">{t('effects.boosted')}</p>
                <p className="font-bold text-[10px] opacity-80 mt-1">{t('effects.plusCredits', { count: 50 })}</p>
              </div>
            </div>
        </div>
      )}

      {/* 场景 3: 游戏获胜奖励 */}
      {(active === 'game_bonus' || active === 'game_win_reward') && (
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 bottom-1/4 text-2xl animate-coin-fly"
              style={{
                left: `${48 + Math.random() * 4}%`,
                animationDelay: `${i * 0.05}s`,
              }}
            >
              {['✨', '⭐', '🎊'][i % 3]}
            </div>
          ))}
          <div className="absolute inset-0 flex items-center justify-center animate-message-pop">
            <div className="bg-slate-900 border border-emerald-400/50 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex flex-col items-center">
              <span className="text-emerald-400 font-black text-2xl italic tracking-tighter">
                {t('effects.plusCredits', { count: 10 }).toUpperCase()}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mt-1">
                {t('effects.masterMindBonus')}
              </span>
            </div>
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