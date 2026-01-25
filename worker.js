export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // ==========================================
    // --- 1. 求生卡众包接口 ---
    // ==========================================
    if (request.method === 'POST' && url.pathname === '/api/survival/translate') {
      try {
        const { text } = await request.json();
        const aiResponse = await env.AI.run("@cf/meta/m2m100-1.2b", {
          text: text,
          target_lang: "chinese",
        });
        return new Response(JSON.stringify({ translation: aiResponse.translated_text }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Translation failed" }), { status: 500, headers: corsHeaders });
      }
    }

    if (request.method === 'GET' && url.pathname === '/api/survival') {
      const list = await env.CARDS_KV.list({ prefix: "card:" });
      const cards = [];
      for (const key of list.keys) {
        const val = await env.CARDS_KV.get(key.name);
        if (val) cards.push(JSON.parse(val));
      }
      return new Response(JSON.stringify(cards), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==========================================
    // --- 2. 图像识别核心逻辑 ---
    // ==========================================
    try {
      const bodyText = await request.text();
      if (!bodyText) throw new Error("Request body is empty");
      const originalBody = JSON.parse(bodyText);
      
      const base64Image = originalBody.image;
      const userId = originalBody.userId;
      const type = originalBody.type || "menu";
      const mode = originalBody.mode || "standard"; 
      const name_cn = originalBody.name_cn;
      const name_en = originalBody.name_en;

      const cache = caches.default;
      const cacheKeyUrl = new URL(`https://api.cache/${type}/${encodeURIComponent(name_cn || 'list')}`);
      const cacheKey = new Request(cacheKeyUrl.toString());

      if (type === "dish_detail") {
        let cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) return cachedResponse;
      }

      // 额度检查
      let currentCredits = 15;
      const today = new Date().toISOString().split('T')[0];
      if (env.USER_USAGE && userId && type === "menu") {
        const usageDataStr = await env.USER_USAGE.get(userId);
        if (usageDataStr) {
          let usageData = JSON.parse(usageDataStr);
          const lastUsedDate = usageData.lastUsed ? usageData.lastUsed.split('T')[0] : "";
          currentCredits = (lastUsedDate !== today) ? 15 : usageData.credits;
        }
        if (currentCredits <= 0) {
          return new Response(JSON.stringify({ error: "OUT_OF_CREDITS" }), { status: 403, headers: corsHeaders });
        }
      }

      const QWEN_API_KEY = env.DASHSCOPE_API_KEY;
      const QWEN_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
      let qwenPayload;

      // --- 模型配置 ---
      const MODEL_NAME = "qwen3-vl-plus"; // 严格使用指定的模型名称

      // 核心业务逻辑说明：红油判断逻辑
      const specialInstructions = "Logic: If dish name contains '红油' (Red Oil), set spiciness_level >= 3 and note it likely contains beef tallow or lard.";

      if (type === "dish_detail") {
        qwenPayload = {
          model: "qwen-plus", 
          messages: [{
            role: "user",
            content: `Deep analyze "${name_cn}" (${name_en}). ${specialInstructions} Return JSON: { "ingredients": [{"name_cn": "...", "name_en": "..."}], "spiciness_level": 0-5, "allergens": ["..."], "description": "1 brief sentence", "has_animal_fats": true/false }`
          }],
          response_format: { type: "json_object" }
        };
      } else if (type === "storefront") {
        qwenPayload = {
          model: MODEL_NAME, 
          messages: [{
            role: "user",
            content: [
              { type: "text", text: "Identify shop. JSON: name_cn, name_en, cuisine, description, rating." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
            ]
          }],
          response_format: { type: "json_object" }
        };
      } else {
        // 菜单识别模式：修正食材为中英双语对象
        const fastPrompt = `Extract dishes. ${specialInstructions} Return JSON: { "dishes": [{"name_cn": "...", "name_en": "...", "price": "...", "ingredients": [{"name_cn": "...", "name_en": "..."}]}] }. NO full descriptions.`;
        const standardPrompt = `Analyze menu. ${specialInstructions} Return JSON: { "dishes": [{"name_cn": "...", "name_en": "...", "price": "...", "description": "...", "ingredients": [{"name_cn": "...", "name_en": "..."}], "spiciness_level": 0-5}] }`;
        
        qwenPayload = {
          model: MODEL_NAME,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: mode === "fast_scan" ? fastPrompt : standardPrompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
            ]
          }],
          response_format: { type: "json_object" }
        };
      }

      const qwenResponse = await fetch(QWEN_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${QWEN_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(qwenPayload)
      });

      const qwenData = await qwenResponse.json();
      if (!qwenData.choices?.[0]?.message?.content) throw new Error("AI Timeout");

      let content = qwenData.choices[0].message.content.trim();
      let parsedData = JSON.parse(content.replace(/```json|```/g, ""));

      let responseBody;
      if (type === "dish_detail") {
        responseBody = { ...parsedData, isFullyAnalyzed: true };
      } else if (type === "storefront") {
        responseBody = parsedData;
      } else {
        const dishes = parsedData.dishes || [];
        responseBody = dishes.map((item, index) => ({
          ...item,
          id: `dish-${Date.now()}-${index}`,
          isFullyAnalyzed: mode !== "fast_scan"
        }));

        if (env.DISH_CACHE) {
          ctx.waitUntil((async () => {
            const historyStr = await env.DISH_CACHE.get("recent_dishes");
            let history = JSON.parse(historyStr || "[]");
            let updatedHistory = [...responseBody.slice(0, 5), ...history];
            await env.DISH_CACHE.put("recent_dishes", JSON.stringify(updatedHistory.slice(0, 30)));
          })());
        }
      }

      const finalResponse = new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=3600' }
      });

      if (type === "dish_detail") ctx.waitUntil(cache.put(cacheKey, finalResponse.clone()));
      if (env.USER_USAGE && userId && type === "menu") {
        ctx.waitUntil(env.USER_USAGE.put(userId, JSON.stringify({ credits: currentCredits - 1, lastUsed: new Date().toISOString() })));
      }

      return finalResponse;

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: corsHeaders });
    }
  }
};