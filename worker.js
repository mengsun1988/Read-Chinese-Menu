export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-App-Source',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const referer = request.headers.get("Referer");
    const isScanPath = url.pathname === '/' || url.pathname.includes('scan');

    // --- 安全防护：Referer 校验 ---
    if (isScanPath && request.method === 'POST') {
      const isDev = env.ENABLE_DEV_MODE === "true";
      const isAllowedReferer = referer && (referer.includes("readchinesemenu.com") || referer.includes("localhost"));
      
      if (!isAllowedReferer && !isDev) {
        return new Response(JSON.stringify({ error: "Access Denied: Invalid Source" }), { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    async function getUserData(userId) {
      const defaultData = {
        credits: 200,
        scanCount: 0,
        shareCount: 0,
        gameWinCount: 0,
        lastShareDate: null,
        passExpiryDate: null,
        lastUsed: new Date().toISOString()
      };
      if (!userId) return defaultData;
      const dataStr = await env.USER_USAGE.get(userId);
      if (!dataStr) return defaultData;
      const savedData = JSON.parse(dataStr);
      return { ...defaultData, ...savedData };
    }

    // --- API: Get Survival Cards ---
    if (request.method === 'GET' && url.pathname === '/api/survival') {
      const list = await env.CARDS_KV.list({ prefix: "card:" });
      const cards = await Promise.all(
        list.keys.map(k => env.CARDS_KV.get(k.name).then(v => JSON.parse(v)))
      );
      return new Response(JSON.stringify(cards.filter(c => !c.isBanned)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // --- API: Simple Translation ---
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

    // --- API: User Action (Share/Game) ---
    if (request.method === 'POST' && url.pathname === '/api/user-action') {
      try {
        const { userId, action } = await request.json();
        if (!userId || !action) {
          return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400, headers: corsHeaders });
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

    // --- API: Main AI Scan (Menu/Dish/Store) ---
    if (request.method === 'POST' && isScanPath) {
      try {
        const { image: base64Image, userId, type = "menu", name_cn, lang = "en" } = await request.json();
        if (!userId || !base64Image) {
          return new Response(JSON.stringify({ error: "Missing userId or image" }), { status: 400, headers: corsHeaders });
        }
        
        let userData = await getUserData(userId);
        const isDevMode = env.ENABLE_DEV_MODE === "true";
        const isUnlimited = isDevMode || (userData.passExpiryDate && new Date(userData.passExpiryDate).getTime() > Date.now());

        // 仅在 menu 模式下预检查余额
        if (type === "menu" && !isUnlimited && (Number(userData.credits) || 0) < 50) {
          return new Response(JSON.stringify({ error: "OUT_OF_CREDITS", credits: userData.credits }), {
            status: 403, headers: corsHeaders
          });
        }

        const controller = new AbortController();

        // --- Prompts ---
        const getDetailPrompt = () => `Analyze dish "${name_cn}" and return JSON. Target language: ${lang}.
          CRITICAL: You are a food safety expert. You MUST identify hidden allergens. 
          1. Scan for Crustaceans (Crab/Shrimp) and Mollusks (Snails/Clams/Cockles/Abalone).
          2. Check for Gluten: MUST include "Gluten" if dish contains Wheat, Flour, Noodles, or Soy Sauce.
          3. Check for Soy: Include if Tofu, Bean Paste, or Soy Sauce is used.
          4. Check for Nuts: Peanuts (including Peanut Oil), Tree nuts (Walnuts/Cashews).
          Return JSON: { 
            "name_translated": "name in ${lang}", 
            "classic_ingredients": [{"name_cn": "...", "name_en": "...", "name_translated": "..."}], 
            "potential_ingredients": [{"name_cn": "...", "name_en": "...", "name_translated": "..."}], 
            "spiciness_level": 0-5, "pinyin": "", "pronunciation": "", 
            "allergens": ["List all"], 
            "description": "briefly in ${lang}", "has_animal_fats": true/false 
          }.`;

        const getMenuPrompt = () => `Identify all dishes from menu and return JSON. Target language: ${lang}.
          For EACH dish, analyze ingredients deeply for safety. Return: { "dishes": [{ "name_cn": "...", "name_translated": "...", "price": "...", "ingredients": [...], "allergens": [...], "pinyin": "...", "spiciness_level": 0-5 }] }.`;

        const getStorePrompt = () => `Identify this restaurant storefront and return JSON. Target language: ${lang}.
          Return: { "store": { "name": "...", "cuisine": "...", "description": "...", "specialty_dishes": [], "average_price_range": "$$", "allergy_warning": "...", "is_seafood_specialty": true/false } }.`;

        const taskQwen = async () => {
          let promptText = type === "dish_detail" ? getDetailPrompt() : (type === "store" ? getStorePrompt() : getMenuPrompt());
          const payload = {
            model: type === "dish_detail" ? "qwen-plus" : "qwen-vl-plus",
            messages: [{
              role: "user",
              content: type === "dish_detail" 
                ? promptText
                : [{ type: "text", text: promptText }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }]
            }],
            response_format: { type: "json_object" }
          };
          const res = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
            method: 'POST', headers: { 'Authorization': `Bearer ${env.DASHSCOPE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload), signal: controller.signal
          });
          const d = await res.json();
          if (d.error) throw new Error("Qwen: " + d.error.message);
          return { source: 'qwen', content: d.choices[0].message.content };
        };

        const taskGemini = async () => {
          const promptText = type === "store" ? getStorePrompt() : (type === "dish_detail" ? getDetailPrompt() : getMenuPrompt());
          const payload = {
            contents: [{ parts: [{ text: promptText }, { inline_data: { mime_type: "image/jpeg", data: base64Image } }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
          };
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload), signal: controller.signal
          });
          const d = await res.json();
          if (d.error) throw new Error("Gemini: " + d.error.message);
          return { source: 'gemini', content: d.candidates[0].content.parts[0].text };
        };

        const winner = await Promise.any([taskQwen(), taskGemini()]);
        controller.abort();
        
        const parsedData = JSON.parse(winner.content.replace(/```json|```/g, ""));
        
        // --- 判定结果 ---
        const isMenuActuallyFound = Array.isArray(parsedData.dishes) && 
                                    parsedData.dishes.length > 0 && 
                                    (parsedData.dishes[0].name_cn || parsedData.dishes[0].name_translated);
        
        const isStoreFound = !!(parsedData.store || (parsedData.name && type === "store"));
        const isDetailFound = !!(parsedData.classic_ingredients || parsedData.description);

        let achievementTriggered = null;
        let latestUserData = await getUserData(userId);
        const isUnlimitedNow = (env.ENABLE_DEV_MODE === "true") || 
                               (latestUserData.passExpiryDate && new Date(latestUserData.passExpiryDate).getTime() > Date.now());

        // --- 核心逻辑：只有菜单识别扣点和计次 ---
        if (isMenuActuallyFound || isStoreFound || isDetailFound) {
          latestUserData.lastUsed = new Date().toISOString();

          if (isMenuActuallyFound) {
            // 只有识别出菜单，才增加 scanCount
            latestUserData.scanCount = (latestUserData.scanCount || 0) + 1;
            
            if (!isUnlimitedNow) {
              // 只有识别出菜单，才扣 50 点
              latestUserData.credits = Math.max(0, (Number(latestUserData.credits) || 0) - 50);
              
              if ([4, 10, 20].includes(latestUserData.scanCount)) {
                latestUserData.credits += 50;
                achievementTriggered = `milestone_${latestUserData.scanCount}`;
              }
            }
          }
          // Store 和 Detail 识别成功也会运行到这里保存 lastUsed，但不会进上面的 isMenuActuallyFound 逻辑
          await env.USER_USAGE.put(userId, JSON.stringify(latestUserData));
          userData = latestUserData; 
        }

        return new Response(JSON.stringify({
          ...parsedData,
          usage: { ...userData, isUnlimited: isUnlimitedNow, achievementTriggered, _debug_source: winner.source }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      } catch (err) {
        return new Response(JSON.stringify({ error: "AI failed: " + err.message }), { status: 500, headers: corsHeaders });
      }
    }

    // --- API: Payment Verification ---
    if (request.method === 'POST' && (url.pathname === '/api/verify-payment' || url.pathname === '/api/verify_order')) {
      try {
        const { orderId, planId, userId } = await request.json();
        const processedKey = `order_processed:${orderId}`;
        const alreadyProcessed = await env.USER_USAGE.get(processedKey);
        if (alreadyProcessed) {
          const currentData = await getUserData(userId);
          return new Response(JSON.stringify({ success: true, userData: currentData }), { headers: corsHeaders });
        }

        const paypalApiBase = env.PAYPAL_MODE === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
        const authRes = await fetch(`${paypalApiBase}/v1/oauth2/token`, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${btoa(env.PAYPAL_CLIENT_ID + ':' + env.PAYPAL_CLIENT_SECRET)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'grant_type=client_credentials',
        });
        const { access_token } = await authRes.json();

        const captureRes = await fetch(`${paypalApiBase}/v2/checkout/orders/${orderId}/capture`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
        });
        const captureData = await captureRes.json();
        if (captureData.status !== 'COMPLETED') throw new Error(`PayPal failed`);

        let userData = await getUserData(userId);
        if (planId.startsWith('pack-') || ['soda', 'coffee', 'cheesecake'].includes(planId)) {
          const packs = { "soda": 150, "pack-150": 150, "coffee": 400, "pack-400": 400, "cheesecake": 1000, "pack-1000": 1000 };
          userData.credits += (packs[planId] || 0);
        } else if (planId.includes('-day')) {
          const days = parseInt(planId.split('-')[0]);
          const baseTime = (userData.passExpiryDate && new Date(userData.passExpiryDate) > new Date()) ? new Date(userData.passExpiryDate).getTime() : Date.now();
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