import { GoogleGenAI, Type } from "@google/genai";
import { Dish, StoreResult } from "../types";

// 1. Unified API Key extraction from the environment
const GEMINI_API_KEY = process.env.API_KEY;

const MENU_SYSTEM_INSTRUCTION = `You are an elite culinary expert and professional translator specializing in Chinese cuisine. You MUST perform a deep, exhaustive OCR scan of the provided Chinese menu image.

CRITICAL RULES:
1. EXHAUSTIVE EXTRACTION: Do not skip ANY readable items. Extract every single dish and its price.
2. ACCURATE TRANSLATION: Provide appetizing, clear English names.
3. BILINGUAL INGREDIENTS: List key ingredients with both English and Chinese names.
4. HIDDEN ANIMAL FATS: Be extremely vigilant about LARD (猪油) or TALLOW (牛油).
5. VEGETARIAN VS VEGAN: Identify if a dish is truly vegetarian.
6. SPICINESS & ALLERGENS: Identify heat levels (0-5) and potential allergens.
7. NO CHINESE PRICES: Format prices using 'Yuan' or '¥'.
8. PRONUNCIATION: Provide Hanyu Pinyin and a pronunciation_guide.

Format: JSON array of objects.`;

const STREET_SYSTEM_INSTRUCTION = `You are a local street food guide in China. Analyze the storefront signage. 
Identify store name, cuisine type, specialty dishes, price range, and a "Street Tip".
Format: JSON object.`;

/**
 * Ensures the API Key is present before calling the model.
 */
function ensureInitialized() {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing Gemini API Key. Please check your environment configuration.");
  }
}

export async function processMenuImage(base64Image: string): Promise<Dish[]> {
  ensureInitialized();
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        { text: "Exhaustively analyze this Chinese menu. Detect hidden fats. Return detailed JSON." }
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
  if (!text) throw new Error("The AI failed to generate a response. Please try again.");
  
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Failed to parse menu data. Please ensure the image is clear.");
  }
}

export async function processStorefrontImage(base64Image: string): Promise<StoreResult> {
  ensureInitialized();
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
  if (!text) throw new Error("The AI failed to identify the store.");
  
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Invalid store data received.");
  }
}