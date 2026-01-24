import { Dish, StoreResult } from "../types";

// 后端 API 地址
const WORKER_URL = "https://read-chinese-menu-api.samuelmore1903.workers.dev";

/**
 * 彻底清洗 Base64，处理手机拍摄的大体积数据
 */
function cleanBase64(base64: string): string {
  if (!base64) return "";
  // 移除 Data URL 前缀
  return base64.replace(/^data:image\/\w+;base64,/, "");
}

/**
 * 处理菜单图片 (Menu Mode)
 * 包含完整的字段映射，适配过敏原、猪油警告、拼音和 CNY 价格
 */
export async function processMenuImage(base64Image: string): Promise<any[]> {
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Server Error: ${response.status}`);
    }

    const result = await response.json();
    let rawArray: any[] = [];

    // 1. 自动兼容不同的后端返回结构
    if (Array.isArray(result)) {
      rawArray = result;
    } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = result.candidates[0].content.parts[0].text;
      // 使用正则提取被 Markdown 包裹的 JSON 数组
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      rawArray = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } else if (result.dishes && Array.isArray(result.dishes)) {
      rawArray = result.dishes;
    }

    if (!Array.isArray(rawArray)) return [];

    // 2. 详细的字段映射与数据清洗
    return rawArray.map((item: any, index: number) => {
      // 处理价格：统一加上 CNY
      const rawPrice = String(item.price || "");
      const formattedPrice = rawPrice && !rawPrice.includes('CNY') ? `${rawPrice} CNY` : rawPrice;

      // 处理成分和标志位
      const ingredients = Array.isArray(item.ingredients) ? item.ingredients : [];
      const dietary = Array.isArray(item.dietary_flags) ? item.dietary_flags : [];

      // 深度检查是否有猪油/动物油脂 (适配 WarningIcon)
      const animalFatDetected = item.has_animal_fats === true || 
                               dietary.includes('contains_lard') || 
                               dietary.includes('contains_pork') ||
                               dietary.includes('contains_beef_fat');

      return {
        ...item,
        id: item.id || `dish-${Date.now()}-${index}`,
        // 菜名适配 (兼容不同版本的组件)
        name_cn: item.name_cn || item.name || "未知菜品",
        name_en: item.name_en || item.english_name || "Unknown Dish",
        dish_name_cn: item.name_cn || item.name || "未知菜品",
        dish_name_en: item.name_en || item.english_name || "Unknown Dish",
        
        // 核心信息
        price: formattedPrice,
        description: item.description || "No description provided.",
        spiciness: Number(item.spiciness_level || item.spiciness || 0),
        spiciness_level: Number(item.spiciness_level || item.spiciness || 0),
        
        // 成分与过敏原 (确保 .map 不会报错)
        ingredients: ingredients,
        classic_ingredients: ingredients, // 适配详情弹窗
        potential_ingredients: Array.isArray(item.potential_ingredients) ? item.potential_ingredients : [],
        allergens: Array.isArray(item.allergens) ? item.allergens : [],
        dietary_flags: dietary,
        
        // 标志位
        is_vegetarian: item.is_vegetarian || dietary.includes('vegetarian') || dietary.includes('vegan'),
        has_animal_fats: animalFatDetected,
        
        // 语音与拼音
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
 * 处理店面图片 (Street Mode)
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

    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = result.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      data = jsonMatch ? JSON.parse(jsonMatch[0]) : fallback;
    }

    return {
      ...fallback,
      ...data,
      name: data.name || data.store_name || fallback.name,
      rating: Number(data.rating) || 0,
      cuisine: data.cuisine || fallback.cuisine
    };
  } catch (err) {
    console.error("Storefront Analysis Error:", err);
    return fallback;
  }
}