// 修改事件监听器，将 env 传递给处理函数
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event.env));
});

async function handleRequest(request, env) {
  // 提前定义跨域头，避免“变量未初始化”错误
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  // 1. 处理跨域预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // 2. 只处理 POST 请求
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Only POST allowed' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    // 3. 解析前端请求
    const clientData = await request.json();
    const { imageBase64, prompt } = clientData;

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'No image data provided' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 4. 构建 Gemini API 请求
    const geminiReqBody = {
      contents: [{
        parts: [
          { text: prompt || "Describe this image" },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
            }
          }
        ]
      }]
    };

    // 🔑 关键：从环境变量中读取密钥！
    const GEMINI_API_KEY = env.GEMINI_API_KEY; // 这里的名字必须和你设置的“变量名称”一致
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured in environment variables.');
    }
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${GEMINI_API_KEY}`;

    // 5. 调用 Gemini API
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiReqBody)
    });

    // 6. 返回结果给前端
    const result = await geminiResponse.json();
    return new Response(JSON.stringify(result), {
      status: geminiResponse.status,
      headers: corsHeaders
    });

  } catch (error) {
    // 7. 错误处理
    console.error('Worker Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}