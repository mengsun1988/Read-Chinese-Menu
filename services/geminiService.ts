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
  // 如果带有 data:image/jpeg;base64, 前缀，则剔除
  if (base64.includes(",")) {
    return base64.split(",")[1];
  }
  return base64;
}

/**
 * 菜单图片识别（主功能）
 */
export async function processMenuImage(base64Image: string): Promise<Dish[]> {
  const cleanedBase64 = cleanBase64(base64Image);

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: cleanedBase64, // 👈 必须叫 image，对应 Worker 里的解构
        type: "menu",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Worker Error Response:", errorText);
      throw new Error(`后端识别失败: ${response.status}`);
    }

    const result = await response.json();

    // 1. 从 Gemini 3 复杂的返回结构中提取文本
    const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiText) {
      console.warn("AI 未能识别到有效内容，返回原始结果:", result);
      return [];
    }

    // 2. 解析 AI 返回的 JSON 字符串（包含 Markdown 清理）
    try {
      const cleanedJson = aiText.replace(/```json|```/g, "").trim();
      const parsedData = JSON.parse(cleanedJson);
      
      // 3. 灵活返回：如果是数组则直接返回，如果是对象则尝试取 dishes 属性
      if (Array.isArray(parsedData)) {
        return parsedData as Dish[];
      } else if (parsedData.dishes && Array.isArray(parsedData.dishes)) {
        return parsedData.dishes as Dish[];
      }
      return [];
    } catch (parseErr) {
      console.error("解析 AI JSON 失败，原始文本:", aiText);
      throw new Error("AI 数据格式化失败");
    }

  } catch (err: any) {
    console.error("processMenuImage 异常:", err);
    throw err;
  }
}

/**
 * 店铺门头识别（为以后扩展功能预留）
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
    const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleanedJson = aiText.replace(/```json|```/g, "").trim();
    
    return JSON.parse(cleanedJson) as StoreResult;
  } catch (err) {
    console.error("processStorefrontImage 异常:", err);
    throw err;
  }
}