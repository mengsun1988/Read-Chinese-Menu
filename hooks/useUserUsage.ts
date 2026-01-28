import { useState, useEffect } from 'react';
import { UserUsage } from '../types';

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

  /**
   * 关键函数：同步后端数据
   * 识别成功、支付成功或触发动作奖励后调用
   */
  const syncWithBackend = (backendUsage: Partial<UserUsage>) => {
    setUsage(prev => ({
      ...prev,
      ...backendUsage, // 以后端返回的字段为准覆盖本地
      achievementTriggered: backendUsage.achievementTriggered || null
    }));
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
        const res = await fetch('/api/user-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, action: 'share' })
        });
        
        const data = await res.json();
        if (data.userData) {
          syncWithBackend(data.userData);
          if (data.achievementTriggered) alert("Success! +50 Credits added.");
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
      const res = await fetch('/api/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'game_win' })
      });
      const data = await res.json();
      if (data.userData) {
        syncWithBackend(data.userData);
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