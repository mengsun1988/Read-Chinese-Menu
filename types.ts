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
  freeCredits: number;
  paidCredits: number;
  lastResetDate: string; // YYYY-MM-DD
  lastShareDate?: string; // YYYY-MM-DD
  passExpiryDate?: string; // ISO string
}

export type FeedbackType = 'EXPERIENCE' | 'IMPROVEMENT' | 'STORY';