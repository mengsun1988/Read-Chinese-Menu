export interface Ingredient {
  name_en: string;
  name_cn: string;
}

export interface UserUsage {
  credits: number;        // 总点数
  scanCount: number;      // 已扫描次数
  shareCount?: number;     // 累计分享次数 (上限5)
  gameWinCount?: number;   // 累计游戏次数 (上限5)
  lastShareDate?: string; // 上次分享的日期字符串 (worker.js使用)
  dailyShareDate?: string; // 每日分享日期 (前端使用)
  passExpiryDate?: string; // 通行证过期日期
  achievementTriggered?: string; // 成就触发
  // 以下字段保留以兼容旧数据，但不再使用
  freeCredits?: number;    // 免费点数 (已废弃)
  paidCredits?: number;    // 付费点数 (已废弃)
  lastResetDate?: string; // 最后重置日期 (已废弃)
  gamePlayCount?: number;   // 今日游戏次数 (已废弃)
  lastGameDate?: string;    // 最后一次玩游戏日期 (已废弃)
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
  _debug_source?: string; // 新增：标识AI模型来源
  usage?: UserUsage;      // 补丁：解决 handleDishClick 中的类型报错
}

export interface StoreResult {
  store_name: string;
  cuisine_type: string;
  specialty_dishes: string[];
  average_price_range: string;
  description: string;
  _debug_source?: string; // 新增：标识AI模型来源
  usage?: UserUsage;      // 补丁：解决 handleFileChange (Street Mode) 中的类型报错
}

export interface MenuRecognitionResult {
  dishes: Dish[];
  usage?: {
    credits: number;
    scanCount: number;
    achievementTriggered?: string;
    isUnlimited: boolean;
    _debug_source?: string; // 新增：标识AI模型来源
  };
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

export type FeedbackType = 'EXPERIENCE' | 'IMPROVEMENT' | 'STORY';