// src/services/geminiService.ts
import { Dish, StoreResult } from "../types";

export type MenuRecognitionResult = {
  ok: boolean;
  dishes: Dish[];
  raw?: any;
  error?: string;
};

/**
 * 识别菜单函数 - 导出给 App.tsx 使用
 */
export async function processMenuImage(
  imageBase64: string
): Promise<MenuRecognitionResult> {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: imageBase64,
        type: "menu",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Menu Recognition Error]", response.status, errorData);
      return { 
        ok: false, 
        dishes: [], 
        error: errorData?.error || `API request failed (${response.status})` 
      };
    }

    const data = await response.json();
    
    // 兼容 Mock 数据的数组格式
    if (Array.isArray(data)) {
      return { ok: true, dishes: validateDishes(data) };
    }

    // 处理对象格式的响应
    if (data.ok === false) {
      return { ok: false, dishes: [], error: data.error };
    }

    const dishes = data.dishes || data;
    return { ok: true, dishes: validateDishes(Array.isArray(dishes) ? dishes : []), raw: data };
  } catch (err) {
    console.error("[Menu Recognition Network Error]", err);
    return { ok: false, dishes: [], error: `Network error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/**
 * 识别店面函数 - 导出给 App.tsx 使用
 */
export async function processStorefrontImage(
  imageBase64: string
): Promise<StoreResult | any> {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: imageBase64,
        type: "street",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Street Recognition Error]", response.status, errorData);
      return { error: errorData?.error || `API request failed (${response.status})` };
    }

    const data = await response.json();
    
    if (data.error) {
      console.error("[Street Recognition API Error]", data.error);
      return { error: data.error };
    }

    return data;
  } catch (err) {
    console.error("[Street Recognition Network Error]", err);
    return { error: `Network error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/**
 * 验证并清理菜肴数据
 */
function validateDishes(dishes: any[]): Dish[] {
  return dishes
    .filter(dish => dish && typeof dish === 'object')
    .map(dish => ({
      dish_name_cn: dish.dish_name_cn || "Unknown",
      dish_name_en: dish.dish_name_en || "Unknown",
      pinyin: dish.pinyin || "",
      pronunciation_guide: dish.pronunciation_guide || "",
      description: dish.description || "",
      classic_ingredients: Array.isArray(dish.classic_ingredients) ? dish.classic_ingredients : [],
      potential_ingredients: Array.isArray(dish.potential_ingredients) ? dish.potential_ingredients : [],
      spiciness: typeof dish.spiciness === 'number' ? Math.min(5, Math.max(0, dish.spiciness)) : 0,
      allergens: Array.isArray(dish.allergens) ? dish.allergens : [],
      is_vegetarian: Boolean(dish.is_vegetarian),
      has_animal_fats: Boolean(dish.has_animal_fats),
      price: dish.price || "",
      image_url: dish.image_url || undefined,
    }));
}