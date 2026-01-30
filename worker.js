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
    const isScanPath = url.pathname === '/' || url.pathname.includes('scan');
    if (request.method === 'POST' && isScanPath) {
      try {
        const { image: base64Image, userId, type = "menu", name_cn, lang = "en" } = await request.json();
        if (!userId || !base64Image) {
          return new Response(JSON.stringify({ error: "Missing userId or image" }), { status: 400, headers: corsHeaders });
        }
        
        let userData = await getUserData(userId);
        const isDevMode = env.ENABLE_DEV_MODE === "true";
        const isUnlimited = isDevMode || (userData.passExpiryDate && new Date(userData.passExpiryDate).getTime() > Date.now());

        // 仅在 menu 模式下检查积分。Store 和 Dish_detail 完全免费。
        if (type === "menu" && !isUnlimited && userData.credits < 50) {
          return new Response(JSON.stringify({ error: "OUT_OF_CREDITS", credits: userData.credits }), {
            status: 403, headers: corsHeaders
          });
        }

        const controller = new AbortController();

        // --- Prompts ---
        const getDetailPrompt = () => `Analyze dish "${name_cn}" and return JSON. 
          Target language: ${lang}. 
          Return: { 
            "name_translated": "name in ${lang}", 
            "classic_ingredients": [{"name_cn": "Mandarin Chinese", "name_en": "English", "name_translated": "${lang}"}], 
            "potential_ingredients": [{"name_cn": "Mandarin Chinese", "name_en": "English", "name_translated": "${lang}"}], 
            "spiciness_level": 0-5, "pinyin": "", "pronunciation": "", "allergens": [], 
            "description": "briefly in ${lang}", "has_animal_fats": true/false 
          }.`;

        const getMenuPrompt = () => `Identify all dishes from menu and return JSON. 
          Target language: ${lang}. 
          For EACH dish, return: { 
            "name_cn": "Simplified Mandarin Chinese (Not Japanese Kanji)", 
            "name_translated": "name in ${lang}", 
            "price": "...", "description": "...", 
            "ingredients": [{ "name_cn": "Mandarin Chinese", "name_en": "English", "name_translated": "${lang}" }], 
            "pinyin": "...", "spiciness_level": 0-5 
          }. Return: { "dishes": [] }.`;

        const getStorePrompt = () => `Identify this restaurant storefront/signboard and return JSON.
          Target language: ${lang}.
          Return MUST include a "store" object.
          Return: {
            "store": {
              "name": "Restaurant Name",
              "cuisine": "Type of food",
              "description": "Brief bio in ${lang}",
              "specialty_dishes": ["Dish 1", "Dish 2"],
              "average_price_range": "$$"
            }
          }.`;

        const taskQwen = async () => {
          let promptText;
          if (type === "dish_detail") promptText = getDetailPrompt();
          else if (type === "store") promptText = getStorePrompt();
          else promptText = getMenuPrompt();

          const payload = {
            model: type === "dish_detail" ? "qwen-plus" : "qwen3-vl-plus",
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
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
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
        let achievementTriggered = null;

        userData = await getUserData(userId);
        const isUnlimitedNow = (env.ENABLE_DEV_MODE === "true") || (userData.passExpiryDate && new Date(userData.passExpiryDate).getTime() > Date.now());
        
        const isMenuSuccess = (type === "menu") && Array.isArray(parsedData.dishes) && parsedData.dishes.length > 0;
        const isStoreSuccess = (type === "store") && (parsedData.store || parsedData.name); // 增加容错
        const isDetailSuccess = type === "dish_detail" && (parsedData.classic_ingredients || parsedData.description);

        if (isMenuSuccess || isStoreSuccess || isDetailSuccess) {
          userData.lastUsed = new Date().toISOString();
          // 仅当类型为 menu 且识别成功时扣费
          if (isMenuSuccess) {
            userData.scanCount += 1;
            if (!isUnlimitedNow) {
              userData.credits = Math.max(0, userData.credits - 50);
              if ([4, 10, 20].includes(userData.scanCount)) {
                userData.credits += 50;
                achievementTriggered = `milestone_${userData.scanCount}`;
              }
            }
          }
          await env.USER_USAGE.put(userId, JSON.stringify(userData));
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