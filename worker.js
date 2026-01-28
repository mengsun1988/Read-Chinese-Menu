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

    // --- Favicon 处理 (修复了 Base64 并确保逻辑完整) ---
    if (url.pathname === '/favicon.ico') {
      try {
        // 这是一个合法的 1x1 透明 PNG 图片 Base64
        const faviconBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        const binary = atob(faviconBase64);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
        
        return new Response(array, {
          headers: { 
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=604800',
            ...corsHeaders
          }
        });
      } catch (e) {
        return new Response(null, { status: 404 });
      }
    }

    // --- 1. 求生卡翻译接口 (保留) ---
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

    // --- 2. 求生卡获取接口 (保留) ---
    if (request.method === 'GET' && url.pathname === '/api/survival') {
      const list = await env.CARDS_KV.list({ prefix: "card:" });
      const cards = await Promise.all(
        list.keys.map(key => 
          env.CARDS_KV.get(key.name).then(val => val ? JSON.parse(val) : null)
        )
      );
      const filteredCards = cards.filter(c => c !== null && !c.isBanned);
      return new Response(JSON.stringify(filteredCards), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // --- 3. 求生卡提交接口 (保留) ---
    if (request.method === 'POST' && url.pathname === '/api/survival') {
      try {
        const { action, newCard } = await request.json();
        if (action !== 'add' || !newCard?.en || !newCard?.cn) {
          return new Response(JSON.stringify({ error: "Missing content" }), { status: 400, headers: corsHeaders });
        }
        const cardId = `card:${Date.now()}`;
        const cardData = { ...newCard, id: cardId, votes: 0, createdAt: new Date().toISOString() };
        await env.CARDS_KV.put(cardId, JSON.stringify(cardData));

        ctx.waitUntil((async () => {
          try {
            const moderation = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
              messages: [
                { role: "system", content: "Moderator: Reply 'FAIL' if text involves political figures, hate speech, or sensitive politics. Otherwise 'PASS'. One word only." },
                { role: "user", content: `Content: ${newCard.en} | ${newCard.cn}` }
              ]
            });
            if (moderation.response.includes("FAIL")) {
              cardData.isBanned = true;
              await env.CARDS_KV.put(cardId, JSON.stringify(cardData));
            }
          } catch (e) { console.error("Async moderation failed", e); }
        })());

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Submission failed" }), { status: 500, headers: corsHeaders });
      }
    }

    // --- 4. 图像识别核心逻辑 ---
    try {
      const bodyText = await request.text();
      if (!bodyText) throw new Error("Request body is empty");
      const originalBody = JSON.parse(bodyText);
      const { image: base64Image, userId, type = "menu", mode = "standard", name_cn, name_en } = originalBody;

      // Handle credit check request
      if (type === "check_credits") {
        let userData = { credits: 200, scanCount: 0, lastUsed: new Date().toISOString(), passExpiryDate: null };
        if (env.USER_USAGE && userId) {
          const usageDataStr = await env.USER_USAGE.get(userId);
          if (usageDataStr) userData = JSON.parse(usageDataStr);
        }

        const isUnlimited = () => {
          if (!userData.passExpiryDate) return false;
          return new Date(userData.passExpiryDate).getTime() > Date.now();
        };

        return new Response(JSON.stringify({
          credits: userData.credits,
          scanCount: userData.scanCount,
          isUnlimited: isUnlimited(),
          passExpiryDate: userData.passExpiryDate
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

// 新增：每日信用限制
const DAILY_CREDIT_LIMIT = 50;
const CREDIT_RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24小时

let userData = { 
  credits: 200, 
  scanCount: 0, 
  lastUsed: new Date().toISOString(), 
  passExpiryDate: null,
  dailyCredits: DAILY_CREDIT_LIMIT,
  lastCreditReset: Date.now()
};
if (env.USER_USAGE && userId) {
  const usageDataStr = await env.USER_USAGE.get(userId);
  if (usageDataStr) {
    userData = JSON.parse(usageDataStr);
    
    // 检查是否需要重置每日信用
    const now = Date.now();
    const lastReset = new Date(userData.lastCreditReset || 0).getTime();
    
    if (now - lastReset > CREDIT_RESET_INTERVAL) {
      userData.dailyCredits = DAILY_CREDIT_LIMIT;
      userData.lastCreditReset = now;
      // 保存更新后的用户数据
      ctx.waitUntil(env.USER_USAGE.put(userId, JSON.stringify(userData)));
    }
  }
}

const isUnlimited = () => {
  if (!userData.passExpiryDate) return false;
  return new Date(userData.passExpiryDate).getTime() > Date.now();
};

// 修改：检查每日信用限制
if (type === "menu" && !isUnlimited()) {
  // 优先检查每日信用
  if (userData.dailyCredits <= 0) {
    return new Response(JSON.stringify({ 
      error: "DAILY_CREDIT_EXCEEDED", 
      credits: userData.credits,
      dailyCredits: 0,
      resetIn: CREDIT_RESET_INTERVAL - (Date.now() - userData.lastCreditReset)
    }), { 
      status: 429, 
      headers: corsHeaders 
    });
  }
  // 然后检查总信用
  if (userData.credits < 50) {
    return new Response(JSON.stringify({ error: "OUT_OF_CREDITS", credits: userData.credits }), { 
      status: 403, 
      headers: corsHeaders 
    });
  }
}

      const cache = caches.default;
      const cacheKeyUrl = new URL(`https://api.cache/${type}/${encodeURIComponent(name_cn || 'list')}`);
      const cacheKey = new Request(cacheKeyUrl.toString());

      if (type === "dish_detail") {
        let cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) return cachedResponse;
      }

      userData = {
        ...userData,
        qwenWinStreak: userData.qwenWinStreak || 0,
        geminiWinStreak: userData.geminiWinStreak || 0,
        preferredModel: userData.preferredModel || null
      };

      const controller = new AbortController();
      const { signal } = controller;

      const taskQwen = async () => {
        const qwenPayload = {
          model: (type === "dish_detail") ? "qwen-plus" : "qwen3-vl-plus",
          messages: [{
            role: "user",
            content: (type === "dish_detail") 
              ? `CRITICAL: Analyze the dish "${name_cn}". Capture ALL text including faint descriptions or small ingredient lists. Return JSON: { "ingredients": [{"name_cn": "...", "name_en": "..."}], "spiciness_level": 0-5, "pinyin": "mandarin pinyin with tones", "pronunciation": "English phonetic guide", "allergens": ["..."], "description": "Full translation of the dish's secondary/small text or a brief authentic description", "has_animal_fats": true/false }. JSON ONLY.`
              : (type === "street")
                ? [{ type: "text", text: "Identify this shop or restaurant. Return JSON: { name_cn, name_en, type, confidence, description }." }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }]
                : [{ 
                    type: "text", 
                    text: `Analyze this menu. IMPORTANT: Look closely for any small, faint, or grey text directly below each dish name. These are descriptions or ingredients. You MUST extract them. For 'price', extract numbers only. Return JSON {dishes:[]}. Each dish: {name_cn, name_en, price, description, pinyin, pronunciation, spiciness_level}. If small text exists, put its translation in 'description'. JSON ONLY.` 
                  }, { 
                    type: "image_url", 
                    image_url: { url: `data:image/jpeg;base64,${base64Image}` } 
                  }]
          }],
          response_format: { type: "json_object" }
        };
        
        const qwenResponse = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${env.DASHSCOPE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(qwenPayload),
          signal
        });
        
        const qwenData = await qwenResponse.json();
        if (!qwenData.choices?.[0]?.message?.content) throw new Error("Qwen Timeout");
        
        return { 
          source: 'qwen', 
          content: qwenData.choices[0].message.content.trim(),
          raw: qwenData 
        };
      };

      const taskGemini = async () => {
        const prompt = (type === "dish_detail") 
          ? `CRITICAL: Analyze the dish "${name_cn}". Capture ALL text including faint descriptions or small ingredient lists. Return JSON: { "ingredients": [{"name_cn": "...", "name_en": "..."}], "spiciness_level": 0-5, "pinyin": "mandarin pinyin with tones", "pronunciation": "English phonetic guide", "allergens": ["..."], "description": "Full translation of the dish's secondary/small text or a brief authentic description", "has_animal_fats": true/false }. JSON ONLY.`
          : (type === "street")
            ? "Identify this shop or restaurant. Return JSON: { name_cn, name_en, type, confidence, description }."
            : `Analyze this menu. IMPORTANT: Look closely for any small, faint, or grey text directly below each dish name. These are descriptions or ingredients. You MUST extract them. For 'price', extract numbers only. Return JSON {dishes:[]}. Each dish: {name_cn, name_en, price, description, pinyin, pronunciation, spiciness_level}. If small text exists, put its translation in 'description'. JSON ONLY.`;
        
        const payload = {
          contents: [{ 
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ] 
          }],
          generationConfig: { responseMimeType: "application/json" }
        };
        
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal
        });
        
        const geminiData = await geminiResponse.json();
        if (!geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new Error("Gemini Timeout");
        }
        
        return { 
          source: 'gemini', 
          content: geminiData.candidates[0].content.parts[0].text,
          raw: geminiData 
        };
      };

      let winner;
      if (userData.preferredModel === 'qwen') {
        winner = await runWithPreference(taskQwen, taskGemini, controller);
      } else if (userData.preferredModel === 'gemini') {
        winner = await runWithPreference(taskGemini, taskQwen, controller);
      } else {
        winner = await Promise.any([taskQwen(), taskGemini()]);
        controller.abort();
      }

      let content = winner.content.replace(/```json|```/g, "");
      let parsedData = JSON.parse(content);

      let achievementTriggered = null;
      const shouldCharge = type === "menu" && parsedData.dishes && parsedData.dishes.length > 0;

      if (shouldCharge) {
        if (winner.source === 'qwen') { 
          userData.qwenWinStreak = (userData.qwenWinStreak || 0) + 1; 
          userData.geminiWinStreak = 0; 
        } else { 
          userData.geminiWinStreak = (userData.geminiWinStreak || 0) + 1; 
          userData.qwenWinStreak = 0; 
        }
        
        if (userData.qwenWinStreak >= 3) userData.preferredModel = 'qwen';
        if (userData.geminiWinStreak >= 3) userData.preferredModel = 'gemini';

        userData.scanCount += 1;
        if (!isUnlimited()) {
          userData.credits -= 50;
          if (userData.scanCount === 4) { userData.credits += 50; achievementTriggered = "milestone_4"; }
          else if (userData.scanCount === 10) { userData.credits += 50; achievementTriggered = "milestone_10"; }
        }
        userData.lastUsed = new Date().toISOString();
        ctx.waitUntil(env.USER_USAGE.put(userId, JSON.stringify(userData)));
      }

      let responseBody = type === "dish_detail" 
        ? { ...parsedData, isFullyAnalyzed: true, _debug_source: winner.source }
        : type === "street"
        ? { ...parsedData, _debug_source: winner.source }
        : {
            dishes: (parsedData.dishes || []).map((item, index) => ({
              ...item,
              id: `dish-${Date.now()}-${index}`,
              isFullyAnalyzed: mode !== "fast_scan"
            })),
            usage: { 
              credits: userData.credits, 
              scanCount: userData.scanCount, 
              achievementTriggered, 
              isUnlimited: isUnlimited(),
              _debug_source: winner.source
            }
          };

      const finalResponse = new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

      if (type === "dish_detail") ctx.waitUntil(cache.put(cacheKey, finalResponse.clone()));
      return finalResponse;

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: corsHeaders });
    }

    async function runWithPreference(primary, secondary, controller) {
      return new Promise((resolve, reject) => {
        let completed = false;
        primary().then(res => {
          if (!completed) { 
            completed = true; 
            controller.abort(); 
            resolve(res); 
          }
        }).catch(() => {});

        setTimeout(() => {
          if (!completed) {
            secondary().then(res => {
              if (!completed) { 
                completed = true; 
                controller.abort(); 
                resolve(res); 
              }
            }).catch(reject);
          }
      }, 500);
      });
    }

    // --- 5. 支付验证端点 --- 
    if (request.method === 'POST' && url.pathname === '/api/verify-payment') {
      try {
        const { orderId, planId, userId } = await request.json();
        
        const paypalResponse = await fetch(`https://api.paypal.com/v2/checkout/orders/${orderId}/capture`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(env.PAYPAL_CLIENT_ID + ':' + env.PAYPAL_CLIENT_SECRET)}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': `req_${Date.now()}`
          }
        });
        
        if (!paypalResponse.ok) {
          const errorData = await paypalResponse.json();
          throw new Error(`PayPal verification failed: ${errorData.message || 'Unknown error'}`);
        }
        
        let userData = { credits: 200, scanCount: 0, lastUsed: new Date().toISOString(), passExpiryDate: null };
        if (env.USER_USAGE && userId) {
          const usageDataStr = await env.USER_USAGE.get(userId);
          if (usageDataStr) userData = JSON.parse(usageDataStr);
        }

        const currentExpiry = userData.passExpiryDate ? new Date(userData.passExpiryDate) : new Date();
        const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
        let msToAdd = 0;
        
        if (planId.endsWith('-day')) {
          const days = parseInt(planId.split('-')[0]);
          msToAdd = days * 86400000;
        }
        
        userData.passExpiryDate = new Date(baseTime + msToAdd).toISOString();
        await env.USER_USAGE.put(userId, JSON.stringify(userData));
        
        return new Response(JSON.stringify({ 
          success: true,
          passExpiryDate: userData.passExpiryDate,
          isUnlimited: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
          status: 400, 
          headers: corsHeaders 
        });
      }
    }
  }
}
