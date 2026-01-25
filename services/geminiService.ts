import { Dish, StoreResult } from "../types";

// 1. 核心：使用自定义子域名
const WORKER_URL = "https://api.readchinesemenu.com";

/**
 * 获取或生成设备唯一 ID
 */
function getOrCreateUserId(): string {
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
 * 专门处理 524 超时或其他临时性网络问题
 */
async function fetchWithRetry(url: string, options: any, retries = 2): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // 如果是 524 或 504 超时，且还有重试次数
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
 * 🆕 深度详情解析 (第二步)
 */
export async function getDishDeepDetail(name_cn: string, name_en: string): Promise<any> {
  const userId = getOrCreateUserId();
  try {
    const response = await fetchWithRetry(WORKER_URL, {
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
      ingredients: Array.isArray(result.ingredients) ? result.ingredients : [],
      allergens: Array.isArray(result.allergens) ? result.allergens : [],
      spiciness: Number(result.spiciness_level || result.spiciness || 0),
      has_animal_fats: !!result.has_animal_fats,
      pinyin: result.pinyin || "",
      pronunciation_guide: result.pronunciation_guide || "",
      isFullyAnalyzed: true
    };
  } catch (err) {
    console.error("Deep Detail Error:", err);
    return null;
  }
}

/**
 * 处理菜单图片 (第一步)
 */
export async function processMenuImage(base64Image: string): Promise<any[]> {
  const cleanedBase64 = cleanBase64(base64Image);
  const userId = getOrCreateUserId();
  
  try {
    const response = await fetchWithRetry(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ 
        image: cleanedBase64, 
        type: "menu",
        userId: userId,
        mode: "fast_scan" 
      }),
    });

    if (response.status === 403) throw new Error("You have run out of free scans for today.");
    
    // 关键修复：先检查是否为 JSON 响应，防止解析 524 错误页文本
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Server returned non-JSON:", text);
      throw new Error("Server is busy or timed out. Please try again later.");
    }

    const result = await response.json();
    let rawArray: any[] = [];

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

    return rawArray.map((item: any, index: number) => ({
      ...item,
      id: item.id || `dish-${Date.now()}-${index}`,
      name_cn: item.name_cn || item.name || "未知菜品",
      name_en: item.name_en || item.english_name || "Unknown Dish",
      price: item.price ? (String(item.price).includes('CNY') ? item.price : `${item.price} CNY`) : "",
      description: item.description || "No description provided.",
      isFullyAnalyzed: false, 
      ingredients: [],
      allergens: []
    }));
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
    const response = await fetchWithRetry(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ image: cleanedBase64, type: "storefront", userId: userId }),
    });

    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType?.includes("application/json")) {
      throw new Error("Store identification timed out. Please try again.");
    }

    const result = await response.json();
    
    // 如果后端直接返回了清洗好的对象
    if (result && (result.name || result.name_cn)) {
      return { ...fallback, ...result } as StoreResult;
    }

    // 如果返回的是 Gemini 原始格式，需要正则解析
    let aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (aiText) {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          ...fallback,
          ...data,
          name: data.name || data.name_cn || data.store_name || "",
          rating: Number(data.rating) || 4.5
        } as StoreResult;
      }
    }
    
    return fallback as StoreResult;
  } catch (err: any) {
    console.error("Storefront Analysis Error:", err);
    // 抛出错误以便 App.tsx 捕获并显示 Error UI
    throw err;
  }
}