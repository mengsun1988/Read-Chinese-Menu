/* edge-functions/api/gemini.ts */

const MENU_SYSTEM_INSTRUCTION = `
You are an elite culinary expert and professional translator specializing in Chinese cuisine.
You MUST perform a deep, exhaustive OCR scan of the provided Chinese menu image.

CRITICAL RULES:
1. EXHAUSTIVE EXTRACTION: Do not skip ANY readable items. Extract every single dish and its price.
2. ACCURATE TRANSLATION: Provide appetizing, clear English names. For metaphorical names, provide the culinary description.
3. BILINGUAL INGREDIENTS: List key ingredients with both English and Chinese names.
4. HIDDEN ANIMAL FATS: Be extremely vigilant. Many Chinese "vegetable" dishes use LARD (猪油) or TALLOW (牛油).
   If a dish is traditionally cooked with animal fat, set "has_animal_fats" to true.
5. VEGETARIAN VS VEGAN:
   - A dish is "is_vegetarian" if it contains no chunks of meat.
   - If it uses lard/animal fat, "is_vegetarian" can still be true, but "has_animal_fats" MUST be true.
6. SPICINESS & ALLERGENS: Identify heat levels (0–5) and potential allergens.
7. NO CHINESE PRICES: Format prices using 'Yuan' or '¥'. NEVER use the character '元'.
8. PRONUNCIATION:
   - Provide Hanyu Pinyin (e.g., "Gōngbǎo Jīdīng")
   - Provide a pronunciation_guide for English speakers (e.g., "Gong-Pow Jee-Deeng")

Return ONLY valid JSON. No markdown. No explanations.
Format: JSON array of objects.
`;

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export default async function onRequest(context: any) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, 405);
  }

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: "Missing GEMINI_API_KEY" }, 500);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const base64Image = body?.image;
  if (!base64Image) {
    return jsonResponse({ error: "Missing image field (base64)" }, 400);
  }

  const cleanedBase64 = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: cleanedBase64,
            },
          },
          {
            text: "Analyze this Chinese menu image exhaustively and return structured JSON.",
          },
        ],
      },
    ],
    system_instruction: {
      parts: [{ text: MENU_SYSTEM_INSTRUCTION }],
    },
    generation_config: {
      temperature: 0.2,
      response_mime_type: "application/json",
    },
  };

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!resp.ok) {
    const text = await resp.text();
    return jsonResponse(
      {
        error: "Gemini API error",
        status: resp.status,
        detail: text,
      },
      500
    );
  }

  const data = await resp.json();

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    return jsonResponse(
      { error: "No valid content returned from Gemini" },
      500
    );
  }

  try {
    const parsed = JSON.parse(text);
    return jsonResponse(parsed);
  } catch {
    return jsonResponse(
      {
        error: "Gemini returned non-JSON output",
        raw: text,
      },
      500
    );
  }
}
