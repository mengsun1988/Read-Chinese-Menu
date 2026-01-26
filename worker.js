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
    // --- 1. 求生卡众包接口 (保持原样) ---
    // ==========================================
    if (request.method === 'POST' && url.pathname === '/api/survival/translate') {
      try {
        const { text } = await request.json();
        const aiResponse = await env.AI.run("@cf/meta/m2m100-1.2b", {
          text: text,
          target_lang: "chinese",
        });
        
        const categories = ["Safety", "Dining", "Payment", "Taxi", "Health", "Station", "Street", "Sightseeing", "Hotel", "Help"];
        const categoryPrompt = `Classify this phrase into one of these categories: ${categories.join(', ')}. Phrase: "${text}"`;
        const categoryResponse = await env.AI.run("@cf/meta-llama/llama-2-7b-chat-fp16", { prompt: categoryPrompt });
        
        let determinedCategory = "Help";
        const categoryText = categoryResponse.response.toLowerCase();
        for (const cat of categories) {
          if (categoryText.includes(cat.toLowerCase())) {
            determinedCategory = cat;
            break;
          }
        }
        
        return new Response(JSON.stringify({ 
          translation: aiResponse.translated_text,
          category: determinedCategory
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Processing failed" }), { status: 500, headers: corsHeaders });
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
    // --- 2. 每日分享奖励接口 ---
    // ==========================================
    if (request.method === 'POST' && url.pathname === '/api/user/share') {
      try {
        const { userId } = await request.json();
        const usageStr = await env.USER_USAGE.get(userId);
        let userData = usageStr ? JSON.parse(usageStr) : { credits: 150, scanCount: 0 };
        
        const today = new Date().toISOString().split('T')[0];
        if (userData.lastShareDate === today) {
          return new Response(JSON.stringify({ error: "ALREADY_SHARED_TODAY" }), { status: 400, headers: corsHeaders });
        }

        userData.credits += 50;
        userData.lastShareDate = today;
        await env.USER_USAGE.put(userId, JSON.stringify(userData));

        return new Response(JSON.stringify({ success: true, credits: userData.credits }), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    // ==========================================
    // --- 3. 图像识别核心逻辑 (修复 Day Pass 闭环) ---
    // ==========================================
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

      // 【核心改动】定义无限模式检查逻辑
      const isUnlimited = () => {
        if (!userData.passExpiryDate) return false;
        return new Date(userData.passExpiryDate).getTime() > Date.now();
      };

      // 仅菜单识别需要检查权限
      if (type === "menu") {
        // 如果没有无限通行证 且 点数不足 50
        if (!isUnlimited() && userData.credits < 50) {
          return new Response(JSON.stringify({ 
            error: "OUT_OF_CREDITS", 
            scanCount: userData.scanCount,
            credits: userData.credits 
          }), { status: 403, headers: corsHeaders });
        }
      }

      // 缓存、API 负载等逻辑保持原样...
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
          messages: [{ role: "user", content: `Deep analyze "${name_cn}". Return JSON: { "ingredients": [{"name_cn": "...", "name_en": "..."}], "spiciness_level": 0-5, "allergens": ["..."], "description": "1 brief sentence", "has_animal_fats": true/false }` }],
          response_format: { type: "json_object" }
        };
      } else if (type === "storefront") {
        qwenPayload = {
          model: MODEL_NAME, 
          messages: [{ role: "user", content: [{ type: "text", text: "Identify shop. JSON: name_cn, name_en, cuisine, description, rating." }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }] }],
          response_format: { type: "json_object" }
        };
      } else {
        qwenPayload = {
          model: MODEL_NAME,
          messages: [{ role: "user", content: [{ type: "text", text: mode === "fast_scan" ? "Extract ALL dishes JSON" : "Analyze menu JSON" }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }] }],
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

      // --- 【核心改动】计费逻辑闭环 ---
      let achievementTriggered = null;
      if (type === "menu") {
        userData.scanCount += 1;
        
        // 只有在非无限模式下才扣除点数
        if (!isUnlimited()) {
          userData.credits -= 50;

          // 点数奖励逻辑
          if (userData.scanCount === 4) {
            userData.credits += 50;
            achievementTriggered = "milestone_4";
          } else if (userData.scanCount === 10) {
            userData.credits += 100;
            achievementTriggered = "milestone_10";
          }
        }

        userData.lastUsed = new Date().toISOString();
        ctx.waitUntil(env.USER_USAGE.put(userId, JSON.stringify(userData)));
      }

      let responseBody;
      if (type === "dish_detail") {
        responseBody = { ...parsedData, isFullyAnalyzed: true };
      } else if (type === "storefront") {
        responseBody = parsedData;
      } else {
        responseBody = {
          dishes: (parsedData.dishes || []).map((item, index) => ({
            ...item,
            id: `dish-${Date.now()}-${index}`,
            isFullyAnalyzed: mode !== "fast_scan"
          })),
          usage: {
            credits: userData.credits,
            scanCount: userData.scanCount,
            achievementTriggered,
            isUnlimited: isUnlimited() // 返回给前端当前的无限状态
          }
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