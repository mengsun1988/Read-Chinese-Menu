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
    if (result.error || !result.candidates) return [];

    const aiText = result.candidates[0]?.content?.parts?.[0]?.text || "[]";
    
    try {
      const firstBracket = aiText.indexOf('[');
      const lastBracket = aiText.lastIndexOf(']');
      if (firstBracket === -1 || lastBracket === -1) return [];

      const rawArray = JSON.parse(aiText.substring(firstBracket, lastBracket + 1));
      
      // ✨ 核心修复：确保每一个 dish 对象都拥有 UI 渲染所需的完整结构
      return (Array.isArray(rawArray) ? rawArray : []).map((item: any, index: number) => ({
        id: item.id || `dish-${index}-${Date.now()}`,
        name_cn: item.name_cn || item.name || "未知菜名",
        name_en: item.name_en || item.name || "Unknown Dish",
        price: String(item.price || "MKT"),
        description: item.description || "",
        // 🚨 这里的保护至关重要：如果 AI 没返回数组，我们给它一个空数组
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
        dietary_flags: Array.isArray(item.dietary_flags) ? item.dietary_flags : [],
        spiciness_level: Number(item.spiciness_level) || 0,
        image_url: item.image_url || ""
      })) as Dish[];
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return [];
    }
  } catch (err) {
    console.error("Fetch Error:", err);
    return [];
  }
}

export async function processStorefrontImage(base64Image: string): Promise<StoreResult> {
  const cleanedBase64 = cleanBase64(base64Image);
  const fallback: StoreResult = { name: "Unknown", rating: 0, cuisine: "N/A" };
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
    if (firstBrace !== -1) {
      const parsed = JSON.parse(aiText.substring(firstBrace, lastBrace + 1));
      return { ...fallback, ...parsed };
    }
    return fallback;
  } catch (err) {
    return fallback;
  }
}