import { Dish, StoreResult } from "../types";

// 确保 URL 正确
const WORKER_URL = "https://read-chinese-menu-api.samuelmore1903.workers.dev";

/**
 * 彻底清洗 Base64，只保留纯数据部分
 */
function cleanBase64(base64: string): string {
  if (!base64) return "";
  return base64.replace(/^data:image\/\w+;base64,/, "");
}

/**
 * 处理菜单图片 (Menu Mode)
 */
export async function processMenuImage(base64Image: string): Promise<any[]> {
  const cleanedBase64 = cleanBase64(base64Image);
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ image: cleanedBase64, type: "menu" }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Error ${response.status}`);
    }

    const result = await response.json();
    let rawArray: any[] = [];

    // 解析逻辑：支持直接返回数组或嵌套在 candidates 中
    if (Array.isArray(result)) {
      rawArray = result;
    } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = result.candidates[0].content.parts[0].text;
      const firstBracket = text.indexOf('[');
      const lastBracket = text.lastIndexOf(']');
      rawArray = JSON.parse(text.substring(firstBracket, lastBracket + 1));
    }

    if (!Array.isArray(rawArray)) return [];

    // 字段映射：适配 App.tsx 和 DishDetailModal.tsx
    return rawArray.map((item: any, index: number) => {
      const ingredients = Array.isArray(item.ingredients) ? item.ingredients : [];
      const dietary = Array.isArray(item.dietary_flags) ? item.dietary_flags : [];
      
      return {
        ...item,
        id: item.id || `dish-${Date.now()}-${index}`,
        dish_name_cn: item.name_cn || item.name || "未知菜品",
        dish_name_en: item.name_en || item.english_name || "Unknown Dish",
        name_cn: item.name_cn || item.name || "未知菜名",
        name_en: item.name_en || item.english_name || "Unknown Dish",
        price: String(item.price || ""),
        description: item.description || "No description provided.",
        spiciness: Number(item.spiciness_level || item.spiciness || 0),
        allergens: Array.isArray(item.allergens) ? item.allergens : [],
        classic_ingredients: ingredients,
        potential_ingredients: Array.isArray(item.potential_ingredients) ? item.potential_ingredients : [],
        is_vegetarian: dietary.includes('vegetarian') || dietary.includes('vegan'),
        has_animal_fats: item.has_animal_fats || dietary.includes('contains_lard') || dietary.includes('contains_pork'),
        pinyin: item.pinyin || "",
        pronunciation_guide: item.pronunciation_guide || ""
      };
    });
  } catch (err) {
    console.error("Menu Analysis Error:", err);
    throw err;
  }
}

/**
 * 处理店面图片 (Street Mode) - 必须导出！
 */
export async function processStorefrontImage(base64Image: string): Promise<StoreResult> {
  const cleanedBase64 = cleanBase64(base64Image);
  const fallback: StoreResult = { name: "Unknown Store", rating: 0, cuisine: "N/A" };
  
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: cleanedBase64, type: "storefront" }),
    });

    if (!response.ok) return fallback;

    const result = await response.json();
    let data = result;

    // 处理可能嵌套在 candidates 里的店面 JSON
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = result.candidates[0].content.parts[0].text;
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        data = JSON.parse(text.substring(firstBrace, lastBrace + 1));
      }
    }

    return {
      ...fallback,
      ...data,
      name: data.name || data.store_name || fallback.name,
      rating: Number(data.rating) || 0
    };
  } catch (err) {
    console.error("Storefront Analysis Error:", err);
    return fallback;
  }
}