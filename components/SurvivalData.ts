// src/components/SurvivalData.ts

export interface SurvivalCard {
  id: string;
  category: string;
  en: string;
  cn: string;
  icon: string;
  votes: number;
  status: 'verified' | 'pending';
  isOfficial?: boolean;
}

export const SURVIVAL_CATEGORIES = ["Dining", "Traffic", "Hotel", "Daily", "Community"] as const;

export const OFFICIAL_CARDS: SurvivalCard[] = [
  { id: 'off-1', category: "Dining", en: "Table for two?", cn: "请问两位有位子吗？", icon: "🪑", votes: 99, status: 'verified', isOfficial: true },
  { id: 'off-2', category: "Dining", en: "No Cilantro / Green Onion", cn: "不要放香菜和葱。", icon: "🌿", votes: 99, status: 'verified', isOfficial: true },
  { id: 'off-3', category: "Traffic", en: "To the Railway Station", cn: "请带我去火车站。", icon: "🚄", votes: 99, status: 'verified', isOfficial: true },
  { id: 'off-4', category: "Daily", en: "Where is the Toilet?", cn: "厕所在哪里？", icon: "🚻", votes: 99, status: 'verified', isOfficial: true },
  // ... 其他你之前的初始卡片
];