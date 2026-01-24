import { Dish, StoreResult } from "../types";

// 后端 API 地址
const WORKER_URL = "https://read-chinese-menu-api.samuelmore1903.workers.dev";

/**
 * 🆕 获取或生成设备唯一 ID (UserId)
 * 用于后端 KV 数据库点数限制，不需要登录
 */
function getOrCreateUserId(): string {
  const STORAGE_KEY = 'rmc_anonymous_user_id';
  let userId = localStorage.getItem(STORAGE_KEY);
  
  if (!userId) {
    // 生成一个随机 ID，例如 user-823b...
    userId = 'user-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(STORAGE_KEY, userId);
  }
  return userId;
}

/**
 * 彻底清洗 Base64，处理手机拍摄的大体积数据
 */
function cleanBase64(base64: string): string {
  if (!base64) return "";
  // 移除 Data URL 前缀
  return base64.replace(/^data:image\/\w+;base64,/, "");
}

/**
 * 处理菜单图片 (Menu Mode)
 * 包含完整的字段映射，适配过敏原、猪油警告、拼音和 CNY 价格
 */
export async function processMenuImage(base64Image: string): Promise<any[]> {
  const cleanedBase64 = cleanBase64(base64Image);
  const userId = getOrCreateUserId(); // 获取本次请求的 ID
  
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      mode: "cors",
      headers: { 
        "Content-Type": "application/json", 
        "Accept": "application/json" 
      },
      body: JSON.stringify({ 
        image: cleanedBase64, 
        type: "menu",
        userId: userId // 🆕 将 ID 传给后端 Worker
      }),
    });

    // 针对点数耗尽的特殊处理
    if (response.status === 403) {
      throw new Error("You have run out of free scans for today.");
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Server Error: ${response.status}`);
    }

    const result = await response.json();
    let rawArray: any[] = [];

    // 1. 自动兼容不同的后端返回结构
    if (Array.isArray(result)) {
      rawArray = result;
    } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = result.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      rawArray = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } else if (result.dishes && Array.isArray(result.dishes)) {
      rawArray = result.dishes;
    }

    if (!Array.isArray(rawArray)) return [];

    // 2. 详细的字段映射与数据清洗
    return rawArray.map((item: any, index: number) => {
      const rawPrice = String(item.price || "");
      const formattedPrice = rawPrice && !rawPrice.includes('CNY') ? `${rawPrice} CNY` : rawPrice;

      const ingredients = Array.isArray(item.ingredients) ? item.ingredients : [];
      const dietary = Array.isArray(item.dietary_flags) ? item.dietary_flags : [];

      const animalFatDetected = item.has_animal_fats === true || 
                               dietary.includes('contains_lard') || 
                               dietary.includes('contains_pork') ||
                               dietary.includes('contains_beef_fat');

      return {
        ...item,
        id: item.id || `dish-${Date.now()}-${index}`,
        name_cn: item.name_cn || item.name || "未知菜品",
        name_en: item.name_en || item.english_name || "Unknown Dish",
        dish_name_cn: item.name_cn || item.name || "未知菜品",
        dish_name_en: item.name_en || item.english_name || "Unknown Dish",
        
        price: formattedPrice,
        description: item.description || "No description provided.",
        spiciness: Number(item.spiciness_level || item.spiciness || 0),
        spiciness_level: Number(item.spiciness_level || item.spiciness || 0),
        
        ingredients: ingredients,
        classic_ingredients: ingredients,
        potential_ingredients: Array.isArray(item.potential_ingredients) ? item.potential_ingredients : [],
        allergens: Array.isArray(item.allergens) ? item.allergens : [],
        dietary_flags: dietary,
        
        is_vegetarian: item.is_vegetarian || dietary.includes('vegetarian') || dietary.includes('vegan'),
        has_animal_fats: animalFatDetected,
        
        pinyin: item.pinyin || "",
        pronunciation_guide: item.pronunciation_guide || ""
      };
    });
  } catch (err) {
    console.error("Menu Analysis Error:", err);
    throw err;
  }
}

/**
 * 处理店面图片 (Street Mode)
 * 增加了防御性字段，防止 UI 组件 .map() 报错
 */
export async function processStorefrontImage(base64Image: string): Promise<StoreResult> {
  const cleanedBase64 = cleanBase64(base64Image);
  const userId = getOrCreateUserId(); // 获取本次请求的 ID
  const fallback: any = { 
    name: "", 
    rating: 0, 
    cuisine: "",
    description: "",
    tags: [],
    features: [],
    highlights: []
  };
  
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        image: cleanedBase64, 
        type: "storefront",
        userId: userId // 🆕 将 ID 传给后端 Worker
      }),
    });

    const result = await response.json();
    
    if (result && result.name && result.name !== "Unknown Store") {
      return { ...fallback, ...result } as StoreResult;
    }

    let aiText = "";
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      aiText = result.candidates[0].content.parts[0].text;
    } else if (typeof result === 'string') {
      aiText = result;
    }

    if (aiText) {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          ...fallback,
          ...data,
          name: data.name || data.store_name || "",
          rating: Number(data.rating) || 0
        } as StoreResult;
      }
    }

    return fallback as StoreResult;
  } catch (err) {
    console.error("Storefront Analysis Error:", err);
    return fallback as StoreResult;
  }
}