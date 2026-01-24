// services/geminiService.ts

import { Dish, StoreResult } from "../types";

/**
 * 💡 修改点 1：使用 Cloudflare Workers 的完整域名
 * 不要使用相对路径 "/api/gemini"，因为你现在跨平台调用了
 */
const GEMINI_ENDPOINT = "https://read-chinese-menu-api.samuelmore1903.workers.dev";

/**
 * 去掉 base64 的 data:image/... 前缀
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
export async function processMenuImage(
  base64Image: string
): Promise<Dish[]> {
  const cleanedBase64 = cleanBase64(base64Image);

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: cleanedBase64, // 👈 必须叫 image，对应 Worker 逻辑
        type: "menu",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Worker error:", errorText);
      throw new Error("识别请求失败，请检查后端配置");
    }

    // 💡 修改点 2：解析 Gemini 3 的返回结构
    const result = await response.json();

    // 如果 Worker 直接返回了 text 字符串（由 JSON.parse 转后的数组）
    if (Array.isArray(result)) return result as Dish[];

    // 适配 Gemini 标准返回格式
    const aiResponseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponseText) {
      console.error("Gemini 3 empty response:", result);
      return [];
    }

    // 将 AI 返回的 JSON 字符串转为对象
    try {
      // 有时 AI 会在字符串前后加 ```json ... ```，需要清理
      const cleanedJson = aiResponseText.replace(/```json|```/g, "").trim();
      const parsedData = JSON.parse(cleanedJson);
      
      // 最终确保返回的是数组
      return Array.isArray(parsedData) ? parsedData : (parsedData.dishes || []);
    } catch (parseErr) {
      console.error("JSON parse error from AI:", aiResponseText);
      throw new Error("AI 返回数据格式有误");
    }

  } catch (err: any) {
    console.error("processMenuImage failed:", err);
    throw err;
  }
}

/**
 * 店铺门头识别
 */
export async function processStorefrontImage(
  base64Image: string
): Promise<StoreResult> {
  const cleanedBase64 = cleanBase64(base64Image);

  const response = await fetch(GEMINI_ENDPOINT, {
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
}