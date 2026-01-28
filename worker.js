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
        
        // 频率限制：防止滥用（基于 userId）
        const rateLimitKey = `rate_limit:action:${userId}`;
        const rateLimitData = await env.USER_USAGE.get(rateLimitKey);
        const now = Date.now();
        if (rateLimitData) {
          const { count, resetTime } = JSON.parse(rateLimitData);
          if (now < resetTime) {
            if (count >= 10) { // 每分钟最多10次动作请求
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
    if (request.method === 'POST' && (url.pathname === '/' || url.pathname === '/api/scan')) {
      try {
        const { image: base64Image, userId, type = "menu", name_cn } = await request.json();
        
        // 安全验证：检查必要参数
        if (!userId || !image) {
          return new Response(JSON.stringify({ error: "Missing required parameters" }), { 
            status: 400, headers: corsHeaders 
          });
        }
        
        // 频率限制：防止滥用（基于 userId）
        const rateLimitKey = `rate_limit:${userId}`;
        const rateLimitData = await env.USER_USAGE.get(rateLimitKey);
        const now = Date.now();
        if (rateLimitData) {
          const { count, resetTime } = JSON.parse(rateLimitData);
          if (now < resetTime) {
            if (count >= 30) { // 每分钟最多30次请求
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
    // 安全修复：使用环境变量而不是 Origin 头来支持 localhost 免检
    // 生产环境：不设置 ENABLE_DEV_MODE，正常检查点数
    // 开发环境：在 wrangler.toml 或 Cloudflare 控制台设置 ENABLE_DEV_MODE = "true"
    const isDevMode = env.ENABLE_DEV_MODE === "true";
    const isUnlimited = isDevMode || (userData.passExpiryDate && new Date(userData.passExpiryDate).getTime() > Date.now());

    if (!isUnlimited && userData.credits < 50) {
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
                : [{ type: "text", text: "Analyze menu. Return JSON {dishes:[{name_cn, name_en, price, description, pinyin, pronunciation, spiciness_level}]}. JSON ONLY." }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }]
            }],
            response_format: { type: "json_object" }
          };
          const res = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
            method: 'POST', headers: { 'Authorization': `Bearer ${env.DASHSCOPE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload), signal: controller.signal
          });
          const d = await res.json();
          return { source: 'qwen', content: d.choices[0].message.content };
        };

        const taskGemini = async () => {
          const prompt = type === "dish_detail" ? `Detail for "${name_cn}" in JSON` : "Analyze menu. Return JSON {dishes:[]}.";
          const payload = {
            contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64Image } }] }],
            generationConfig: { responseMimeType: "application/json" }
          };
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload), signal: controller.signal
          });
          const d = await res.json();
          return { source: 'gemini', content: d.candidates[0].content.parts[0].text };
        };

        const winner = await Promise.any([taskQwen(), taskGemini()]);
        controller.abort();
        
        const parsedData = JSON.parse(winner.content.replace(/```json|```/g, ""));
        let achievementTriggered = null;

        // 安全修复：只有成功识别（有菜品结果）才扣点
        // 重新获取最新数据，防止并发问题
        userData = await getUserData(userId);
        const isDevModeNow = env.ENABLE_DEV_MODE === "true";
        const isUnlimitedNow = isDevModeNow || (userData.passExpiryDate && new Date(userData.passExpiryDate).getTime() > Date.now());
        
        if (type === "menu" && parsedData.dishes?.length > 0) {
          // 再次验证点数（防止并发请求绕过）
          if (!isUnlimitedNow && userData.credits < 50) {
            return new Response(JSON.stringify({ 
              error: "OUT_OF_CREDITS", 
              credits: userData.credits,
              dishes: [] 
            }), {
              status: 403, headers: corsHeaders
            });
          }
          
          userData.scanCount += 1;
          if (!isUnlimitedNow) {
            // 先扣50点
            userData.credits -= 50;
            // 第4次识别后立即奖励50点（此时显示0点，然后立即变成50点）
            if (userData.scanCount === 4) { 
              userData.credits += 50; 
              achievementTriggered = "milestone_4"; 
            }
            else if (userData.scanCount === 10) { 
              userData.credits += 50; 
              achievementTriggered = "milestone_10"; 
            }
            else if (userData.scanCount === 20) { 
              userData.credits += 50; 
              achievementTriggered = "milestone_20"; 
            }
          }
          await env.USER_USAGE.put(userId, JSON.stringify(userData));
        }

        return new Response(JSON.stringify({
          ...parsedData,
          usage: { ...userData, isUnlimited: isUnlimitedNow, achievementTriggered, _debug_source: winner.source }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: corsHeaders });
      }
    }

    // --- 5. 支付验证：支持 DayPass 和 Donation 点数包 ---
    if (request.method === 'POST' && (url.pathname === '/api/verify-payment' || url.pathname === '/api/verify_order')) {
      try {
        const { orderId, planId, userId, isDonation } = await request.json();
        
        // 安全验证：检查必要参数
        if (!orderId || !planId || !userId) {
          return new Response(JSON.stringify({ error: "Missing required parameters" }), { 
            status: 400, headers: corsHeaders 
          });
        }
        
        // 验证 planId 格式，防止注入攻击
        const validPlanIds = ['soda', 'coffee', 'cheesecake', '3-day', '7-day', '15-day', 'pack-150', 'pack-400', 'pack-1000'];
        if (!validPlanIds.includes(planId) && !planId.startsWith('pack-')) {
          return new Response(JSON.stringify({ error: "Invalid plan ID" }), { 
            status: 400, headers: corsHeaders 
          });
        }
        
        // 防重处理
        const processedKey = `order_processed:${orderId}`;
        const alreadyProcessed = await env.USER_USAGE.get(processedKey);
        if (alreadyProcessed) {
          const currentData = await getUserData(userId);
          return new Response(JSON.stringify({ success: true, userData: currentData }), { headers: corsHeaders });
        }

        // PayPal Access Token
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

        // Capture Order
        const captureRes = await fetch(`${paypalApiBase}/v2/checkout/orders/${orderId}/capture`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
        });
        const captureData = await captureRes.json();

        if (captureData.status !== 'COMPLETED') throw new Error(`PayPal status: ${captureData.status}`);

        let userData = await getUserData(userId);

        // 权益发放逻辑
        if (isDonation || planId.startsWith('pack-') || ['soda', 'coffee', 'cheesecake'].includes(planId)) {
          // 点数包逻辑
          const packs = { "soda": 150, "pack-150": 150, "coffee": 400, "pack-400": 400, "cheesecake": 1000, "pack-1000": 1000 };
          userData.credits += (packs[planId] || 0);
        } else if (planId.includes('-day')) {
          // 无限卡逻辑
          const days = parseInt(planId.split('-')[0]);
          const baseTime = (userData.passExpiryDate && new Date(userData.passExpiryDate) > new Date())
            ? new Date(userData.passExpiryDate).getTime()
            : Date.now();
          userData.passExpiryDate = new Date(baseTime + days * 86400000).toISOString();
        }

        await env.USER_USAGE.put(userId, JSON.stringify(userData));
        await env.USER_USAGE.put(processedKey, 'true', { expirationTtl: 604800 }); // 记录保存7天

        return new Response(JSON.stringify({ success: true, userData, usage: userData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: corsHeaders });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
}
