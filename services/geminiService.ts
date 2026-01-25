import { Dish, StoreResult } from "../types";

// 1. 核心：使用自定义子域名，绕过 Cloudflare 默认域名的拦截
// 确保在 Cloudflare 后台已将 api.readchinesemenu.com 绑定到该 Worker
const WORKER_URL = "https://api.readchinesemenu.com";

/**
 * 获取或生成设备唯一 ID (UserId)
 * 用于后端 KV 数据库点数限制，不需要登录
 */
function getOrCreateUserId(): string {
  const STORAGE_KEY = 'rmc_anonymous_user_id';
  let userId = localStorage.getItem(STORAGE_KEY);
  
  if (!userId) {
    // 生成一个随机 ID
    userId = 'user-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(STORAGE_KEY, userId);
  }
  return userId;
}

/**
 * 清洗 Base64 数据
 * 配合 App.tsx 中的压缩逻辑，确保传给后端的是轻量化的图片文本
 */
function cleanBase64(base64: string): string {
  if (!base64) return "";
  // 移除 Data URL 前缀 (例如 data:image/jpeg;base64,)
  return base64.replace(/^data:image\/\w+;base64,/, "");
}

/**
 * 统一处理网络错误提示
 */
function handleNetworkError(err: any) {
  console.error("Network Error Detail:", err);
  if (err.message === 'Failed to fetch') {
    throw new Error("Connection failed. If you are accessing from a restricted network, please try switching to a different connection or check your proxy.");
  }
  throw err;
}

/**
 * 处理菜单图片 (Menu Mode)
 */
export async function processMenuImage(base64Image: string): Promise<any[]> {
  const cleanedBase64 = cleanBase64(base64Image);
  const userId = getOrCreateUserId();
  
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      mode: "cors", // 显式使用跨域模式
      headers: { 
        "Content-Type": "application/json", 
        "Accept": "application/json" 
      },
      body: JSON.stringify({ 
        image: cleanedBase64, 
        type: "menu",
        userId: userId 
      }),
    });

    // 针对点数耗尽的处理
    if (response.status === 403) {
      throw new Error("You have run out of free scans for today. Please top up to continue.");
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Server Error: ${response.status}`);
    }

    const result = await response.json();
    let rawArray: any[] = [];

    // 自动兼容不同的后端返回结构
    if (Array.isArray(result)) {
      rawArray = result;
    } else if (result.dishes && Array.isArray(result.dishes)) {
      rawArray = result.dishes;
    } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = result.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      rawArray = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }

    if (!Array.isArray(rawArray)) return [];

    // 字段映射与数据清洗
    return rawArray.map((item: any, index: number) => {
      const rawPrice = String(item.price || "");
      const formattedPrice = rawPrice && !rawPrice.includes('CNY') ? `${rawPrice} CNY` : rawPrice;
      const dietary = Array.isArray(item.dietary_flags) ? item.dietary_flags : [];

      const animalFatDetected = item.has_animal_fats === true || 
                               dietary.includes('contains_lard') || 
                               dietary.includes('contains_pork');

      return {
        ...item,
        id: item.id || `dish-${Date.now()}-${index}`,
        name_cn: item.name_cn || item.name || "未知菜品",
        name_en: item.name_en || item.english_name || "Unknown Dish",
        price: formattedPrice,
        description: item.description || "No description provided.",
        spiciness: Number(item.spiciness_level || item.spiciness || 0),
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
        allergens: Array.isArray(item.allergens) ? item.allergens : [],
        dietary_flags: dietary,
        is_vegetarian: item.is_vegetarian || dietary.includes('vegetarian'),
        has_animal_fats: animalFatDetected,
        pinyin: item.pinyin || ""
      };
    });
  } catch (err: any) {
    return handleNetworkError(err);
  }
}

/**
 * 处理店面图片 (Street Mode)
 */
export async function processStorefrontImage(base64Image: string): Promise<StoreResult> {
  const cleanedBase64 = cleanBase64(base64Image);
  const userId = getOrCreateUserId();
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
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ 
        image: cleanedBase64, 
        type: "storefront",
        userId: userId 
      }),
    });

    if (!response.ok) throw new Error(`Server Error: ${response.status}`);

    const result = await response.json();
    
    // 优先返回直接的对象结构
    if (result && result.name && result.name !== "Unknown Store") {
      return { ...fallback, ...result } as StoreResult;
    }

    // 处理 AI 可能包装在 text 里的 JSON
    let aiText = "";
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      aiText = result.candidates[0].content.parts[0].text;
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
  } catch (err: any) {
    console.error("Storefront Analysis Error:", err);
    // 这里选择不抛出错误，而是返回空状态，让 UI 显示识别失败
    return fallback as StoreResult;
  }
}