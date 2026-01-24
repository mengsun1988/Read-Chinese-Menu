/**
 * EdgeOne API 端点 - 简化版本（用于测试）
 * 这个版本返回 mock 数据，无需调用 Gemini API
 */
export async function onRequestPost(context) {
  console.log("[Test API] Request received");
  
  try {
    const body = await context.request.json();
    const { image, type } = body;

    console.log("[Test API] Request type:", type);
    console.log("[Test API] Image length:", image?.length);

    if (!image || !type) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Missing required fields: image, type",
          dishes: []
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 返回 mock 数据用于测试
    if (type === "menu") {
      const mockDishes = [
        {
          dish_name_cn: "宫保鸡丁",
          dish_name_en: "Kung Pao Chicken",
          pinyin: "Gōngbǎo Jīdīng",
          pronunciation_guide: "Gong-bao Jee-ding",
          description: "A classic Sichuan dish with diced chicken, peanuts, and chili peppers.",
          classic_ingredients: [
            { name_en: "Chicken", name_cn: "鸡肉" },
            { name_en: "Peanuts", name_cn: "花生" }
          ],
          potential_ingredients: [
            { name_en: "Dried chili", name_cn: "干辣椒" }
          ],
          spiciness: 3,
          allergens: ["peanuts"],
          is_vegetarian: false,
          has_animal_fats: false,
          price: "¥38"
        },
        {
          dish_name_cn: "麻婆豆腐",
          dish_name_en: "Mapo Tofu",
          pinyin: "Mápo Dòufu",
          pronunciation_guide: "Mah-po Toe-foo",
          description: "Spicy tofu in a numbing and spicy sauce with ground pork.",
          classic_ingredients: [
            { name_en: "Tofu", name_cn: "豆腐" },
            { name_en: "Ground pork", name_cn: "猪肉末" }
          ],
          potential_ingredients: [
            { name_en: "Szechuan pepper", name_cn: "花椒" }
          ],
          spiciness: 4,
          allergens: ["soy"],
          is_vegetarian: false,
          has_animal_fats: true,
          price: "¥28"
        }
      ];

      console.log("[Test API] Returning mock menu data");
      return new Response(JSON.stringify(mockDishes), {
        headers: { "Content-Type": "application/json" }
      });
    } else if (type === "street") {
      const mockStore = {
        store_name: "Sichuan Restaurant",
        cuisine_type: "Sichuan",
        specialty_dishes: ["Kung Pao Chicken", "Mapo Tofu"],
        average_price_range: "¥30-80",
        description: "Authentic Sichuan cuisine with bold flavors"
      };

      console.log("[Test API] Returning mock store data");
      return new Response(JSON.stringify(mockStore), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(
      JSON.stringify({ ok: false, error: "Unknown type", dishes: [] }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[Test API] Error:", err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Test API error: " + String(err),
        dishes: []
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
