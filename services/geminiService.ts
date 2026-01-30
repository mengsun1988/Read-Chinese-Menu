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
    
    // 处理特定的超时状态码
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
 * 增加 lang 参数，使后端能够返回对应语言的翻译
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
        lang // 传给后端的语言参数
      }),
    });

    if (!response.ok) throw new Error("Deep analysis failed");
    const result = await response.json();
    
    // 获取 Worker 深度分析返回的食材结构
    const deepIngs = result.deep_ingredients || {};
    
    // 映射函数：确保食材对象结构完整，防止字段丢失
    const mapIngredient = (ing: any) => ({
      name_cn: typeof ing === 'string' ? ing : (ing.name_cn || "未知"),
      name_en: typeof ing === 'string' ? ing : (ing.name_en || ""),
      name_translated: typeof ing === 'object' ? (ing.name_translated || null) : null
    });

    return {
      // 1. 核心字段映射：优先从 deep_ingredients 中提取，并进行规范化处理
      classic_ingredients: (Array.isArray(deepIngs.classic) ? deepIngs.classic : 
                            (Array.isArray(result.classic_ingredients) ? result.classic_ingredients : []))
                            .map(mapIngredient),
      
      potential_ingredients: (Array.isArray(deepIngs.potential) ? deepIngs.potential : 
                              (Array.isArray(result.potential_ingredients) ? result.potential_ingredients : []))
                              .map(mapIngredient),
      
      // 2. 兼容性处理：保留 ingredients 字段供旧组件或基础展示使用
      ingredients: (Array.isArray(result.ingredients) ? result.ingredients : 
                    (Array.isArray(deepIngs.classic) ? deepIngs.classic : []))
                    .map(mapIngredient),
      
      // 3. 其他深度详情
      allergens: Array.isArray(result.allergens) ? result.allergens : [],
      spiciness: result.spiciness_level || result.spiciness || 0, 
      pinyin: result.pinyin || "",
      pronunciation: result.pronunciation || "",
      health_note: result.health_note || "",
      description: result.description || "",
      has_animal_fats: result.has_animal_fats || false,
      
      // 4. 状态标记
      isFullyAnalyzed: true,
      _debug_source: result._debug_source || null,
      
      // 额外透传 API 可能返回的翻译字段
      name_translated: result.name_translated || null
    };
  } catch (err) {
    console.error("Deep Detail Error:", err);
    return null;
  }
}

/**
 * 处理菜单图片 (第一步：识别所有可见菜品列表)
 * 增加 lang 参数，支持首轮扫描时的翻译
 */
export async function processMenuImage(base64Image: string, lang: string = 'en'): Promise<any> {
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
        mode: "standard",
        lang // 传给后端的语言参数
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

    // 防御性检查
    if (!result || (typeof result !== 'object')) {
      throw new Error("Invalid server response format");
    }

    if (result.error) {
      throw new Error(result.error);
    }

    // 解析菜品数组
    if (result.dishes && Array.isArray(result.dishes)) {
      rawArray = result.dishes;
    } else if (Array.isArray(result)) {
      rawArray = result;
    } else if (result.name_cn || result.name_en || result.name) {
      rawArray = [result];
    } else {
      throw new Error("Unexpected server response structure");
    }

    if (rawArray.length === 0) {
      throw new Error("No dishes could be identified. Try a clearer photo.");
    }

    // 格式化菜品数据
    const formattedDishes = rawArray.map((item: any, index: number) => {
      const hasChinese = (text: string) => /[\u4e00-\u9fa5]/.test(text);
      const inferredNameCn = item.name_cn || (item.name && hasChinese(item.name) ? item.name : "Unknown");
      const inferredNameEn = item.name_en || item.english_name || (item.name && !hasChinese(item.name) ? item.name : "Scanning...");

      return {
        id: item.id || `dish-${Date.now()}-${index}`,
        name_cn: inferredNameCn,
        name_en: inferredNameEn,
        name_translated: item.name_translated || null, // 接收 API 返回的翻译
        pinyin: item.pinyin || "",
        pronunciation: item.pronunciation || "",
        price: item.price || "",
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : (item.core_ingredients || []),
        description: item.description || "",
        isFullyAnalyzed: item.isFullyAnalyzed || false, 
        spiciness_level: item.spiciness_level || item.spiciness || 0,
        allergens: item.allergens || [],
        has_animal_fats: item.has_animal_fats || false
      };
    });

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
 * 增加 lang 参数支持
 */
export async function processStorefrontImage(base64Image: string, lang: string = 'en'): Promise<StoreResult> {
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
      body: JSON.stringify({ 
        image: cleanedBase64, 
        type: "store", // 【修复点】修改为 "store" 以匹配 Worker.js 逻辑
        userId: userId,
        lang // 传给后端的语言参数
      }),
    });

    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType?.includes("application/json")) {
      throw new Error("Store identification timed out.");
    }

    const result = await response.json();
    if (result && (result.name || result.name_cn || result.store)) { // 增强判断逻辑
      return { 
        ...fallback, 
        ...result, 
        usage: result.usage || null,
        _debug_source: result._debug_source || null 
      } as StoreResult;
    }
    
    return { ...fallback, _debug_source: null } as StoreResult;
  } catch (err: any) {
    console.error("Storefront Analysis Error:", err);
    throw err;
  }
}