import { Dish, StoreResult } from "../types";

const WORKER_URL = "https://read-chinese-menu-api.samuelmore1903.workers.dev";

function cleanBase64(base64: string): string {
  return base64.includes(",") ? base64.split(",")[1] : base64;
}

export async function processMenuImage(base64Image: string): Promise<Dish[]> {
  const cleanedBase64 = cleanBase64(base64Image);
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: cleanedBase64, type: "menu" }),
    });

    const result = await response.json();
    
    // 如果 API 报错或没有候选内容
    if (result.error || !result.candidates || result.candidates.length === 0) {
      console.error("API 返回错误:", result.error);
      return [];
    }

    const aiText = result.candidates[0].content.parts[0].text;
    
    try {
      // 提取 JSON 数组部分
      const firstBracket = aiText.indexOf('[');
      const lastBracket = aiText.lastIndexOf(']');
      
      if (firstBracket !== -1 && lastBracket !== -1) {
        const jsonString = aiText.substring(firstBracket, lastBracket + 1);
        const rawArray = JSON.parse(jsonString);
        
        // 强制转换字段，确保每个对象都有前端需要的属性
        return (Array.isArray(rawArray) ? rawArray : []).map((item: any, index: number) => ({
          id: item.id || `dish-${index}-${Date.now()}`,
          name_cn: item.name_cn || item.name || "未知菜名",
          name_en: item.name_en || item.name || "Unknown Dish",
          price: String(item.price || "MKT"),
          description: item.description || "",
          ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
          dietary_flags: Array.isArray(item.dietary_flags) ? item.dietary_flags : [],
          spiciness_level: Number(item.spiciness_level) || 0,
        }));
      }
      return [];
    } catch (parseErr) {
      console.error("解析菜单 JSON 失败:", aiText);
      return [];
    }
  } catch (err) {
    console.error("网络请求失败:", err);
    return [];
  }
}

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
      const parsed = JSON.parse(aiText.substring(firstBrace, lastBrace + 1));
      return {
        ...fallback,
        ...parsed
      };
    }
    return fallback;
  } catch (err) {
    return fallback;
  }
}