import { Dish, StoreResult } from "../types";

// 1. 核心：修改为你的 Cloudflare Worker 域名
export const WORKER_URL = "https://api.readchinesemenu.com";

/**
 * 获取或生成设备唯一 ID
 */
export function getOrCreateUserId(): string {
  const STORAGE_KEY = 'rmc_anonymous_user_id';
  let userId = localStorage.getItem(STORAGE_KEY);
  if (!userId) {
    userId = 'user-' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(STORAGE_KEY, userId);
  }
  return userId;
}

function cleanBase64(base64: string): string {
  if (!base64) return "";
  return base64.replace(/^data:image\/\w+;base64,/, "");
}

/**
 * 封装带重试机制的 Fetch
 */
async function fetchWithRetry(url: string, options: any, retries = 2): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    if ((response.status === 524 || response.status === 504) && retries > 0) {
      console.warn(`检测到超时 (${response.status})，正在进行重试... 剩余次数: ${retries}`);
      return await fetchWithRetry(url, options, retries - 1);
    }
    return response;
  } catch (err: any) {
    if (retries > 0) {
      return await fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}

/**
 * 🆕 深度详情解析 (第二步：点击卡片后触发)
 */
export async function getDishDeepDetail(name_cn: string, name_en: string): Promise<any> {
  const userId = getOrCreateUserId();
  try {
    const response = await fetchWithRetry(`${WORKER_URL}/api/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: "dish_detail",
        name_cn,
        name_en,
        userId 
      }),
    });

    if (!response.ok) throw new Error("Deep analysis failed");
    const result = await response.json();
    
    return {
      // 优先使用 classic_ingredients 和 potential_ingredients，如果没有则使用 ingredients
      classic_ingredients: Array.isArray(result.classic_ingredients) ? result.classic_ingredients : 
                          (Array.isArray(result.ingredients) ? result.ingredients : []),
      potential_ingredients: Array.isArray(result.potential_ingredients) ? result.potential_ingredients : [],
      // 保留 ingredients 字段以兼容旧代码
      ingredients: Array.isArray(result.ingredients) ? result.ingredients : 
                   (Array.isArray(result.classic_ingredients) ? result.classic_ingredients : []),
      allergens: Array.isArray(result.allergens) ? result.allergens : [],
      spiciness: result.spiciness_level || result.spiciness || 0, 
      pinyin: result.pinyin || "",
      pronunciation: result.pronunciation || "",
      health_note: result.health_note || "",
      description: result.description || "",
      isFullyAnalyzed: true,
      _debug_source: result._debug_source || null
    };
  } catch (err) {
    console.error("Deep Detail Error:", err);
    return null;
  }
}

/**
 * 处理菜单图片 (第一步：识别所有可见菜品列表)
 * 修改点：返回包含 dishes 和 usage 的完整对象，而不仅仅是数组
 */
export async function processMenuImage(base64Image: string): Promise<any> {
  const cleanedBase64 = cleanBase64(base64Image);
  const userId = getOrCreateUserId();
  
  try {
    const response = await fetchWithRetry(`${WORKER_URL}/api/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ 
        image: cleanedBase64, 
        type: "menu",
        userId: userId,
        mode: "standard" 
      }),
    });

    // 处理额度耗尽的特殊状态码
    if (response.status === 403) {
      const errorData = await response.json();
      throw new Error(errorData.error || "OUT_OF_CREDITS");
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server is busy. Please try again later.");
    }

    const result = await response.json();
    let rawArray: any[] = [];

    // 防御性检查：确保服务器返回了有效结构
    if (!result || (typeof result !== 'object')) {
      throw new Error("Invalid server response format");
    }

    // 防御性检查：处理可能的错误响应
    if (result.error) {
      throw new Error(result.error);
    }

    // 解析菜品数组
    if (result.dishes && Array.isArray(result.dishes)) {
      rawArray = result.dishes;
    } else if (Array.isArray(result)) {
      rawArray = result;
    } else if (result.name_cn || result.name_en) {
      rawArray = [result];
    } else {
      // 防御性检查：确保至少有一种数据格式
      throw new Error("Unexpected server response structure");
    }

    if (rawArray.length === 0) {
      throw new Error("No dishes could be identified. Try a clearer photo.");
    }

    // 防御性检查：验证菜品数据结构
    for (const item of rawArray) {
      if (!item.name_cn && !item.name_en) {
        throw new Error("Incomplete dish data received from server");
      }
    }

    // 格式化菜品数据
    const formattedDishes = rawArray.map((item: any, index: number) => ({
      id: item.id || `dish-${Date.now()}-${index}`,
      name_cn: item.name_cn || item.name || "Unknown",
      name_en: item.name_en || item.english_name || "Scanning...",
      pinyin: item.pinyin || "",
      pronunciation: item.pronunciation || "",
      price: item.price || "",
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : (item.core_ingredients || []),
      description: item.description || "",
      isFullyAnalyzed: item.isFullyAnalyzed || false, 
      spiciness_level: item.spiciness_level || 0,
      allergens: item.allergens || []
    }));

    // 返回包含 dishes 列表、usage 状态和调试信息的对象
    return {
      dishes: formattedDishes,
      usage: result.usage || null,
      _debug_source: result._debug_source || null
    };

  } catch (err: any) {
    console.error("Menu Image Error:", err);
    throw err;
  }
}

/**
 * 处理店面图片 (Street Mode)
 */
export async function processStorefrontImage(base64Image: string): Promise<StoreResult> {
  const cleanedBase64 = cleanBase64(base64Image);
  const userId = getOrCreateUserId();
  const fallback: any = { 
    name: "", rating: 0, cuisine: "", description: "",
    tags: [], features: [], highlights: []
  };
  
  try {
    const response = await fetchWithRetry(`${WORKER_URL}/api/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ image: cleanedBase64, type: "storefront", userId: userId }),
    });

    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType?.includes("application/json")) {
      throw new Error("Store identification timed out.");
    }

    const result = await response.json();
    if (result && (result.name || result.name_cn)) {
      return { ...fallback, ...result, _debug_source: result._debug_source || null } as StoreResult;
    }
    
    return { ...fallback, _debug_source: null } as StoreResult;
  } catch (err: any) {
    console.error("Storefront Analysis Error:", err);
    throw err;
  }
}