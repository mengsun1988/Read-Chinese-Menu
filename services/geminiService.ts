import { Dish, StoreResult } from "../types";

// 1. 核心：使用自定义子域名，绕过 Cloudflare 默认域名的拦截
const WORKER_URL = "https://api.readchinesemenu.com";

/**
 * 获取或生成设备唯一 ID (UserId)
 */
function getOrCreateUserId(): string {
  const STORAGE_KEY = 'rmc_anonymous_user_id';
  let userId = localStorage.getItem(STORAGE_KEY);
  
  if (!userId) {
    userId = 'user-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(STORAGE_KEY, userId);
  }
  return userId;
}

/**
 * 清洗 Base64 数据
 */
function cleanBase64(base64: string): string {
  if (!base64) return "";
  return base64.replace(/^data:image\/\w+;base64,/, "");
}

/**
 * 统一处理网络错误提示
 */
function handleNetworkError(err: any) {
  console.error("Network Error Detail:", err);
  if (err.message === 'Failed to fetch') {
    throw new Error("Connection failed. If you are accessing from a restricted network, please try switching to a different connection.");
  }
  throw err;
}

/**
 * 🆕 深度详情解析 (第二步)
 * 仅发送菜名，无需图片，响应速度极快
 */
export async function getDishDeepDetail(name_cn: string, name_en: string): Promise<any> {
  const userId = getOrCreateUserId();
  
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: "dish_detail", // 告诉后端执行深度分析
        name_cn: name_cn,
        name_en: name_en,
        userId: userId 
      }),
    });

    if (!response.ok) throw new Error("Deep analysis failed");
    const result = await response.json();
    
    // 返回深度解析的字段：食材、过敏原、辣度、猪油警告
    return {
      ingredients: Array.isArray(result.ingredients) ? result.ingredients : [],
      allergens: Array.isArray(result.allergens) ? result.allergens : [],
      spiciness: Number(result.spiciness_level || result.spiciness || 0),
      has_animal_fats: !!result.has_animal_fats,
      pinyin: result.pinyin || "",
      pronunciation_guide: result.pronunciation_guide || "",
      isFullyAnalyzed: true // 标记已完成深度解析
    };
  } catch (err) {
    console.error("Deep Detail Error:", err);
    return null;
  }
}

/**
 * 处理菜单图片 (第一步：快速识别)
 */
export async function processMenuImage(base64Image: string): Promise<any[]> {
  const cleanedBase64 = cleanBase64(base64Image);
  const userId = getOrCreateUserId();
  
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
        type: "menu", // 后端应优化此模式下的 Prompt 以减少生成时间
        userId: userId,
        // 提示后端：此时仅需要基础字段，以加快首屏速度
        mode: "fast_scan" 
      }),
    });

    if (response.status === 403) {
      throw new Error("You have run out of free scans for today.");
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Server Error: ${response.status}`);
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

    return rawArray.map((item: any, index: number) => {
      const rawPrice = String(item.price || "");
      const formattedPrice = rawPrice && !rawPrice.includes('CNY') ? `${rawPrice} CNY` : rawPrice;

      return {
        ...item,
        id: item.id || `dish-${Date.now()}-${index}`,
        name_cn: item.name_cn || item.name || "未知菜品",
        name_en: item.name_en || item.english_name || "Unknown Dish",
        price: formattedPrice,
        description: item.description || "No description provided.",
        // 第一步仅显示默认或简化的状态
        isFullyAnalyzed: false, 
        spiciness: item.spiciness || 0,
        ingredients: [], // 初始置空，详情页再加载
        allergens: []
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
    name: "", rating: 0, cuisine: "", description: "",
    tags: [], features: [], highlights: []
  };
  
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ image: cleanedBase64, type: "storefront", userId: userId }),
    });

    if (!response.ok) throw new Error(`Server Error: ${response.status}`);
    const result = await response.json();
    
    if (result && result.name && result.name !== "Unknown Store") {
      return { ...fallback, ...result } as StoreResult;
    }

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
    return fallback as StoreResult;
  }
}