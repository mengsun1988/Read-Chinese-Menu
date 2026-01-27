import { useState, useEffect } from 'react';
import { UserUsage } from '../types';

const STORAGE_KEY = 'china_menu_usage';

const DEFAULT_USAGE: UserUsage = {
  credits: 200,        // 初始赠送 200 点 (4 顿饭)
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

  // 处理每日分享奖励 - 增强验证机制
  const handleDailyShare = async () => {
    const today = new Date().toDateString();
    if (usage.dailyShareDate === today) {
      alert("You've already claimed today's reward! Come back tomorrow.");
      return;
    }

    // 1. 尝试使用浏览器原生分享API
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Read Chinese Menu',
          text: 'Translate Chinese menus instantly! Essential tool for travelers in China.',
          url: 'https://readchinesemenu.com'
        });
        
        // 2. 只有分享成功后才奖励点数
        setUsage(prev => ({
          ...prev,
          credits: (prev.credits || 0) + 50,
          dailyShareDate: today,
          achievementTriggered: 'daily_share_bonus'
        }));
        
        alert("Share successful! +50 Credits added.");
      } catch (err) {
        // 用户取消分享
        if (err.name !== 'AbortError') {
          console.error("Share failed:", err);
          alert("Share cancelled. No credits awarded.");
        }
      }
    } else {
      // 2. 对于不支持分享API的浏览器，提供备用方案
      const shareUrl = `https://readchinesemenu.com`;
      const shareText = 'Translate Chinese menus instantly! Essential tool for travelers in China.';
      
      // 尝试复制分享链接到剪贴板
      let copySuccess = false;
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          copySuccess = true;
        } catch (err) {
          console.warn('Failed to copy to clipboard:', err);
        }
      }
      
      alert(`Your browser doesn't support native sharing. The share link has been ${copySuccess ? 'copied to your clipboard!' : 'displayed below.'}\n\n` + 
            `${shareText}\n${shareUrl}\n\n` +
            `Tap and hold the link to copy it, then share via your preferred app.\n\n` +
            "After sharing, click 'Confirm Share' to receive your reward.");
      
      // 添加确认按钮
      if (confirm("Have you successfully shared the link?")) {
        setUsage(prev => ({
          ...prev,
          credits: (prev.credits || 0) + 50,
          dailyShareDate: today,
          achievementTriggered: 'daily_share_bonus'
        }));
      }
    }
  };

  return {
    usage,
    setUsage,
    totalCredits,
    isUnlimited,
    handleDailyShare
  };
};
