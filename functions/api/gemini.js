/**
 * EdgeOne Pages 函数 - 测试版本
 */

export async function onRequest(context) {
  const { request, env } = context;
  
  console.log('[API] Request received');
  console.log('[API] Method:', request.method);

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Only POST allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { image, type } = body;

    console.log('[API] Request type:', type);
    console.log('[API] Image length:', image?.length);

    if (!image || !type) {
      return new Response(
        JSON.stringify({ error: "Missing image or type parameter", dishes: [] }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = env.GEMINI_API_KEY;
    console.log('[API] API Key available:', apiKey ? 'yes' : 'no');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured", dishes: [] }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let result;
    if (type === "menu") {
      result = await recognizeMenu(image, apiKey);
    } else if (type === "street") {
      result = await recognizeStorefront(image, apiKey);
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid type. Use 'menu' or 'street'", dishes: [] }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (result.error) {
      return new Response(
        JSON.stringify({ error: result.error, dishes: [] }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        ok: true,
        [type === "menu" ? "dishes" : "store"]: result
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('[API] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, dishes: [] }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * 识别菜单
 */
async function recognizeMenu(imageBase64, apiKey) {
  if (!imageBase64 || imageBase64.length < 100) {
    return { error: "Invalid image data" };
  }

  const prompt = `你是一位中文菜单分析专家。请分析这张菜单图片，提取每道菜肴的以下信息：

1. dish_name_cn: 中文菜名
2. dish_name_en: 英文菜名翻译
3. pinyin: 拼音表示
4. pronunciation_guide: 英文发音指南
5. description: 英文简短描述
6. classic_ingredients: [{name_en, name_cn}] 主要食材
7. potential_ingredients: [{name_en, name_cn}] 可能的额外食材
8. spiciness: 0-5 辣度等级
9. allergens: 过敏原列表
10. is_vegetarian: 是否素食
11. has_animal_fats: 是否含有动物脂肪（猪油、鸭油等）
12. price: 价格信息

只返回 JSON 数组，格式如下：
[
  {
    "dish_name_cn": "宫保鸡丁",
    "dish_name_en": "Kung Pao Chicken",
    "pinyin": "Gōngbǎo Jīdīng",
    "pronunciation_guide": "Gong-bao Jee-ding",
    "description": "Diced chicken stir-fried with peanuts and chilies",
    "classic_ingredients": [
      {"name_en": "Chicken", "name_cn": "鸡肉"},
      {"name_en": "Peanuts", "name_cn": "花生"}
    ],
    "potential_ingredients": [
      {"name_en": "Dried chilies", "name_cn": "干辣椒"}
    ],
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
 * 识别店铺
 */
async function recognizeStorefront(imageBase64, apiKey) {
  if (!imageBase64 || imageBase64.length < 100) {
    return { error: "Invalid image data" };
  }

  const prompt = `你是一位店铺识别专家。请分析这张店铺门面图片，提取以下信息：

1. store_name: 店铺名称
2. cuisine_type: 菜系类型
3. specialty_dishes: 特色菜列表（2-3个）
4. average_price_range: 人均价格范围
5. description: 店铺简介

只返回 JSON 对象，格式如下：
{
  "store_name": "店铺名称",
  "cuisine_type": "四川菜",
  "specialty_dishes": ["宫保鸡丁", "麻婆豆腐"],
  "average_price_range": "¥30-80 per person",
  "description": "Authentic restaurant description"
}`;

  return await callGeminiAPI(imageBase64, prompt, apiKey);
}

/**
 * 调用 Google Gemini API
 */
async function callGeminiAPI(imageBase64, prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  // 清理 base64 数据（移除 data URI 前缀如果有的话）
  const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 2048,
    },
  };

  try {
    console.log("[Gemini Call] Sending request to Gemini API");
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("[Gemini Call] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Gemini Error]", response.status, errorText);

      try {
        const errorData = JSON.parse(errorText);
        return { error: `Gemini API (${response.status}): ${errorData.error?.message || errorText}` };
      } catch {
        return { error: `Gemini API error (${response.status})` };
      }
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return { error: "Invalid Gemini response format" };
    }

    console.log("[Gemini Response] Parsing JSON...");

    // 提取 JSON 数据
    const jsonMatch = responseText.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Parse Error] No JSON found in response");
      return { error: "Could not parse response" };
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log("[Gemini Success] Parsed successfully");

    return Array.isArray(result) ? result : [result];
  } catch (err) {
    console.error("[Gemini Fatal Error]", err.message);
    return { error: `API call failed: ${err.message}` };
  }
}
