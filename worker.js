/**
 * Cloudflare Worker - Gemini API Integration
 * 处理菜单和店铺识别请求，并调用 Google Gemini API
 */

export default {
  async fetch(request, env, ctx) {
    // CORS 预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // 只允许 POST 请求
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST allowed" }),
        { 
          status: 405,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    try {
      const body = await request.json();
      const { image, type } = body;

      if (!image || !type) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Missing required fields: image, type",
            dishes: []
          }),
          { 
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      const geminiApiKey = env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        console.error("[Worker] GEMINI_API_KEY not found in environment variables");
        return new Response(
          JSON.stringify({
            ok: false,
            error: "API key not configured",
            dishes: []
          }),
          { 
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      // 构建 Gemini API 请求
      const prompt = type === "menu"
        ? `You are a Chinese restaurant menu analyzer. Analyze this menu image and extract all dishes. For each dish, provide:
1. Chinese name (dish_name_cn)
2. English translation (dish_name_en)
3. Pinyin (pinyin)
4. Pronunciation guide in English (pronunciation_guide)
5. Description of the dish (description)
6. Classic/common ingredients (classic_ingredients as array of {name_en, name_cn})
7. Potential ingredients based on the dish (potential_ingredients)
8. Spiciness level 0-5 (spiciness)
9. Common allergens (allergens as array)
10. Whether it's vegetarian (is_vegetarian)
11. Whether it contains animal fats (has_animal_fats)
12. Price if visible (price)

Return ONLY valid JSON array of dish objects. Each ingredient object should have name_en and name_cn properties.`
        : `You are a Chinese storefront analyzer. Analyze this storefront/street image and provide:
1. Store name if visible (store_name)
2. Address if visible (address)
3. Type of store/restaurant (store_type)
4. Visible signage text (signage)
5. Overall description (description)

Return ONLY valid JSON object with these properties. If not visible, use null or empty string.`;

      // 调用 Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                  {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: image, // Base64 编码的图片
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              topK: 32,
              topP: 1,
              maxOutputTokens: 4096,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("[Worker] Gemini API error:", errorData);
        return new Response(
          JSON.stringify({
            ok: false,
            error: `Gemini API error: ${response.status}`,
            dishes: []
          }),
          { 
            status: response.status,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      const geminiData = await response.json();
      const content = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "No content from Gemini API",
            dishes: []
          }),
          { 
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      // 解析 JSON 响应
      let result;
      try {
        // 尝试提取 JSON（可能被包装在 markdown 代码块中）
        let jsonString = content;
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonString = jsonMatch[1];
        }
        result = JSON.parse(jsonString);
      } catch (parseError) {
        console.error("[Worker] JSON parse error:", parseError);
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Failed to parse API response",
            dishes: type === "menu" ? [] : {}
          }),
          { 
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      // 为菜单添加默认值
      if (type === "menu" && Array.isArray(result)) {
        result = result.map(dish => ({
          dish_name_cn: dish.dish_name_cn || "",
          dish_name_en: dish.dish_name_en || "",
          pinyin: dish.pinyin || "",
          pronunciation_guide: dish.pronunciation_guide || "",
          description: dish.description || "",
          classic_ingredients: dish.classic_ingredients || [],
          potential_ingredients: dish.potential_ingredients || [],
          spiciness: dish.spiciness ?? 0,
          allergens: dish.allergens || [],
          is_vegetarian: dish.is_vegetarian ?? false,
          has_animal_fats: dish.has_animal_fats ?? false,
          price: dish.price || "",
        }));
      }

      return new Response(
        JSON.stringify({
          ok: true,
          [type === "menu" ? "dishes" : "store"]: result,
        }),
        { 
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    } catch (error) {
      console.error("[Worker] Error:", error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: error.message || "Internal server error",
          dishes: []
        }),
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
};
