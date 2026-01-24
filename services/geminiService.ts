export async function processMenuImage(base64Image: string): Promise<any[]> {
  const cleanedBase64 = cleanBase64(base64Image);
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ image: cleanedBase64, type: "menu" }),
    });

    if (!response.ok) throw new Error(`Network Error: ${response.status}`);
    const result = await response.json();

    let rawArray: any[] = [];
    if (Array.isArray(result)) {
      rawArray = result;
    } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = result.candidates[0].content.parts[0].text;
      const firstBracket = text.indexOf('[');
      const lastBracket = text.lastIndexOf(']');
      rawArray = JSON.parse(text.substring(firstBracket, lastBracket + 1));
    }

    if (!Array.isArray(rawArray)) return [];

    return rawArray.map((item: any, index: number) => {
      // --- 1. 深度提取简介 (防止空白) ---
      const description = item.description || item.dish_description || item.summary || item.details || "No description provided by AI.";

      // --- 2. 深度提取过敏原 (从多种可能字段合并) ---
      let allergens: string[] = [];
      
      // 如果 AI 直接给了 allergens 数组，直接用
      if (Array.isArray(item.allergens)) {
        allergens = item.allergens;
      } 
      
      // 如果 AI 把过敏原放到了 dietary_flags 里 (例如 "contains_peanuts")
      if (Array.isArray(item.dietary_flags)) {
        const mappedFromFlags = item.dietary_flags
          .filter((f: string) => f.startsWith('contains_') || f.includes('allergy') || f.includes('allergen'))
          .map((f: string) => f.replace('contains_', '').replace('_', ' '));
        allergens = [...new Set([...allergens, ...mappedFromFlags])];
      }

      // 如果过敏原数组还是空的，尝试从 ingredients 关键词中自动补全 (最后的保险)
      if (allergens.length === 0 && Array.isArray(item.ingredients)) {
        const ingredientNames = item.ingredients.map((ing: any) => (ing.name_en || "").toLowerCase()).join(' ');
        if (ingredientNames.includes('peanut')) allergens.push('Peanuts');
        if (ingredientNames.includes('egg')) allergens.push('Eggs');
        if (ingredientNames.includes('soy') || ingredientNames.includes('tofu')) allergens.push('Soy');
        if (ingredientNames.includes('shrimp') || ingredientNames.includes('crab')) allergens.push('Shellfish');
        if (ingredientNames.includes('flour') || ingredientNames.includes('wheat')) allergens.push('Gluten');
      }

      return {
        ...item,
        id: item.id || `dish-${Date.now()}-${index}`,
        // 确保简介不为空
        description: description,
        // 确保过敏原数组存在
        allergens: allergens,
        // 适配卡片字段
        dish_name_cn: item.name_cn || item.name || "未知",
        dish_name_en: item.name_en || item.english_name || "Unknown",
        name_cn: item.name_cn || item.name || "未知",
        name_en: item.name_en || item.english_name || "Unknown",
        price: String(item.price || ""),
        spiciness: Number(item.spiciness_level || item.spiciness || 0),
        // 适配过敏原和成分组件
        classic_ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
        dietary_flags: Array.isArray(item.dietary_flags) ? item.dietary_flags : [],
        is_vegetarian: item.is_vegetarian || (Array.isArray(item.dietary_flags) && item.dietary_flags.includes('vegetarian')),
        has_animal_fats: item.has_animal_fats || (Array.isArray(item.dietary_flags) && item.dietary_flags.includes('contains_lard'))
      };
    });
  } catch (err) {
    console.error("Service Error:", err);
    throw err;
  }
}