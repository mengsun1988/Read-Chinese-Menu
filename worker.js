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
    // --- 1. 求生卡众包接口 (使用 CARDS_KV) ---
    // ==========================================

    // 新增：智能翻译接口 (供用户提交前预览)
    if (request.method === 'POST' && url.pathname === '/api/survival/translate') {
      try {
        const { text } = await request.json();
        if (!text) throw new Error("No text provided");

        // 使用 Cloudflare 内置 AI 模型进行翻译
        const aiResponse = await env.AI.run("@cf/meta/m2m100-1.2b", {
          text: text,
          target_lang: "chinese",
        });

        return new Response(JSON.stringify({ translation: aiResponse.translated_text }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Translation failed", detail: err.message }), { 
          status: 500, headers: corsHeaders 
        });
      }
    }
    
    // 获取社区求生卡 (优化逻辑)
    if (request.method === 'GET' && url.pathname === '/api/survival') {
      try {
        const list = await env.CARDS_KV.list({ prefix: "card:" });
        // 使用 Promise.all 并行获取，提高大数据量下的响应速度
        const cards = await Promise.all(
          list.keys.map(async (key) => {
            const val = await env.CARDS_KV.get(key.name);
            return val ? JSON.parse(val) : null;
          })
        );
        
        return new Response(JSON.stringify(cards.filter(c => c !== null)), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response("[]", { headers: corsHeaders });
      }
    }

    // 提交新卡片或投票
    if (request.method === 'POST' && url.pathname === '/api/survival') {
      try {
        const data = await request.json();
        const { action, cardId, delta, newCard } = data;

        if (action === 'add' && newCard) {
          const id = `card:${Date.now()}`;
          const cardData = {
            ...newCard,
            id: id,
            votes: 0,
            status: 'pending',
            createdAt: new Date().toISOString()
          };
          await env.CARDS_KV.put(id, JSON.stringify(cardData));
          return new Response(JSON.stringify(cardData), { headers: corsHeaders });
        } 

        if (action === 'vote' && cardId) {
          const val = await env.CARDS_KV.get(cardId);
          if (!val) return new Response("Not Found", { status: 404, headers: corsHeaders });
          
          let card = JSON.parse(val);
          card.votes = (card.votes || 0) + (delta || 0);

          // 众包自动规则
          if (card.votes <= -5) {
            await env.CARDS_KV.delete(cardId); 
            return new Response(JSON.stringify({ deleted: true }), { headers: corsHeaders });
          }
          // 满10分自动转为 verified
          if (card.votes >= 10) card.status = 'verified';

          await env.CARDS_KV.put(cardId, JSON.stringify(card));
          return new Response(JSON.stringify(card), { headers: corsHeaders });
        }
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    // ==========================================
    // --- 2. 原有历史记录接口 (保留) ---
    // ==========================================
    if (request.method === 'GET' && url.pathname === '/api/history') {
      try {
        const history = await env.DISH_CACHE.get("recent_dishes");
        return new Response(history || "[]", {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response("[]", { headers: corsHeaders });
      }
    }

    // ==========================================
    // --- 3. 原有图像识别与模型调用 (保留且未修改) ---
    // ==========================================
    try {
      const bodyText = await request.text();
      if (!bodyText) throw new Error("Request body is empty");
      const originalBody = JSON.parse(bodyText);
      
      const base64Image = originalBody.image;
      const userId = originalBody.userId;
      const type = originalBody.type || "menu";
      const name_cn = originalBody.name_cn;
      const name_en = originalBody.name_en;

      const cache = caches.default;
      const cacheKeyUrl = new URL(`https://api.cache/${type}/${encodeURIComponent(name_cn || 'none')}`);
      const cacheKey = new Request(cacheKeyUrl.toString());

      if (type === "dish_detail") {
        let cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) {
          return new Response(cachedResponse.body, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
          });
        }
      }

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
          return new Response(JSON.stringify({ 
            error: "OUT_OF_CREDITS", 
            message: "Today's free credits (15) have been used up. Resets tomorrow!" 
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      const QWEN_API_KEY = env.DASHSCOPE_API_KEY;
      const QWEN_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
      let qwenPayload;

      if (type === "dish_detail") {
        qwenPayload = {
          model: "qwen-plus",
          messages: [{ 
            role: "user", 
            content: `Deep analysis for "${name_cn}" (${name_en}). Return JSON: { "ingredients": [{"name_cn": "...", "name_en": "..."}], "spiciness_level": 0-5, "allergens": ["..."], "pinyin": "...", "has_animal_fats": true/false }` 
          }],
          response_format: { type: "json_object" }
        };
      } else if (type === "storefront") {
        qwenPayload = {
          model: "qwen3-vl-plus",
          messages: [{ 
            role: "user", 
            content: [
              { type: "text", text: "Identify this shop. Return JSON: name_cn, name_en, cuisine, description (max 2 sentences), rating (0-5), address. Be concise." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
            ] 
          }],
          response_format: { type: "json_object" }
        };
      } else {
        qwenPayload = {
          model: "qwen3-vl-plus",
          messages: [{ 
            role: "user", 
            content: [
              { type: "text", text: "Analyze menu. Return JSON: { \"dishes\": [{\"name_cn\": \"...\", \"name_en\": \"...\", \"price\": \"...\", \"description\": \"...\", \"ingredients\": [{\"name_cn\": \"...\", \"name_en\": \"...\"}], \"spiciness_level\": 0-5, \"pinyin\": \"...\"}] }" },
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
      if (!qwenData.choices?.[0]?.message?.content) throw new Error("AI returned empty content");

      let content = qwenData.choices[0].message.content.trim();
      if (content.startsWith("```json")) content = content.replace(/^```json/, "").replace(/```$/, "");
      let parsedData = JSON.parse(content);

      let responseBody;
      if (type === "storefront") {
        responseBody = {
          name: parsedData.name_cn || parsedData.name || "Unknown Store",
          name_en: parsedData.name_en || "Local Business",
          cuisine: parsedData.cuisine || "Establishment",
          description: parsedData.description || "A local storefront in China.",
          rating: Number(parsedData.rating || 4.5),
          address: parsedData.address || "Main Street"
        };
      } else if (type === "dish_detail") {
        responseBody = {
          ...parsedData,
          ingredients: (parsedData.ingredients || []).map(i => ({
            name_cn: i.name_cn || "未知",
            name_en: i.name_en || "Unknown"
          }))
        };
      } else {
        const dishes = Array.isArray(parsedData) ? parsedData : (parsedData.dishes || []);
        responseBody = dishes.map((item, index) => ({
          id: item.id || `dish-${Date.now()}-${index}`,
          name_cn: item.name_cn || item.name || "未知菜品",
          name_en: item.name_en || item.english_name || "Unknown",
          price: String(item.price || "MKT"),
          description: item.description || "",
          ingredients: (item.ingredients || []).map(i => ({
            name_cn: typeof i === 'string' ? i : (i.name_cn || "未知"),
            name_en: typeof i === 'string' ? i : (i.name_en || "Unknown")
          })),
          spiciness_level: Number(item.spiciness_level || 0),
          pinyin: item.pinyin || "",
          _provider: "qwen3-vl-plus"
        }));

        if (env.DISH_CACHE) {
          ctx.waitUntil((async () => {
            const historyStr = await env.DISH_CACHE.get("recent_dishes");
            let history = JSON.parse(historyStr || "[]");
            const newEntries = responseBody.filter(d => d.name_cn !== "未知菜品");
            let updatedHistory = [...newEntries, ...history];
            const uniqueHistory = [];
            const seen = new Set();
            for (const item of updatedHistory) {
              if (!seen.has(item.name_cn)) {
                seen.add(item.name_cn);
                uniqueHistory.push(item);
              }
            }
            await env.DISH_CACHE.put("recent_dishes", JSON.stringify(uniqueHistory.slice(0, 30)));
          })());
        }
      }

      const finalResponse = new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=3600'
        }
      });

      if (type === "dish_detail") {
        ctx.waitUntil(cache.put(cacheKey, finalResponse.clone()));
      }

      if (env.USER_USAGE && userId && type === "menu") {
        ctx.waitUntil(env.USER_USAGE.put(userId, JSON.stringify({ 
          credits: currentCredits - 1, 
          lastUsed: new Date().toISOString()
        })));
      }

      return finalResponse;

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};