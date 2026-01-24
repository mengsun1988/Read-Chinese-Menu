// src/services/geminiService.ts
import { Dish, StoreResult } from "../types";

export type MenuRecognitionResult = {
  ok: boolean;
  dishes: Dish[];
  raw?: any;
  error?: string;
};

/**
 * 识别菜单函数 - 导出给 App.tsx 使用
 */
export async function processMenuImage(
  imageBase64: string
): Promise<MenuRecognitionResult> {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: imageBase64,
        type: "menu",
      }),
    });

    if (!response.ok) {
      return { ok: false, dishes: [], error: "API request failed" };
    }

    const data = await response.json();
    
    // 兼容 Mock 数据的数组格式
    if (Array.isArray(data)) {
      return { ok: true, dishes: data };
    }

    return { ok: true, dishes: data.dishes || [], raw: data };
  } catch (err) {
    return { ok: false, dishes: [], error: "Network error" };
  }
}

/**
 * 识别店面函数 - 导出给 App.tsx 使用
 * 即使目前只用 Mock 菜单，这个函数也必须存在，否则 Build 会报错
 */
export async function processStorefrontImage(
  imageBase64: string
): Promise<StoreResult | any> {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: imageBase64,
        type: "street",
      }),
    });
    return await response.json();
  } catch (err) {
    return { error: "Recognition failed" };
  }
}