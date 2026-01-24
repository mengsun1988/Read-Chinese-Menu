import { Dish, StoreResult } from "../types";

// 确保 URL 是一个干净的常量字符串
const WORKER_URL = "https://read-chinese-menu-api.samuelmore1903.workers.dev";

/**
 * 移除 Base64 字符串的前缀头
 */
function cleanBase64(base64: string): string {
  return base64.includes(",") ? base64.split(",")[1] : base64;
}

/**
 * 处理菜单图片
 */
export async function processMenuImage(base64Image: string): Promise<Dish[]> {
  const cleanedBase64 = cleanBase64(base64Image);
  
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
        type: "menu" 
      }),
    });

    if (response.status === 405) {
      throw new Error("API Connection Blocked (405). Please check Worker CORS settings.");
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server Error (${response.status}): ${errorText || 'Unknown response'}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(`AI Error: ${result.error}`);
    }

    // --- 核心修改部分：兼容多种返回格式 ---
    let rawArray: any[] = [];

    if (Array.isArray(result)) {
      // 格式 A: Worker 直接返回了数组 (你目前的情况)
      rawArray = result;
    } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      // 格式 B: Worker 返回的是 Gemini 原始嵌套格式，需要提取文本里的 JSON
      const aiText = result.candidates[0].content.parts[0].text;
      try {
        const firstBracket = aiText.indexOf('[');
        const lastBracket = aiText.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
          const jsonStr = aiText.substring(firstBracket, lastBracket + 1);
          rawArray = JSON.parse(jsonStr);
        }
      } catch (e) {
        console.error("Internal Parse Error:", e);
      }
    } else if (result.dishes && Array.isArray(result.dishes)) {
      // 格式 C: 返回的是带 key 的对象 { dishes: [...] }
      rawArray = result.dishes;
    }

    if (!rawArray || rawArray.length === 0) {
      throw new Error("The AI returned an empty response or invalid format.");
    }

    // 统一映射字段，防止后端字段名不一致
    return rawArray.map((item: any, index: number) => ({
      id: item.id || `dish-${Date.now()}-${index}`,
      name_cn: item.name_cn || item.name || "未知菜名",
      name_en: item.name_en || item.english_name || "Unknown Dish",
      price: String(item.price || ""),
      description: item.description || "",
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
      dietary_flags: Array.isArray(item.dietary_flags) ? item.dietary_flags : [],
      spiciness_level: Math.min(Math.max(Number(item.spiciness_level) || 0, 0), 5),
      image_url: item.image_url || ""
    })) as Dish[];

  } catch (err: any) {
    console.error("Process Image Error:", err);
    throw err;
  }
}

/**
 * 处理店面图片
 */
export async function processStorefrontImage(base64Image: string): Promise<StoreResult> {
  const cleanedBase64 = cleanBase64(base64Image);
  const fallback: StoreResult = { name: "Unknown Store", rating: 0, cuisine: "N/A" };
  
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
        type: "storefront" 
      }),
    });

    if (!response.ok) return fallback;

    const result = await response.json();
    
    // 兼容处理：直接返回对象或嵌套在 candidates 里
    let storeData = result;
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      const aiText = result.candidates[0].content.parts[0].text;
      const firstBrace = aiText.indexOf('{');
      const lastBrace = aiText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        storeData = JSON.parse(aiText.substring(firstBrace, lastBrace + 1));
      }
    }

    return {
      ...fallback,
      ...storeData,
      name: storeData.name || storeData.store_name || fallback.name,
      rating: Number(storeData.rating) || 0
    };
  } catch (err) {
    console.error("Storefront Error:", err);
    return fallback;
  }
}