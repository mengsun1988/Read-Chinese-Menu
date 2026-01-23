export default async function handler(request: Request): Promise<Response> {
  // ✅ 明确允许 POST
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed' }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const { mode, imageBase64 } = await request.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing imageBase64' }),
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing GEMINI_API_KEY' }),
        { status: 500 }
      );
    }

    const systemInstruction =
      mode === 'store'
        ? `You are a local street food guide and signage expert in China. Analyze the provided storefront or shop signage image.

Identify:
1. The store name in Chinese and English.
2. The type of cuisine (e.g., Sichuan, Cantonese, Noodles, BBQ).
3. Specialty dishes mentioned on the sign or visible in context.
4. Average price range (e.g., 20-50 Yuan).
5. A brief "Street Tip" description.

Format: JSON object.`
        : `You are an elite culinary expert and professional translator specializing in Chinese cuisine.

CRITICAL RULES:
1. EXHAUSTIVE EXTRACTION: Do not skip ANY readable items. Extract every single dish and its price.
2. ACCURATE TRANSLATION: Provide appetizing, clear English names.
3. BILINGUAL INGREDIENTS.
4. HIDDEN ANIMAL FATS.
5. VEGETARIAN VS VEGAN.
6. SPICINESS & ALLERGENS.
7. NO CHINESE PRICES.
8. PRONUNCIATION.

Format: JSON array of objects.`;

    const geminiResp = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
        apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: imageBase64,
                  },
                },
                { text: systemInstruction },
              ],
            },
          ],
        }),
      }
    );

    const data = await geminiResp.json();

    if (!geminiResp.ok) {
      return new Response(
        JSON.stringify({
          error: 'Gemini API error',
          detail: data,
        }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: 'Edge Function crashed',
        message: err?.message || String(err),
      }),
      { status: 500 }
    );
  }
}
