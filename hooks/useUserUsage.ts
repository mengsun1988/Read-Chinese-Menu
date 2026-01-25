import { useState, useEffect } from 'react';
import { UserUsage } from '../types';

const STORAGE_KEY = 'rmc_user_usage_v3';
const getBeijingDate = () => new Date(new Date().getTime() + (8 * 60 * 60 * 1000)).toISOString().split('T')[0];

export const useUserUsage = () => {
  const [usage, setUsage] = useState<UserUsage>(() => {
    const todayStr = getBeijingDate();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.lastResetDate !== todayStr 
        ? { ...parsed, freeCredits: 15, lastResetDate: todayStr } 
        : parsed;
    }
    return { freeCredits: 15, paidCredits: 0, lastResetDate: todayStr };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  }, [usage]);

  const totalCredits = (usage.freeCredits || 0) + (usage.paidCredits || 0);
  const isUnlimited = usage.passExpiryDate ? new Date(usage.passExpiryDate).getTime() > Date.now() : false;
  
  return { usage, setUsage, totalCredits, isUnlimited, getBeijingDate };
};