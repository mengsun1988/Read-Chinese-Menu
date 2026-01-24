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
      mode: "cors",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ image: cleanedBase64, type: "menu" }),
    });

    if (!response.ok) throw new Error(`Server Error: ${response.status}`);

    const result = await response.json();
    if (result.error) throw new Error(result.error);

    // 1. 提取原始数组
    let rawArray: any[] = [];
    if (Array.isArray(result)) {
      rawArray = result;
    } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      const aiText = result.candidates[0].content.parts[0].text;
      const firstBracket = aiText.indexOf('[');
      const lastBracket = aiText.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1) {
        rawArray = JSON.parse(aiText.substring(firstBracket, lastBracket + 1));
      }
    } else if (result.dishes) {
      rawArray = result.dishes;
    }

    if (!Array.isArray(rawArray)) return [];

    // 2. 极其严格的字段映射，确保没有 undefined
    return rawArray.map((item: any, index: number) => ({
      id: String(item.id || `dish-${Date.now()}-${index}`),
      name_cn: String(item.name_cn || item.name || "未知菜名"),
      name_en: String(item.name_en || item.english_name || "Unknown Dish"),
      price: String(item.price || ""),
      description: String(item.description || ""),
      // 核心修复：强制确保这些是数组
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
      dietary_flags: Array.isArray(item.dietary_flags) ? item.dietary_flags : [],
      spiciness_level: Number(item.spiciness_level) || 0,
      image_url: String(item.image_url || "")
    })) as Dish[];

  } catch (err) {
    console.error("Service Error:", err);
    throw err;
  }
}

export async function processStorefrontImage(base64Image: string): Promise<StoreResult> {
  const cleanedBase64 = cleanBase64(base64Image);
  const fallback: StoreResult = { name: "Unknown Store", rating: 0, cuisine: "N/A" };
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST", mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: cleanedBase64, type: "storefront" }),
    });
    const result = await response.json();
    let data = Array.isArray(result) ? result[0] : result;
    if (result.candidates) {
      const text = result.candidates[0].content.parts[0].text;
      data = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
    }
    return { ...fallback, ...data };
  } catch (err) { return fallback; }
}