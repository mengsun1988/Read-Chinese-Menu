import { Dish, StoreResult } from "../types";

const WORKER_URL = "https://read-chinese-menu-api.samuelmore1903.workers.dev";

function cleanBase64(base64: string): string {
  return base64.includes(",") ? base64.split(",")[1] : base64;
}

/**
 * 识别菜单：强制格式化输出，确保 ingredients 等数组字段始终存在
 */
export async function processMenuImage(base64Image: string): Promise<Dish[]> {
  const cleanedBase64 = cleanBase64(base64Image);

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: cleanedBase64, type: "menu" }),
    });

    const result = await response.json();
    if (result.error || !result.candidates) return [];

    const aiText = result.candidates[0]?.content?.parts?.[0]?.text;
    if (!aiText) return [];

    try {
      // 定位有效的 JSON 数组部分
      const firstBracket = aiText.indexOf('[');
      const lastBracket = aiText.lastIndexOf(']');
      if (firstBracket === -1 || lastBracket === -1) return [];

      const rawArray = JSON.parse(aiText.substring(firstBracket, lastBracket + 1));
      
      // 数据适配：补全所有可能缺失的字段，防止 UI 渲染崩溃
      return rawArray.map((item: any, index: number) => ({
        id: item.id || `dish-${index}-${Date.now()}`,
        name_cn: item.name_cn || item.name || "未知菜名",
        name_en: item.name_en || item.name || "Unknown Dish",
        price: item.price || "MKT",
        description: item.description || "",
        // 核心修复点：强制补齐数组
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
        dietary_flags: Array.isArray(item.dietary_flags) ? item.dietary_flags : [],
        spiciness_level: item.spiciness_level || 0,
        image_url: item.image_url || ""
      })) as Dish[];
    } catch (e) {
      console.error("JSON 解析或格式化失败:", e);
      return [];
    }
  } catch (err) {
    console.error("网络请求失败:", err);
    return [];
  }
}

/**
 * 识别店铺
 */
export async function processStorefrontImage(base64Image: string): Promise<StoreResult> {
  const cleanedBase64 = cleanBase64(base64Image);
  const fallback: StoreResult = { name: "Unknown Shop", rating: 0, cuisine: "N/A" };

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: cleanedBase64, type: "storefront" }),
    });

    const result = await response.json();
    const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    const firstBrace = aiText.indexOf('{');
    const lastBrace = aiText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(aiText.substring(firstBrace, lastBrace + 1)) as StoreResult;
    }
    return fallback;
  } catch (err) {
    return fallback;
  }
}