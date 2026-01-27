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

    // --- 1. 求生卡众包接口 ---
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

    // --- 2. 图像识别核心逻辑 ---
    try {
      const bodyText = await request.text();
      if (!bodyText) throw new Error("Request body is empty");
      const originalBody = JSON.parse(bodyText);
      
      const { image: base64Image, userId, type = "menu", mode = "standard", name_cn, name_en } = originalBody;

      // --- 用户数据初始化 ---
      let userData = { credits: 150, scanCount: 0, lastUsed: new Date().toISOString(), passExpiryDate: null };
      if (env.USER_USAGE && userId) {
        const usageDataStr = await env.USER_USAGE.get(userId);
        if (usageDataStr) userData = JSON.parse(usageDataStr);
      }

      const isUnlimited = () => {
        if (!userData.passExpiryDate) return false;
        return new Date(userData.passExpiryDate).getTime() > Date.now();
      };

      // 菜单识别计费检查
      if (type === "menu") {
        if (!isUnlimited() && userData.credits < 50) {
          return new Response(JSON.stringify({ error: "OUT_OF_CREDITS", credits: userData.credits }), { status: 403, headers: corsHeaders });
        }
      }

      const cache = caches.default;
      const cacheKeyUrl = new URL(`https://api.cache/${type}/${encodeURIComponent(name_cn || 'list')}`);
      const cacheKey = new Request(cacheKeyUrl.toString());

      if (type === "dish_detail") {
        let cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) return cachedResponse;
      }

      const QWEN_API_KEY = env.DASHSCOPE_API_KEY;
      const QWEN_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
      const MODEL_NAME = "qwen3-vl-plus"; 

      let qwenPayload;
      if (type === "dish_detail") {
        qwenPayload = {
          model: "qwen-plus", 
          messages: [{
            role: "user",
            content: `Deep analyze "${name_cn}". Return JSON: { 
              "ingredients": [{"name_cn": "...", "name_en": "..."}], 
              "spiciness_level": 0-5, 
              "pinyin": "mandarin pinyin with tones",
              "pronunciation": "English phonetic guide",
              "allergens": ["..."], 
              "description": "1 brief sentence", 
              "has_animal_fats": true/false 
            }`
          }],
          response_format: { type: "json_object" }
        };
      } else {
        qwenPayload = {
          model: MODEL_NAME,
          messages: [{
            role: "user",
            content: [{ 
              type: "text", 
              text: `Analyze menu. Return JSON with "dishes" array. Each MUST have: "name_cn", "name_en", "price", "pinyin", "pronunciation", "spiciness_level".` 
            }, { 
              type: "image_url", 
              image_url: { url: `data:image/jpeg;base64,${base64Image}` } 
            }]
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

      // 计费与成就逻辑
      let achievementTriggered = null;
      if (type === "menu") {
        userData.scanCount += 1;
        if (!isUnlimited()) {
          userData.credits -= 50;
          if (userData.scanCount === 4) { userData.credits += 50; achievementTriggered = "milestone_4"; }
          else if (userData.scanCount === 10) { userData.credits += 100; achievementTriggered = "milestone_10"; }
        }
        userData.lastUsed = new Date().toISOString();
        ctx.waitUntil(env.USER_USAGE.put(userId, JSON.stringify(userData)));
      }

      let responseBody;
      if (type === "dish_detail") {
        responseBody = { ...parsedData, isFullyAnalyzed: true };
      } else {
        responseBody = {
          dishes: (parsedData.dishes || []).map((item, index) => ({
            ...item,
            id: `dish-${Date.now()}-${index}`,
            isFullyAnalyzed: mode !== "fast_scan"
          })),
          usage: { credits: userData.credits, scanCount: userData.scanCount, achievementTriggered, isUnlimited: isUnlimited() }
        };
      }

      const finalResponse = new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

      if (type === "dish_detail") ctx.waitUntil(cache.put(cacheKey, finalResponse.clone()));
      return finalResponse;

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: corsHeaders });
    }
  }
};