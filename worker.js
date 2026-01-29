export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 预检请求处理
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // --- 辅助函数：统一获取/初始化用户信息 ---
    async function getUserData(userId) {
      const defaultData = {
        credits: 200,          // 初始200点
        scanCount: 0,
        shareCount: 0,         // 分享总上限5次
        gameWinCount: 0,       // 游戏总上限5次
        lastShareDate: null,   // 限制每日1次分享
        passExpiryDate: null,
        lastUsed: new Date().toISOString()
      };
      if (!userId) return defaultData;
      const dataStr = await env.USER_USAGE.get(userId);
      if (!dataStr) return defaultData;
      const savedData = JSON.parse(dataStr);
      return { ...defaultData, ...savedData };
    }

    // --- 1. 求生卡：获取列表 ---
    if (request.method === 'GET' && url.pathname === '/api/survival') {
      const list = await env.CARDS_KV.list({ prefix: "card:" });
      const cards = await Promise.all(
        list.keys.map(k => env.CARDS_KV.get(k.name).then(v => JSON.parse(v)))
      );
      return new Response(JSON.stringify(cards.filter(c => !c.isBanned)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // --- 2. 求生卡：翻译接口 ---
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

    // --- 3. 动作奖励：分享与游戏 ---
    if (request.method === 'POST' && url.pathname === '/api/user-action') {
      try {
        const { userId, action } = await request.json();
        
        // 安全验证：检查必要参数
        if (!userId || !action) {
          return new Response(JSON.stringify({ error: "Missing required parameters" }), { 
            status: 400, headers: corsHeaders 
          });
        }
        
        // 频率限制：防止滥用
        const rateLimitKey = `rate_limit:action:${userId}`;
        const rateLimitData = await env.USER_USAGE.get(rateLimitKey);
        const now = Date.now();
        if (rateLimitData) {
          const { count, resetTime } = JSON.parse(rateLimitData);
          if (now < resetTime) {
            if (count >= 10) {
              return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), { 
                status: 429, headers: corsHeaders 
              });
            }
            await env.USER_USAGE.put(rateLimitKey, JSON.stringify({ count: count + 1, resetTime }), { expirationTtl: 60 });
          } else {
            await env.USER_USAGE.put(rateLimitKey, JSON.stringify({ count: 1, resetTime: now + 60000 }), { expirationTtl: 60 });
          }
        } else {
          await env.USER_USAGE.put(rateLimitKey, JSON.stringify({ count: 1, resetTime: now + 60000 }), { expirationTtl: 60 });
        }
        
        let userData = await getUserData(userId);
        let achievementTriggered = null;

        if (action === 'share') {
          const today = new Date().toISOString().split('T')[0];
          if (userData.shareCount < 5 && userData.lastShareDate !== today) {
            userData.credits += 50;
            userData.shareCount += 1;
            userData.lastShareDate = today;
            achievementTriggered = "share_bonus";
          }
        } else if (action === 'game_win') {
          if (userData.gameWinCount < 5) {
            userData.credits += 10;
            userData.gameWinCount += 1;
            achievementTriggered = "game_bonus";
          }
        }

        await env.USER_USAGE.put(userId, JSON.stringify(userData));
        return new Response(JSON.stringify({ userData, achievementTriggered }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: corsHeaders });
      }
    }

    // --- 4. 识别核心：点数预检与竞速识别 ---
    const isScanPath = url.pathname === '/' || url.pathname.includes('scan');
    
    if (request.method === 'POST' && isScanPath) {
      try {
        const { image: base64Image, userId, type = "menu", name_cn } = await request.json();
        
        if (!userId || !base64Image) {
          return new Response(JSON.stringify({ error: "Missing required parameters (userId or image)" }), { 
            status: 400, headers: corsHeaders 
          });
        }
        
        const rateLimitKey = `rate_limit:${userId}`;
        const rateLimitData = await env.USER_USAGE.get(rateLimitKey);
        const now = Date.now();
        if (rateLimitData) {
          const { count, resetTime } = JSON.parse(rateLimitData);
          if (now < resetTime) {
            if (count >= 30) {
              return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), { 
                status: 429, headers: corsHeaders 
              });
            }
            await env.USER_USAGE.put(rateLimitKey, JSON.stringify({ count: count + 1, resetTime }), { expirationTtl: 60 });
          } else {
            await env.USER_USAGE.put(rateLimitKey, JSON.stringify({ count: 1, resetTime: now + 60000 }), { expirationTtl: 60 });
          }
        } else {
          await env.USER_USAGE.put(rateLimitKey, JSON.stringify({ count: 1, resetTime: now + 60000 }), { expirationTtl: 60 });
        }
        
        let userData = await getUserData(userId);
        const isDevMode = env.ENABLE_DEV_MODE === "true";
        const isUnlimited = isDevMode || (userData.passExpiryDate && new Date(userData.passExpiryDate).getTime() > Date.now());

        // 仅在菜单模式下预检点数
        if (type === "menu" && !isUnlimited && userData.credits < 50) {
          return new Response(JSON.stringify({ error: "OUT_OF_CREDITS", credits: userData.credits }), {
            status: 403, headers: corsHeaders
          });
        }

        const controller = new AbortController();
        const taskQwen = async () => {
          const payload = {
            model: type === "dish_detail" ? "qwen-plus" : "qwen3-vl-plus",
            messages: [{
              role: "user",
              content: type === "dish_detail" 
                ? `Analyze "${name_cn}". Return JSON: { "classic_ingredients": [{"name_cn": "...", "name_en": "..."}], "potential_ingredients": [{"name_cn": "...", "name_en": "..."}], "spiciness_level": 0-5, "pinyin": "", "pronunciation": "", "allergens": [], "description": "", "has_animal_fats": true/false }.`
                : [{ type: "text", text: "Identify all dishes. For EACH dish, you MUST return: 'name_cn', 'name_en', 'price', 'description' (MUST be in English), 'ingredients' (array of strings), 'pinyin', and 'spiciness_level' (0-5). Return valid JSON {dishes: []}." }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }]
            }],
            response_format: { type: "json_object" }
          };
          const res = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
            method: 'POST', headers: { 'Authorization': `Bearer ${env.DASHSCOPE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload), signal: controller.signal
          });
          const d = await res.json();
          if (d.error) throw new Error("Qwen Error: " + d.error.message);
          return { source: 'qwen', content: d.choices[0].message.content };
        };

        const taskGemini = async () => {
          const prompt = type === "dish_detail" ? `Detail for "${name_cn}" in JSON` : "Scan this menu. Return a JSON object with a 'dishes' array. For each dish, you MUST include: 'name_cn', 'name_en', 'price', 'description' (in English), 'ingredients' (array of strings), 'pinyin', 'pronunciation', and 'spiciness_level'. If a field is unknown, provide an empty string or 0, do not omit it. JSON ONLY.";
          const payload = {
            contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64Image } }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
          };
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload), signal: controller.signal
          });
          const d = await res.json();
          if (d.error) throw new Error("Gemini Error: " + d.error.message);
          return { source: 'gemini', content: d.candidates[0].content.parts[0].text };
        };

        // 竞速执行
        const winner = await Promise.any([taskQwen(), taskGemini()]);
        controller.abort();
        
        const parsedData = JSON.parse(winner.content.replace(/```json|```/g, ""));
        let achievementTriggered = null;

        // 获取最新用户数据
        userData = await getUserData(userId);
        const isUnlimitedNow = (env.ENABLE_DEV_MODE === "true") || (userData.passExpiryDate && new Date(userData.passExpiryDate).getTime() > Date.now());
        
        // --- 核心扣费逻辑修改：精准判断是否识别成功 ---
        const isMenuSuccess = type === "menu" && Array.isArray(parsedData.dishes) && parsedData.dishes.length > 0;
        const isDetailSuccess = type === "dish_detail" && (parsedData.classic_ingredients || parsedData.description);

        // 只有在成功识别的情况下才进行后续处理
        if (isMenuSuccess || isDetailSuccess) {
          userData.lastUsed = new Date().toISOString();

          // 只有菜单识别成功才扣 50 点
          if (isMenuSuccess) {
            userData.scanCount += 1;

            if (!isUnlimitedNow) {
              userData.credits = Math.max(0, userData.credits - 50);

              // 里程碑奖励逻辑
              if (userData.scanCount === 4) { userData.credits += 50; achievementTriggered = "milestone_4"; }
              else if (userData.scanCount === 10) { userData.credits += 50; achievementTriggered = "milestone_10"; }
              else if (userData.scanCount === 20) { userData.credits += 50; achievementTriggered = "milestone_20"; }
            }
          }

          // 只要识别成功（无论 menu 还是 detail），就将更新后的数据存入 KV
          await env.USER_USAGE.put(userId, JSON.stringify(userData));
        }

        return new Response(JSON.stringify({
          ...parsedData,
          usage: { 
            ...userData, 
            isUnlimited: isUnlimitedNow, 
            achievementTriggered, 
            _debug_source: winner.source 
          }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      } catch (err) {
        return new Response(JSON.stringify({ error: "Service busy or AI failed: " + err.message }), { 
          status: 500, 
          headers: corsHeaders 
        });
      }
    }

    // --- 5. 支付验证 ---
    if (request.method === 'POST' && (url.pathname === '/api/verify-payment' || url.pathname === '/api/verify_order')) {
      try {
        const { orderId, planId, userId, isDonation } = await request.json();
        
        if (!orderId || !planId || !userId) {
          return new Response(JSON.stringify({ error: "Missing required parameters" }), { 
            status: 400, headers: corsHeaders 
          });
        }
        
        const validPlanIds = ['soda', 'coffee', 'cheesecake', '3-day', '7-day', '15-day', 'pack-150', 'pack-400', 'pack-1000'];
        if (!validPlanIds.includes(planId) && !planId.startsWith('pack-')) {
          return new Response(JSON.stringify({ error: "Invalid plan ID" }), { status: 400, headers: corsHeaders });
        }
        
        const processedKey = `order_processed:${orderId}`;
        const alreadyProcessed = await env.USER_USAGE.get(processedKey);
        if (alreadyProcessed) {
          const currentData = await getUserData(userId);
          return new Response(JSON.stringify({ success: true, userData: currentData }), { headers: corsHeaders });
        }

        const paypalApiBase = env.PAYPAL_MODE === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
        const authRes = await fetch(`${paypalApiBase}/v1/oauth2/token`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(env.PAYPAL_CLIENT_ID + ':' + env.PAYPAL_CLIENT_SECRET)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
        });
        const { access_token } = await authRes.json();

        const captureRes = await fetch(`${paypalApiBase}/v2/checkout/orders/${orderId}/capture`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
        });
        const captureData = await captureRes.json();

        if (captureData.status !== 'COMPLETED') throw new Error(`PayPal status: ${captureData.status}`);

        let userData = await getUserData(userId);

        if (isDonation || planId.startsWith('pack-') || ['soda', 'coffee', 'cheesecake'].includes(planId)) {
          const packs = { "soda": 150, "pack-150": 150, "coffee": 400, "pack-400": 400, "cheesecake": 1000, "pack-1000": 1000 };
          userData.credits += (packs[planId] || 0);
        } else if (planId.includes('-day')) {
          const days = parseInt(planId.split('-')[0]);
          const baseTime = (userData.passExpiryDate && new Date(userData.passExpiryDate) > new Date())
            ? new Date(userData.passExpiryDate).getTime()
            : Date.now();
          userData.passExpiryDate = new Date(baseTime + days * 86400000).toISOString();
        }

        await env.USER_USAGE.put(userId, JSON.stringify(userData));
        await env.USER_USAGE.put(processedKey, 'true', { expirationTtl: 604800 });

        return new Response(JSON.stringify({ success: true, userData }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: corsHeaders });
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
}