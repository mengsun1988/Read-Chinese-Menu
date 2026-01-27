export interface Ingredient {
  name_en: string;
  name_cn: string;
}

export interface Dish {
  dish_name_cn: string;
  dish_name_en: string;
  pinyin?: string;
  pronunciation_guide?: string;
  description: string;
  classic_ingredients: Ingredient[];
  potential_ingredients: Ingredient[];
  spiciness: number;
  allergens: string[];
  is_vegetarian: boolean;
  has_animal_fats: boolean;
  price?: string;
  image_url?: string;
}

export interface StoreResult {
  store_name: string;
  cuisine_type: string;
  specialty_dishes: string[];
  average_price_range: string;
  description: string;
}

export enum RecognitionMode {
  MENU = 'MENU',
  STREET = 'STREET'
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface UserUsage {
  credits: number;        // 总点数
  scanCount: number;      // 已扫描次数
  freeCredits: number;    // 免费点数
  paidCredits: number;    // 付费点数
  lastResetDate?: string; // 最后重置日期
  dailyShareDate?: string; // 每日分享日期
  passExpiryDate?: string; // 通行证过期日期
  gamePlayCount?: number;   // 今日游戏次数
  lastGameDate?: string;    // 最后一次玩游戏日期
  achievementTriggered?: string; // 成就触发
}

export type FeedbackType = 'EXPERIENCE' | 'IMPROVEMENT' | 'STORY';
