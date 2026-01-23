import { GoogleGenAI, Type } from "@google/genai";
import { Dish, StoreResult } from "../types";

const MENU_SYSTEM_INSTRUCTION = `You are an elite culinary expert and professional translator specializing in Chinese cuisine. You MUST perform a deep, exhaustive OCR scan of the provided Chinese menu image.

CRITICAL RULES:
1. EXHAUSTIVE EXTRACTION: Do not skip ANY readable items. Extract every single dish and its price.
2. ACCURATE TRANSLATION: Provide appetizing, clear English names. For metaphorical names, provide the culinary description.
3. BILINGUAL INGREDIENTS: List key ingredients with both English and Chinese names.
4. HIDDEN ANIMAL FATS: Be extremely vigilant. Many Chinese "vegetable" dishes use LARD (猪油) or TALLOW (牛油). If a dish is traditionally cooked with animal fat, set "has_animal_fats" to true.
5. VEGETARIAN VS VEGAN: A dish is only "is_vegetarian" if it contains no chunks of meat. However, if it uses lard/animal fat, "is_vegetarian" can still be true but "has_animal_fats" MUST be true.
6. SPICINESS & ALLERGENS: Identify heat levels (0-5) and potential allergens.
7. NO CHINESE PRICES: Format prices using 'Yuan' or '¥'. NEVER use the character '元'.
8. PRONUNCIATION: For each dish, provide the Hanyu Pinyin (e.g., "Gōngbǎo Jīdīng") and a "pronunciation_guide" which is a simulated phonetic reading for English speakers (e.g., "Gong-Pow Jee-Deeng").

Format: JSON array of objects.`;

const STREET_SYSTEM_INSTRUCTION = `You are a local street food guide and signage expert in China. Analyze the provided storefront or shop signage image. 

Identify:
1. The store name in Chinese and English.
2. The type of cuisine (e.g., Sichuan, Cantonese, Noodles, BBQ).
3. Specialty dishes mentioned on the sign or visible in context.
4. Average price range (e.g., 20-50 Yuan).
5. A brief "Street Tip" description: Is it a famous chain? Is it a local hole-in-the-wall? What should a traveler expect? Keep it concise and practical.

Format: JSON object.`;

export async function processMenuImage(base64Image: string): Promise<Dish[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        { text: "Exhaustively analyze this Chinese menu. Detect hidden lard/animal fats. Provide Hanyu Pinyin and a phonetic guide for English speakers for every dish. Return detailed JSON." }
      ],
    },
    config: {
      systemInstruction: MENU_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            dish_name_cn: { type: Type.STRING },
            dish_name_en: { type: Type.STRING },
            pinyin: { type: Type.STRING },
            pronunciation_guide: { type: Type.STRING },
            description: { type: Type.STRING },
            classic_ingredients: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  name_en: { type: Type.STRING },
                  name_cn: { type: Type.STRING },
                }
              } 
            },
            potential_ingredients: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  name_en: { type: Type.STRING },
                  name_cn: { type: Type.STRING },
                }
              } 
            },
            spiciness: { type: Type.INTEGER },
            allergens: { type: Type.ARRAY, items: { type: Type.STRING } },
            is_vegetarian: { type: Type.BOOLEAN },
            has_animal_fats: { type: Type.BOOLEAN },
            price: { type: Type.STRING },
          },
          required: ["dish_name_cn", "dish_name_en", "description", "classic_ingredients", "potential_ingredients", "spiciness", "allergens", "is_vegetarian", "has_animal_fats", "pinyin", "pronunciation_guide"],
        },
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI engine");
  
  return JSON.parse(text);
}

export async function processStorefrontImage(base64Image: string): Promise<StoreResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        { text: "Identify this storefront and tell me what they serve. Return JSON." }
      ],
    },
    config: {
      systemInstruction: STREET_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          store_name: { type: Type.STRING },
          cuisine_type: { type: Type.STRING },
          specialty_dishes: { type: Type.ARRAY, items: { type: Type.STRING } },
          average_price_range: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["store_name", "cuisine_type", "specialty_dishes", "average_price_range", "description"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI engine");
  
  return JSON.parse(text);
}