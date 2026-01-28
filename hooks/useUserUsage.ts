import { useState, useEffect } from 'react';
import { UserUsage } from '../types';
import { WORKER_URL, getOrCreateUserId } from '../services/geminiService';

const STORAGE_KEY = 'china_menu_usage';

const DEFAULT_USAGE: UserUsage = {
  credits: 200,           // 初始 200 点
  scanCount: 0,           // 已扫描次数
  shareCount: 0,          // 累计分享次数 (上限5)
  gameWinCount: 0,        // 累计游戏次数 (上限5)
  passExpiryDate: null,
  dailyShareDate: null,   // 上次分享的日期字符串
  achievementTriggered: null
};

export const useUserUsage = () => {
  const [usage, setUsage] = useState<UserUsage>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_USAGE;
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_USAGE;
    }
  });

  // 每次 usage 变化时自动本地持久化
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  }, [usage]);

  // 计算属性：是否处于无限次通行证有效期
  const isUnlimited = usage.passExpiryDate 
    ? new Date(usage.passExpiryDate).getTime() > Date.now() 
    : false;

  // 检查day pass是否过期：每次usage变化时检查，如果过期则确保显示实际点数
  useEffect(() => {
    if (usage.passExpiryDate) {
      const expiryTime = new Date(usage.passExpiryDate).getTime();
      const now = Date.now();
      // 如果pass已过期，确保credits显示的是实际值（不是unlimited）
      if (expiryTime <= now) {
        // pass已过期，credits应该显示实际值
        // 这个逻辑在syncWithBackend中已经处理，这里只是确保状态正确
      }
    }
  }, [usage.passExpiryDate, usage.credits]);

  /**
   * 关键函数：同步后端数据
   * 识别成功、支付成功或触发动作奖励后调用
   */
  const syncWithBackend = (backendUsage: Partial<UserUsage>) => {
    setUsage(prev => {
      const newUsage = {
        ...prev,
        ...backendUsage, // 以后端返回的字段为准覆盖本地
        achievementTriggered: backendUsage.achievementTriggered || null
      };
      
      // 检查day pass是否过期：如果之前有pass但现在过期了，需要显示实际点数
      const hadPass = prev.passExpiryDate && new Date(prev.passExpiryDate).getTime() > Date.now();
      const hasPassNow = newUsage.passExpiryDate && new Date(newUsage.passExpiryDate).getTime() > Date.now();
      
      // 如果pass刚过期（从有到无），确保显示后端返回的实际点数
      if (hadPass && !hasPassNow && backendUsage.credits !== undefined) {
        newUsage.credits = backendUsage.credits;
      }
      
      return newUsage;
    });
  };

  /**
   * 处理每日分享奖励 (API 驱动)
   */
  const handleDailyShare = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    // 前端预检：是否已达总上限或今日已领
    if (usage.shareCount >= 5) {
      alert("You have reached the maximum sharing rewards (5/5).");
      return;
    }
    if (usage.dailyShareDate === today) {
      alert("You've already claimed today's share reward. Come back tomorrow!");
      return;
    }

    // 触发原生分享
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Read Chinese Menu',
          text: 'The best tool to translate Chinese menus! Get 50 free credits.',
          url: window.location.origin
        });

        // 分享动作成功后，请求后端加点
        const res = await fetch(`${WORKER_URL}/api/user-action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, action: 'share' })
        });
        
        const data = await res.json();
        if (data.userData) {
          // 如果处于day pass期间，后台加点但前端不显示变化（保持unlimited状态）
          const isPassActive = data.userData.passExpiryDate && 
            new Date(data.userData.passExpiryDate).getTime() > Date.now();
          if (isPassActive) {
            // day pass期间：后台加点，但前端不更新显示（保持unlimited）
            // 只更新其他字段如shareCount
            setUsage(prev => ({
              ...prev,
              shareCount: data.userData.shareCount,
              lastShareDate: data.userData.lastShareDate,
              dailyShareDate: new Date().toISOString().split('T')[0],
              // credits不更新，保持显示unlimited
            }));
          } else {
            // 非day pass期间：正常同步所有数据
            syncWithBackend(data.userData);
            if (data.achievementTriggered) alert("Success! +50 Credits added.");
          }
        }
      } catch (err) {
        console.log("Share cancelled or failed");
      }
    } else {
      alert("Sharing is not supported on this browser. Use a mobile device!");
    }
  };

  /**
   * 游戏获胜加点 (API 驱动)
   */
  const handleGameWin = async (userId: string) => {
    if (usage.gameWinCount >= 5) return; // 超过5次静默处理

    try {
      const res = await fetch(`${WORKER_URL}/api/user-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'game_win' })
      });
      const data = await res.json();
      if (data.userData) {
        // 如果处于day pass期间，后台加点但前端不显示变化（保持unlimited状态）
        const isPassActive = data.userData.passExpiryDate && 
          new Date(data.userData.passExpiryDate).getTime() > Date.now();
        if (isPassActive) {
          // day pass期间：后台加点，但前端不更新显示（保持unlimited）
          // 只更新其他字段如gameWinCount
          setUsage(prev => ({
            ...prev,
            gameWinCount: data.userData.gameWinCount,
            // credits不更新，保持显示unlimited
          }));
        } else {
          // 非day pass期间：正常同步所有数据
          syncWithBackend(data.userData);
        }
      }
    } catch (e) {
      console.error("Game reward failed", e);
    }
  };

  /**
   * 重置奖励标记 (动画播放完后调用)
   */
  const clearAchievement = () => {
    setUsage(prev => ({ ...prev, achievementTriggered: null }));
  };

  return {
    usage,
    isUnlimited,
    syncWithBackend,
    handleDailyShare,
    handleGameWin,
    clearAchievement
  };
};