// src/services/geminiService.ts

export type MenuRecognitionResult = {
  ok: boolean;
  dishes: any[];
  raw?: any;
  error?: string;
};

/**
 * Send image to Edge Function (/api/gemini)
 * This version is SAFE:
 * - Will not crash if backend returns unexpected structure
 * - Compatible with current "Edge Function is working" response
 */
export async function processMenuImage(
  imageBase64: string
): Promise<MenuRecognitionResult> {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: imageBase64,
        type: "menu",
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("API error:", text);
      return {
        ok: false,
        dishes: [],
        error: "API request failed",
      };
    }

    const data = await response.json();
    console.log("Gemini API raw response:", data);

    /**
     * CURRENT BACKEND STATE:
     * data = {
     *   ok: true,
     *   message: "Edge Function is working",
     *   received: {...}
     * }
     *
     * So we must NOT assume dishes exists.
     */

    if (Array.isArray(data?.dishes)) {
      // Future: real Gemini result
      return {
        ok: true,
        dishes: data.dishes,
        raw: data,
      };
    }

    // Temporary fallback: backend works but no AI result yet
    return {
      ok: true,
      dishes: [],
      raw: data,
    };
  } catch (err) {
    console.error("processMenuImage error:", err);
    return {
      ok: false,
      dishes: [],
      error: "Network or parsing error",
    };
  }
}
