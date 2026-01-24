import { Dish, StoreResult } from "../types";

const WORKER_URL = "[https://read-chinese-menu-api.samuelmore1903.workers.dev](https://read-chinese-menu-api.samuelmore1903.workers.dev)";

/**
 * 移除 Base64 字符串的前缀头（如果存在）
 */
function cleanBase64(base64: string): string {
  return base64.includes(",") ? base64.split(",")[1] : base64;
}

/**
 * 处理菜单图片：识别菜名、成分、价格等
 */
export async function processMenuImage(base64Image: string): Promise<Dish[]> {
  const cleanedBase64 = cleanBase64(base64Image);
  
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: cleanedBase64, type: "menu" }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const result = await response.json();
    
    // 如果 Worker 返回了明确的错误
    if (result.error) {
      throw new Error(`AI Error: ${result.error}`);
    }

    // 提取 AI 文本内容
    const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!aiText) {
      throw new Error("The AI returned an empty response. Please try again.");
    }

    try {
      // 找到 JSON 数组的起始和结束位置
      const firstBracket = aiText.indexOf('[');
      const lastBracket = aiText.lastIndexOf(']');
      
      if (firstBracket === -1 || lastBracket === -1) {
        console.error("Malformed AI Response (No array found):", aiText);
        throw new Error("Could not parse menu data. Please ensure the menu is clearly visible.");
      }

      const jsonStr = aiText.substring(firstBracket, lastBracket + 1);
      const rawArray = JSON.parse(jsonStr);
      
      if (!Array.isArray(rawArray)) {
        throw new Error("Data format error: AI did not return a list of dishes.");
      }

      // 映射并清洗数据，确保符合 Dish 接口
      return rawArray.map((item: any, index: number) => ({
        id: item.id || `dish-${Date.now()}-${index}`,
        name_cn: item.name_cn || item.name || "未知菜名",
        name_en: item.name_en || item.english_name || "Unknown Dish",
        price: String(item.price || ""),
        description: item.description || "",
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
        dietary_flags: Array.isArray(item.dietary_flags) ? item.dietary_flags : [],
        spiciness_level: Math.min(Math.max(Number(item.spiciness_level) || 0, 0), 5), // 限制在 0-5
        image_url: item.image_url || ""
      })) as Dish[];

    } catch (parseErr) {
      console.error("JSON Parse Exception:", parseErr, "Raw Text:", aiText);
      throw new Error("Failed to decode menu information. The photo may be too complex.");
    }

  } catch (err: any) {
    console.error("Network or Processing Error:", err);
    throw err; // 将错误向上抛出，由 App.tsx 的 catch 块捕获并显示给用户
  }
}

/**
 * 处理店面图片：识别店名、评分、菜系等
 */
export async function processStorefrontImage(base64Image: string): Promise<StoreResult> {
  const cleanedBase64 = cleanBase64(base64Image);
  const fallback: StoreResult = { name: "Unknown Store", rating: 0, cuisine: "N/A" };
  
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: cleanedBase64, type: "storefront" }),
    });

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
        // 确保数值类型正确
        rating: Number(parsed.rating) || 0
      };
    }
    
    return fallback;
  } catch (err) {
    console.error("Storefront Processing Error:", err);
    return fallback;
  }
}