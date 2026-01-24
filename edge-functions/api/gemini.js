export async function onRequestPost(context) {
  try {
    // 解析前端 POST 过来的数据（现在先不用）
    const body = await context.request.json();

    // ✅ 临时 mock：返回 Dish[]（数组）
    const mockResult = [
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
      }
    ];

    return new Response(JSON.stringify(mockResult), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Edge Function error",
        detail: String(err),
      }),
      { status: 500 }
    );
  }
}
