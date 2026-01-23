// services/geminiService.ts

import { Dish, StoreResult } from "../types";

/**
 * Edge Function endpoint
 * EdgeOne 会自动把 ./edge-functions/api/gemini.ts
 * 映射成 /api/gemini
 */
const GEMINI_ENDPOINT = "/api/gemini";

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
 * 菜单图片识别（主功能）
 */
export async function processMenuImage(
  base64Image: string
): Promise<Dish[]> {
  const cleanedBase64 = cleanBase64(base64Image);

  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: cleanedBase64,
      type: "menu",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Edge Function error:", text);
    throw new Error("Menu recognition failed");
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    console.error("Unexpected response:", data);
    throw new Error("Invalid menu data returned");
  }

  return data as Dish[];
}

/**
 * 店铺门头识别（如果你现在还没用，可以先放着）
 */
export async function processStorefrontImage(
  base64Image: string
): Promise<StoreResult> {
  const cleanedBase64 = cleanBase64(base64Image);

  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: cleanedBase64,
      type: "storefront",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Edge Function error:", text);
    throw new Error("Storefront recognition failed");
  }

  const data = await response.json();
  return data as StoreResult;
}
