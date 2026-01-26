import { useState, useEffect } from 'react';
import { UserUsage } from '../types';

const STORAGE_KEY = 'china_menu_usage';

const DEFAULT_USAGE: UserUsage = {
  credits: 150,        // 初始赠送 150 点 (3 顿饭)
  scanCount: 0,       // 已扫描餐数
  freeCredits: 0,     // 兼容旧字段
  paidCredits: 0,     // 兼容旧字段
  passExpiryDate: null,
  dailyShareDate: null,
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

  // 每次 usage 变化时自动持久化
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  }, [usage]);

  // 计算属性：当前总点数
  const totalCredits = usage.credits ?? 0;

  // 计算属性：是否处于无限次通行证有效期
  const isUnlimited = () => {
    if (!usage.passExpiryDate) return false;
    return new Date(usage.passExpiryDate).getTime() > Date.now();
  };

  // 处理每日分享奖励
  const handleDailyShare = () => {
    const today = new Date().toDateString();
    if (usage.dailyShareDate === today) {
      alert("You've already claimed today's reward! Come back tomorrow.");
      return;
    }

    setUsage(prev => ({
      ...prev,
      credits: (prev.credits || 0) + 50, // 分享奖励 50 点 (1 顿饭)
      dailyShareDate: today,
      achievementTriggered: 'daily_share_bonus'
    }));
    
    alert("Reward Claimed! +50 Credits added.");
  };

  return {
    usage,
    setUsage,
    totalCredits,
    isUnlimited,
    handleDailyShare
  };
};