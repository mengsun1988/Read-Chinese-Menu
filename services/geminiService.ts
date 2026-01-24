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
    // 显式指定请求头，防止被浏览器或 CDN 误判
    const response = await fetch(WORKER_URL, {
      method: "POST",
      mode: "cors", // 显式开启 CORS
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ 
        image: cleanedBase64, 
        type: "menu" 
      }),
    });

    // 针对 405 错误的特殊检查
    if (response.status === 405) {
      throw new Error("API Connection Blocked (405). Please check if the Worker URL is correct and CORS is enabled on the backend.");
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server Error (${response.status}): ${errorText || 'Unknown response'}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(`AI Error: ${result.error}`);
    }

    const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!aiText) {
      throw new Error("The AI returned an empty response.");
    }

    try {
      const firstBracket = aiText.indexOf('[');
      const lastBracket = aiText.lastIndexOf(']');
      
      if (firstBracket === -1 || lastBracket === -1) {
        throw new Error("Could not find valid menu data in the response.");
      }

      const jsonStr = aiText.substring(firstBracket, lastBracket + 1);
      const rawArray = JSON.parse(jsonStr);
      
      if (!Array.isArray(rawArray)) {
        throw new Error("Response format error: Not an array.");
      }

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

    } catch (parseErr) {
      console.error("Parse Error Details:", aiText);
      throw new Error("Failed to decode the menu. Please try a clearer photo.");
    }

  } catch (err: any) {
    console.error("Network Error Details:", err);
    // 如果仍然出现 405，很有可能是 Worker 端的路由没写好（不支持 POST）
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
    const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const firstBrace = aiText.indexOf('{');
    const lastBrace = aiText.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonStr = aiText.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonStr);
      return {
        ...fallback,
        ...parsed,
        rating: Number(parsed.rating) || 0
      };
    }
    
    return fallback;
  } catch (err) {
    console.error("Storefront Error:", err);
    return fallback;
  }
}