import { useState, useEffect } from 'react';
import { UserUsage } from '../types';

const STORAGE_KEY = 'rmc_user_usage_v3';

// 获取北京时间日期字符串
const getBeijingDate = () => {
  const d = new Date();
  const beijingTime = new Date(d.getTime() + (8 * 60 * 60 * 1000));
  return beijingTime.toISOString().split('T')[0];
};

export const useUserUsage = () => {
  const [usage, setUsage] = useState<UserUsage>(() => {
    const todayStr = getBeijingDate();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserUsage;
        // 跨天重置免费点数
        if (parsed.lastResetDate !== todayStr) {
          return { ...parsed, freeCredits: 15, lastResetDate: todayStr };
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Usage parsing failed", e);
    }
    return { freeCredits: 15, paidCredits: 0, lastResetDate: todayStr };
  });

  // 状态持久化
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  }, [usage]);

  // 计算属性
  const totalCredits = (usage.freeCredits || 0) + (usage.paidCredits || 0);
  
  const isUnlimited = () => {
    return usage.passExpiryDate ? new Date(usage.passExpiryDate).getTime() > Date.now() : false;
  };

  const getRemainingDays = () => {
    if (!usage.passExpiryDate) return 0;
    const diff = new Date(usage.passExpiryDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // 分享奖励逻辑
  const handleDailyShare = async () => {
    const today = getBeijingDate();
    if (usage.lastShareDate === today) {
      alert("Already claimed today!");
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({ 
          title: 'Read Chinese Menu', 
          url: window.location.origin 
        });
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        alert("Link copied!");
      }
      setUsage(prev => ({ 
        ...prev, 
        freeCredits: (prev.freeCredits || 0) + 5, 
        lastShareDate: today 
      }));
    } catch (err) {
      console.log("Share failed", err);
    }
  };

  return { 
    usage, 
    setUsage, 
    totalCredits, 
    isUnlimited, 
    getRemainingDays, 
    handleDailyShare,
    getBeijingDate 
  };
};