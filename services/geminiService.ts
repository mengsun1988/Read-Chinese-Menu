// src/services/geminiService.ts
import { Dish, StoreResult } from "../types";

export type MenuRecognitionResult = {
  ok: boolean;
  dishes: Dish[];
  raw?: any;
  error?: string;
};

// Cloudflare Worker URL - 请确认这个地址与你在Cloudflare控制台中看到的完全一致
const WORKER_URL = "https://read-chinese-menu-api.samuelmore1903.workers.dev";

/**
 * 识别菜单函数 - 导出给 App.tsx 使用
 */
export async function processMenuImage(
  imageBase64: string
): Promise<MenuRecognitionResult> {
  try {
    // 关键修改：请求体格式调整为Worker期望的格式
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // 将字段名从 "image" 改为 "imageBase64"
        imageBase64: imageBase64,
        // 添加明确的指令提示词
        prompt: "这是一份中文菜单，请识别其中的所有菜品，并以JSON格式返回菜品列表。每个菜品应包括：菜品中文名(dish_name_cn)、英文名(dish_name_en)、拼音(pinyin)、发音指南(pronunciation_guide)、经典食材(classic_ingredients)、可能食材(potential_ingredients)、辣度(spiciness, 0-5)、过敏原(allergens)、是否素食(is_vegetarian)、是否含动物油脂(has_animal_fats)、价格(price)等信息。请确保返回一个有效的dishes数组。"
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Menu Recognition Error]", response.status, errorData);
      return { 
        ok: false, 
        dishes: [], 
        error: `API request failed (${response.status})` 
      };
    }

    const data = await response.json();
    
    // 检查Gemini API返回的错误
    if (data.error) {
      return { ok: false, dishes: [], error: data.error };
    }

    // 关键修改：从Gemini API的正确路径提取dishes数据
    // Gemini API的响应结构通常是: { candidates: [...] } 或直接包含内容
    // 这里根据你的Worker实际返回的结构调整
    let dishes = [];
    
    // 情况1: 如果Worker直接返回dishes数组
    if (Array.isArray(data.dishes)) {
      dishes = data.dishes;
    } 
    // 情况2: 如果Worker返回的是Gemini API的原始响应
    else if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      // 尝试从Gemini的响应中解析JSON
      try {
        const content = data.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(content);
        dishes = parsed.dishes || [];
      } catch (parseError) {
        console.error("[Parse Gemini Response Error]", parseError);
        // 如果解析失败，尝试直接使用响应中的dishes字段
        dishes = data.dishes || [];
      }
    }
    // 情况3: 其他格式
    else {
      dishes = data.dishes || [];
    }
    
    return { 
      ok: true, 
      dishes: validateDishes(dishes), 
      raw: data // 保留原始数据用于调试
    };
  } catch (err) {
    console.error("[Menu Recognition Network Error]", err);
    return { 
      ok: false, 
      dishes: [], 
      error: `Network error: ${err instanceof Error ? err.message : String(err)}` 
    };
  }
}

/**
 * 识别店面函数 - 导出给 App.tsx 使用
 */
export async function processStorefrontImage(
  imageBase64: string
): Promise<StoreResult | any> {
  try {
    // 关键修改：请求体格式调整为Worker期望的格式
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // 将字段名从 "image" 改为 "imageBase64"
        imageBase64: imageBase64,
        // 添加明确的指令提示词
        prompt: "这是一张中国餐馆的门面照片，请识别并返回以下信息：餐馆名称(name)、菜系类型(cuisine)、地址特征(address)、营业时间(open_hours)、联系电话(phone)、特色菜(signature_dishes数组)、人均消费(price_range)。请以JSON格式返回。"
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Street Recognition Error]", response.status, errorData);
      return { error: `API request failed (${response.status})` };
    }

    const data = await response.json();
    
    if (data.error) {
      console.error("[Street Recognition API Error]", data.error);
      return { error: data.error };
    }

    // 处理Gemini API的不同响应格式
    let result = data;
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      try {
        const content = data.candidates[0].content.parts[0].text;
        result = JSON.parse(content);
      } catch (parseError) {
        console.error("[Parse Storefront Response Error]", parseError);
        // 如果解析失败，返回原始数据
      }
    }
    
    return result;
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