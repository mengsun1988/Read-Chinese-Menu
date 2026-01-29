import { useState, useEffect } from 'react';
import { UserUsage } from '../types';
import { WORKER_URL } from '../services/geminiService';

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
      const parsed = JSON.parse(saved);
      // 确保基础字段存在
      return { ...DEFAULT_USAGE, ...parsed };
    } catch {
      return DEFAULT_USAGE;
    }
  });

  // 每次 usage 变化时自动本地持久化
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  }, [usage]);

  // 计算属性
  const isUnlimited = usage.passExpiryDate 
    ? new Date(usage.passExpiryDate).getTime() > Date.now() 
    : false;

  /**
   * 修正后的核心同步函数
   * 直接接受后端完整的 usage 对象
   */
  const syncWithBackend = (backendUsage: any) => {
    if (!backendUsage) return;

    setUsage(prev => {
      // 1. 映射后端字段名到前端字段名 (如 lastShareDate -> dailyShareDate)
      const mappedUsage: UserUsage = {
        ...prev,
        credits: backendUsage.credits !== undefined ? backendUsage.credits : prev.credits,
        scanCount: backendUsage.scanCount !== undefined ? backendUsage.scanCount : prev.scanCount,
        shareCount: backendUsage.shareCount !== undefined ? backendUsage.shareCount : prev.shareCount,
        gameWinCount: backendUsage.gameWinCount !== undefined ? backendUsage.gameWinCount : prev.gameWinCount,
        passExpiryDate: backendUsage.passExpiryDate || prev.passExpiryDate,
        // 特别注意：Worker 返回的是 lastShareDate，前端存的是 dailyShareDate
        dailyShareDate: backendUsage.lastShareDate ? backendUsage.lastShareDate.split('T')[0] : prev.dailyShareDate,
        achievementTriggered: backendUsage.achievementTriggered || null
      };

      return mappedUsage;
    });
  };

  const handleDailyShare = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (usage.shareCount >= 5 || usage.dailyShareDate === today) {
      alert("Reward already claimed or limit reached.");
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Read Chinese Menu',
          text: 'The best tool to translate Chinese menus!',
          url: window.location.origin
        });

        const res = await fetch(`${WORKER_URL}/api/user-action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, action: 'share' })
        });
        
        const data = await res.json();
        // 直接使用 syncWithBackend 处理返回的所有数据
        if (data.userData) {
          syncWithBackend({
            ...data.userData,
            achievementTriggered: data.achievementTriggered
          });
        }
      } catch (err) {
        console.log("Share failed");
      }
    }
  };

  const handleGameWin = async (userId: string) => {
    if (usage.gameWinCount >= 5) return;
    try {
      const res = await fetch(`${WORKER_URL}/api/user-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'game_win' })
      });
      const data = await res.json();
      if (data.userData) {
        syncWithBackend({
          ...data.userData,
          achievementTriggered: data.achievementTriggered
        });
      }
    } catch (e) {
      console.error("Game reward failed", e);
    }
  };

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