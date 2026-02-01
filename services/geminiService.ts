import { Dish, StoreResult } from "../types";

// 1. 核心域名
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
      console.warn(`检测到超时 (${response.status})，正在进行重试...`);
      return await fetchWithRetry(url, options, retries - 1);
    }
    return response;
  } catch (err: any) {
    if (retries > 0) return await fetchWithRetry(url, options, retries - 1);
    throw err;
  }
}

/**
 * 🆕 深度详情解析 (修复了逻辑堆叠问题)
 */
export async function getDishDeepDetail(name_cn: string, name_en: string, lang: string = 'en'): Promise<any> {
  const userId = getOrCreateUserId();
  
  try {
    const response = await fetchWithRetry(`${WORKER_URL}/api/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: "dish_detail",
        name_cn,
        name_en,
        userId,
        lang 
      }),
    });

    if (!response.ok) throw new Error("Deep analysis failed");
    
    const data = await response.json();

    if (data.error) {
      console.error("Worker Error:", data.error);
      return null;
    }

    // 统一提取结果层级
    const result = data.result || data.dish || data;
    const deepIngs = result.deep_ingredients || {};
    
    // 映射函数：确保食材对象结构完整
    const mapIngredient = (ing: any) => ({
      name_cn: typeof ing === 'string' ? ing : (ing.name_cn || "未知"),
      name_en: typeof ing === 'string' ? ing : (ing.name_en || ""),
      name_translated: typeof ing === 'object' ? (ing.name_translated || null) : null
    });

    // 构建最终返回的对象，确保 usage 在这里被正确包裹
    return {
      name_cn: result.name_cn || name_cn,
      name_en: result.name_en || name_en,
      name_translated: result.name_translated || null,
      description: result.description || "",
      pinyin: result.pinyin || "",
      pronunciation: result.pronunciation || "",
      spiciness: result.spiciness_level || result.spiciness || 0,
      allergens: Array.isArray(result.allergens) ? result.allergens : [],
      has_animal_fats: !!result.has_animal_fats,
      health_note: result.health_note || "",

      // 深度食材解析
      classic_ingredients: (Array.isArray(deepIngs.classic) ? deepIngs.classic : 
                            (Array.isArray(result.classic_ingredients) ? result.classic_ingredients : []))
                            .map(mapIngredient),
      
      potential_ingredients: (Array.isArray(deepIngs.potential) ? deepIngs.potential : 
                              (Array.isArray(result.potential_ingredients) ? result.potential_ingredients : []))
                              .map(mapIngredient),
      
      ingredients: (Array.isArray(result.ingredients) ? result.ingredients : 
                    (Array.isArray(deepIngs.classic) ? deepIngs.classic : []))
                    .map(mapIngredient),
      
      // 【关键：点数同步点】
      usage: data.userData || data.usage || result.usage || null,

      isFullyAnalyzed: true,
      _debug_source: result._debug_source || null
    };

  } catch (error) {
    console.error("Deep Detail Error:", error);
    return null;
  }
}

/**
 * 处理菜单图片 (第一步：全量识别)
 */
export async function processMenuImage(base64Image: string, lang: string = 'en'): Promise<any> {
  const cleanedBase64 = cleanBase64(base64Image);
  const userId = getOrCreateUserId();
  
  try {
    const response = await fetchWithRetry(`${WORKER_URL}/api/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ image: cleanedBase64, type: "menu", userId, mode: "standard", lang }),
    });

    if (response.status === 403) {
      const errorData = await response.json();
      throw new Error(errorData.error || "OUT_OF_CREDITS");
    }
    
    const result = await response.json();
    if (result.error) throw new Error(result.error);

    let rawArray: any[] = result.dishes || (Array.isArray(result) ? result : []);
    
    const formattedDishes = rawArray.map((item: any, index: number) => {
      const hasChinese = (text: string) => /[\u4e00-\u9fa5]/.test(text || "");
      return {
        id: item.id || `dish-${Date.now()}-${index}`,
        name_cn: item.name_cn || (hasChinese(item.name) ? item.name : "Unknown"),
        name_en: item.name_en || item.english_name || (!hasChinese(item.name) ? item.name : "Scanning..."),
        name_translated: item.name_translated || null,
        pinyin: item.pinyin || "",
        pronunciation: item.pronunciation || "",
        price: item.price || "",
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
        description: item.description || "",
        isFullyAnalyzed: !!item.isFullyAnalyzed, 
        spiciness_level: item.spiciness_level || item.spiciness || 0,
        allergens: item.allergens || [],
        has_animal_fats: !!item.has_animal_fats
      };
    });

    return {
      dishes: formattedDishes,
      usage: result.usage || result.userData || null,
    };
  } catch (err: any) {
    console.error("Menu Image Error:", err);
    throw err;
  }
}

/**
 * 处理店面图片 (Street Mode)
 */
export async function processStorefrontImage(base64Image: string, lang: string = 'en'): Promise<StoreResult> {
  const cleanedBase64 = cleanBase64(base64Image);
  const userId = getOrCreateUserId();
  const fallback: any = { name: "", rating: 0, cuisine: "", description: "", tags: [], highlights: [] };
  
  try {
    const response = await fetchWithRetry(`${WORKER_URL}/api/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: cleanedBase64, type: "store", userId, lang }),
    });

    const result = await response.json();
    return { 
      ...fallback, 
      ...result, 
      usage: result.usage || result.userData || null 
    } as StoreResult;
  } catch (err: any) {
    console.error("Storefront Analysis Error:", err);
    throw err;
  }
}