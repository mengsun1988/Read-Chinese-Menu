import { Dish, StoreResult } from "../types";

const WORKER_URL = "https://read-chinese-menu-api.samuelmore1903.workers.dev";

function cleanBase64(base64: string): string {
  return base64.includes(",") ? base64.split(",")[1] : base64;
}

export async function processMenuImage(base64Image: string): Promise<any[]> {
  const cleanedBase64 = cleanBase64(base64Image);
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ image: cleanedBase64, type: "menu" }),
    });

    if (!response.ok) throw new Error(`Network Error: ${response.status}`);
    const result = await response.json();

    let rawArray: any[] = [];
    if (Array.isArray(result)) {
      rawArray = result;
    } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      const aiText = result.candidates[0].content.parts[0].text;
      const firstBracket = aiText.indexOf('[');
      const lastBracket = aiText.lastIndexOf(']');
      rawArray = JSON.parse(aiText.substring(firstBracket, lastBracket + 1));
    } else if (result.dishes) {
      rawArray = result.dishes;
    }

    if (!Array.isArray(rawArray)) return [];

    return rawArray.map((item: any, index: number) => {
      const ingredients = Array.isArray(item.ingredients) ? item.ingredients : [];
      const dietary = Array.isArray(item.dietary_flags) ? item.dietary_flags : [];
      
      return {
        ...item, // 保留原始所有字段
        id: item.id || `dish-${Date.now()}-${index}`,
        // 双重字段映射，兼容卡片和弹窗
        dish_name_cn: item.name_cn || item.name || "未知菜名",
        dish_name_en: item.name_en || item.english_name || "Unknown Dish",
        name_cn: item.name_cn || item.name || "未知菜名",
        name_en: item.name_en || item.english_name || "Unknown Dish",
        price: String(item.price || ""),
        description: item.description || "",
        spiciness: Number(item.spiciness_level || item.spiciness || 0),
        spiciness_level: Number(item.spiciness_level || item.spiciness || 0),
        ingredients: ingredients,
        dietary_flags: dietary,
        is_vegetarian: dietary.includes('vegetarian') || dietary.includes('vegan'),
        has_animal_fats: dietary.includes('contains_pork') || dietary.includes('contains_lard')
      };
    });
  } catch (err) {
    console.error("Service Error:", err);
    throw err;
  }
}

export async function processStorefrontImage(base64Image: string): Promise<StoreResult> {
  const cleanedBase64 = cleanBase64(base64Image);
  const fallback: StoreResult = { name: "Unknown Store", rating: 0, cuisine: "N/A" };
  try {
    const response = await fetch(WORKER_URL, { method: "POST", mode: "cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: cleanedBase64, type: "storefront" }) });
    const result = await response.json();
    let data = result;
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = result.candidates[0].content.parts[0].text;
      data = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
    }
    return { ...fallback, ...data };
  } catch (err) { return fallback; }
}