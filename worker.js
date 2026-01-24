export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    // 1. 处理跨域预检
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Only POST allowed' }), { status: 405, headers: corsHeaders });
    }

    try {
      const clientData = await request.json();
      // 这里确保和前端 geminiService.ts 传参名一致
      const { image, type } = clientData; 

      if (!image) throw new Error('No image data provided');

      // 🔑 确保你在后台 Variables 里的 Secret Key 叫 GEMINI_API_KEY
      const API_KEY = env.GEMINI_API_KEY;
      if (!API_KEY) throw new Error('API Key is missing in Cloudflare Workers Settings');

      // 更新为最新的 Gemini 3 Flash 接口地址
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${API_KEY}`;

      const geminiResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: type === 'menu' ? "Exhaustively analyze this Chinese menu. Return a JSON array of dish objects." : "Identify this storefront." },
              { inline_data: { mime_type: "image/jpeg", data: image.includes(',') ? image.split(',')[1] : image } }
            ]
          }],
          generationConfig: { 
            response_mime_type: "application/json" 
          }
        })
      });

      const result = await geminiResponse.json();

      // 如果 Gemini 返回了错误（比如 Key 过期或模型不存在）
      if (result.error) {
        return new Response(JSON.stringify({ error: 'Gemini API Error', details: result.error.message }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // 提取 AI 返回的文本并直接发回前端
      const aiText = result.candidates[0].content.parts[0].text;
      return new Response(aiText, { headers: corsHeaders });

    } catch (error) {
      // 捕获 Workers 内部错误（如 JSON 解析失败、Key 未配置等）
      return new Response(JSON.stringify({ error: 'Worker Internal Error', details: error.message }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};