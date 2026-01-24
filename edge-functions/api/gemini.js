/**
 * EdgeOne API 端点 - 调用 Gemini API 进行菜单和店铺识别
 * 支持: menu 菜单识别, street 店铺识别
 */
export async function onRequestPost(context) {
  const apiKey = context.env?.GEMINI_API_KEY || process.env?.GEMINI_API_KEY;
  
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Missing GEMINI_API_KEY environment variable",
        dishes: []
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await context.request.json();
    const { image, type } = body;

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
      return new Response(
        JSON.stringify({
          ok: false,
          error: result.error,
          dishes: []
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[Gemini API] Error:", err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Edge Function error: " + String(err),
        dishes: []
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * 使用 Gemini API 识别菜单
 */
async function recognizeMenu(imageBase64, apiKey) {
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
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Gemini API Error]", response.status, error);
      return { error: `Gemini API error: ${response.status}` };
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return { error: "Invalid Gemini response format" };
    }

    const responseText = data.candidates[0].content.parts[0].text;
    
    // 尝试解析 JSON 响应
    const jsonMatch = responseText.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { error: "Could not extract JSON from Gemini response" };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    console.error("[Gemini Call Error]", err);
    return { error: String(err) };
  }
}
