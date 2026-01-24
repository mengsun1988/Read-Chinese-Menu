// src/services/geminiService.ts

import { Dish, StoreResult } from "../types";

/**
 * 💡 核心配置：指向您的 Cloudflare Worker 地址
 */
const WORKER_URL = "https://read-chinese-menu-api.samuelmore1903.workers.dev";

/**
 * 内部辅助函数：确保 Base64 数据纯净
 */
function cleanBase64(base64: string): string {
  if (base64.includes(",")) {
    return base64.split(",")[1];
  }
  return base64;
}

/**
 * 菜单图片识别
 */
export async function processMenuImage(base64Image: string): Promise<Dish[]> {
  const cleanedBase64 = cleanBase64(base64Image);

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: cleanedBase64,
        type: "menu",
      }),
    });

    const result = await response.json();

    if (result.error || !result.candidates) {
      console.error("Gemini 识别任务失败:", result.details || "无返回内容");
      return []; 
    }

    const aiText = result.candidates[0]?.content?.parts?.[0]?.text;
    if (!aiText) return [];

    // --- 核心修复：更强力的清洗逻辑 ---
    try {
      const cleanedJson = aiText
        .replace(/```json/g, "") // 去掉开头的 ```json
        .replace(/```/g, "")     // 去掉结尾的 ```
        .trim()                  // 去掉两端空格
        .replace(/^[`\s]+|[`\s]+$/g, ""); // 👈 新增：强行去掉字符串首尾的所有反引号和换行符

      const parsedData = JSON.parse(cleanedJson);
      
      if (Array.isArray(parsedData)) return parsedData;
      if (parsedData.dishes && Array.isArray(parsedData.dishes)) return parsedData.dishes;
      
      return [];
    } catch (parseErr) {
      // 如果正则清洗后还报错，尝试最后一次：寻找第一个 [ 和最后一个 ]
      try {
        const firstBracket = aiText.indexOf('[');
        const lastBracket = aiText.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
          const fallbackJson = aiText.substring(firstBracket, lastBracket + 1);
          return JSON.parse(fallbackJson);
        }
      } catch (innerErr) {
        console.error("深度解析失败，原始文本:", aiText);
      }
      throw new Error("AI 数据格式化失败");
    }

  } catch (err: any) {
    console.error("processMenuImage 异常:", err);
    return []; // 确保不崩溃
  }
}

/**
 * 店铺门头识别
 * 已适配 Gemini 2.5/3 返回结构
 */
export async function processStorefrontImage(base64Image: string): Promise<StoreResult> {
  const cleanedBase64 = cleanBase64(base64Image);

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: cleanedBase64,
        type: "storefront",
      }),
    });

    const result = await response.json();

    // 错误处理
    if (result.error || !result.candidates) {
      throw new Error(result.details || "门头识别失败");
    }

    const aiText = result.candidates[0]?.content?.parts?.[0]?.text || "{}";
    const cleanedJson = aiText.replace(/```json|```/g, "").trim();
    
    const parsed = JSON.parse(cleanedJson);
    
    // 确保返回 StoreResult 格式（根据你的 types.ts 定义）
    return {
      name: parsed.name || "未知店铺",
      rating: parsed.rating || 0,
      cuisine: parsed.cuisine || "未知菜系",
      ...parsed
    } as StoreResult;

  } catch (err) {
    console.error("processStorefrontImage 异常:", err);
    // 门头识别通常返回单个对象，如果失败则返回一个默认对象
    return { name: "识别失败", rating: 0, cuisine: "请稍后重试" } as StoreResult;
  }
}