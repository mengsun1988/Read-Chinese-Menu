/**
 * EdgeOne API 端点 - 调用 Gemini API 进行菜单和店铺识别
 * 支持: menu 菜单识别, street 店铺识别
 */
export async function onRequestPost(context) {
  console.log("[Gemini API] Request received");
  
  // 调试：打印所有可用的环境变量来源
  console.log("[Env Debug] context.env keys:", Object.keys(context.env || {}).join(', '));
  console.log("[Env Debug] process.env keys sample:", Object.keys(process.env || {}).slice(0, 5).join(', '));
  
  // 多种方式尝试读取 API Key
  let apiKey = null;
  
  // 方式 1: EdgeOne 标准方式 - context.env
  if (context.env?.GEMINI_API_KEY) {
    apiKey = context.env.GEMINI_API_KEY;
    console.log("[Env Debug] ✓ Found in context.env.GEMINI_API_KEY");
  }
  // 方式 2: Node.js 标准方式 - process.env
  else if (process.env?.GEMINI_API_KEY) {
    apiKey = process.env.GEMINI_API_KEY;
    console.log("[Env Debug] ✓ Found in process.env.GEMINI_API_KEY");
  }
  // 方式 3: Vite 风格 - 带前缀
  else if (context.env?.VITE_GEMINI_API_KEY) {
    apiKey = context.env.VITE_GEMINI_API_KEY;
    console.log("[Env Debug] ✓ Found in context.env.VITE_GEMINI_API_KEY");
  }
  else if (process.env?.VITE_GEMINI_API_KEY) {
    apiKey = process.env.VITE_GEMINI_API_KEY;
    console.log("[Env Debug] ✓ Found in process.env.VITE_GEMINI_API_KEY");
  }
  
  // 尝试从 wrangler.toml 或其他配置读取
  if (!apiKey && context.env) {
    const allKeys = Object.keys(context.env);
    console.log("[Env Debug] All available env keys:", allKeys.join(', '));
    
    // 尝试找任何包含 "API" 或 "KEY" 的变量
    const potentialKey = allKeys.find(k => k.toUpperCase().includes('API') || k.toUpperCase().includes('KEY'));
    if (potentialKey) {
      console.log("[Env Debug] Found potential key:", potentialKey);
    }
  }
  
  console.log("[Gemini API] API Key status:", apiKey ? `✓ Found (length: ${apiKey.length})` : "✗ Not found in any source");
  
  if (!apiKey) {
    console.error("[Gemini API] CRITICAL: GEMINI_API_KEY not found");
    console.error("[Env Debug] Available context.env:", JSON.stringify(context.env, null, 2).substring(0, 500));
    
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Missing GEMINI_API_KEY. Please set it in EdgeOne console under Environment Variables.",
        dishes: [],
        debug: {
          contextEnvKeys: Object.keys(context.env || {}),
          message: "If you've set the env var, it may take 1-2 minutes to propagate. Try redeploying."
        }
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await context.request.json();
    const { image, type } = body;

    console.log("[Gemini API] Request params:", { type, imageLength: image?.length });

    if (!image || !type) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Missing required fields: image, type",
          dishes: []
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 调用 Gemini API
    const result = type === "menu" 
      ? await recognizeMenu(image, apiKey)
      : await recognizeStorefront(image, apiKey);

    if (result.error) {
      console.error("[Gemini API] Recognition failed:", result.error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: result.error,
          dishes: []
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[Gemini API] Success, returned", Array.isArray(result) ? result.length : 1, "items");
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[Gemini API] Fatal error:", err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Edge Function error: " + String(err),
        dishes: [],
        debug: String(err)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * 使用 Gemini API 识别菜单
 */
async function recognizeMenu(imageBase64, apiKey) {
  // 验证 base64 格式
  if (!imageBase64 || imageBase64.length < 100) {
    return { error: "Invalid image data: too short or empty" };
  }

  const prompt = `You are an expert at analyzing Chinese restaurant menus. Analyze this menu image and extract the following information for EACH dish visible:

1. dish_name_cn: Chinese name
2. dish_name_en: English translation
3. pinyin: Pinyin representation
4. pronunciation_guide: English pronunciation guide (e.g., "Gong-bao Jee-ding")
5. description: Brief description in English
6. classic_ingredients: Array of {name_en, name_cn} - main ingredients typically in this dish
7. potential_ingredients: Array of {name_en, name_cn} - ingredients that might be added
8. spiciness: 0-5 scale (0=not spicy, 5=very spicy)
9. allergens: Array of allergen strings (e.g., ["peanuts", "shellfish"])
10. is_vegetarian: boolean
11. has_animal_fats: boolean (lard, duck fat, etc.)
12. price: Price as shown (e.g., "¥38")

Return ONLY a valid JSON array. Example format:
[
  {
    "dish_name_cn": "宫保鸡丁",
    "dish_name_en": "Kung Pao Chicken",
    "pinyin": "Gōngbǎo Jīdīng",
    "pronunciation_guide": "Gong-bao Jee-ding",
    "description": "A classic Sichuan dish...",
    "classic_ingredients": [{"name_en": "Chicken", "name_cn": "鸡肉"}],
    "potential_ingredients": [{"name_en": "Peanuts", "name_cn": "花生"}],
    "spiciness": 3,
    "allergens": ["peanuts"],
    "is_vegetarian": false,
    "has_animal_fats": false,
    "price": "¥38"
  }
]`;

  return await callGeminiAPI(imageBase64, prompt, apiKey);
}

/**
 * 使用 Gemini API 识别店铺
 */
async function recognizeStorefront(imageBase64, apiKey) {
  // 验证 base64 格式
  if (!imageBase64 || imageBase64.length < 100) {
    return { error: "Invalid image data: too short or empty" };
  }

  const prompt = `You are an expert at analyzing Chinese storefronts. Analyze this storefront image and extract:

1. store_name: Name of the store
2. cuisine_type: Type of cuisine
3. specialty_dishes: Array of 2-3 signature dishes
4. average_price_range: Price range (e.g., "¥30-80 per person")
5. description: Brief description

Return ONLY valid JSON. Example:
{
  "store_name": "Name",
  "cuisine_type": "Sichuan",
  "specialty_dishes": ["Kung Pao Chicken", "Mapo Tofu"],
  "average_price_range": "¥30-80",
  "description": "..."
}`;

  try {
    const response = await callGeminiAPI(imageBase64, prompt, apiKey);
    if (response.error) return response;
    
    // For storefront, return the first item if it's an array
    if (Array.isArray(response)) {
      return response[0] || { error: "No storefront data returned" };
    }
    return response;
  } catch (err) {
    return { error: String(err) };
  }
}

/**
 * 调用 Google Gemini 2.0 Flash API
 */
async function callGeminiAPI(imageBase64, prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 2048
    }
  };

  try {
    console.log("[Gemini Call] Sending request to Gemini API");
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("[Gemini Call] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Gemini API Error] Status:", response.status, "Body:", errorText);
      
      try {
        const error = JSON.parse(errorText);
        return { error: `Gemini API error (${response.status}): ${error.error?.message || errorText}` };
      } catch {
        return { error: `Gemini API error: ${response.status} - ${errorText}` };
      }
    }

    const data = await response.json();
    console.log("[Gemini Call] Response received, parsing...");
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error("[Gemini Response Error] Invalid structure:", JSON.stringify(data).substring(0, 200));
      return { error: "Invalid Gemini response format" };
    }

    const responseText = data.candidates[0].content.parts[0].text;
    console.log("[Gemini Response] Length:", responseText.length);
    
    // 尝试解析 JSON 响应
    const jsonMatch = responseText.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[JSON Parse Error] Could not find JSON in response:", responseText.substring(0, 200));
      return { error: "Could not extract JSON from Gemini response" };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log("[Gemini Call] Parse successful");
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    console.error("[Gemini Call Fatal Error]", err instanceof Error ? err.message : String(err));
    return { error: `API call failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}
