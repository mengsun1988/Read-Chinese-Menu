import { Dish, StoreResult } from "../types";

const WORKER_URL = "https://read-chinese-menu-api.samuelmore1903.workers.dev";

function cleanBase64(base64: string): string {
  if (!base64) return "";
  return base64.replace(/^data:image\/\w+;base64,/, "");
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Error ${response.status}`);
    }

    const result = await response.json();
    let rawArray: any[] = [];

    // 解析逻辑
    if (Array.isArray(result)) {
      rawArray = result;
    } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = result.candidates[0].content.parts[0].text;
      const firstBracket = text.indexOf('[');
      const lastBracket = text.lastIndexOf(']');
      rawArray = JSON.parse(text.substring(firstBracket, lastBracket + 1));
    }

    if (!Array.isArray(rawArray)) return [];

    // 核心映射：将 AI 数据 完美适配到你昨天的高级组件上
    return rawArray.map((item: any, index: number) => {
      const ingredients = Array.isArray(item.ingredients) ? item.ingredients : [];
      const dietary = Array.isArray(item.dietary_flags) ? item.dietary_flags : [];
      
      return {
        ...item,
        id: item.id || `dish-${Date.now()}-${index}`,
        // 基础字段
        dish_name_cn: item.name_cn || item.name || "未知菜名",
        dish_name_en: item.name_en || item.english_name || "Unknown Dish",
        price: String(item.price || ""),
        description: item.description || "No description available.",
        
        // 语音与拼音 (如果 AI 没给，就给空字符串)
        pinyin: item.pinyin || "",
        pronunciation_guide: item.pronunciation_guide || "",
        
        // 辣度与过敏原
        spiciness: Number(item.spiciness_level || item.spiciness || 0),
        allergens: Array.isArray(item.allergens) ? item.allergens : 
                   (dietary.filter(f => f.startsWith('contains_')).map(f => f.replace('contains_', ''))),
        
        // 成分分类 (适配你昨天的 Modal)
        classic_ingredients: ingredients,
        potential_ingredients: Array.isArray(item.potential_ingredients) ? item.potential_ingredients : [],
        
        // 标志位
        is_vegetarian: dietary.includes('vegetarian') || dietary.includes('vegan'),
        has_animal_fats: item.has_animal_fats || dietary.includes('contains_lard') || dietary.includes('contains_pork'),
      };
    });
  } catch (err) {
    console.error("Analysis Error:", err);
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
    let data = result;
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = result.candidates[0].content.parts[0].text;
      data = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
    }
    return { ...fallback, ...data };
  } catch (err) { return fallback; }
}