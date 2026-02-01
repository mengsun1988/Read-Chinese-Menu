export const getAllergenConfig = (allergen: string) => {
  const a = allergen.toLowerCase();
  
  // 1. 高危：海鲜、坚果 (红色)
  if (/(crustacean|mollusk|peanut|nut|fish|crab|shrimp|shellfish|海鲜|花生|坚果)/.test(a)) {
    return { bg: 'bg-rose-600', text: 'text-white', isHighRisk: true, desc: "" };
  }
  
  // 2. 次高危：麸质、大豆、芝麻 (橙色)
  if (/(gluten|soy|wheat|sesame|面粉|大豆|酱油|芝麻)/.test(a)) {
    const descMap: Record<string, string> = {
      'gluten': '(面粉/酱油)',
      'wheat': '(小麦/面粉)',
      'soy': '(大豆/酱油/豆制品)'
    };
    return { bg: 'bg-orange-500', text: 'text-white', isHighRisk: false, desc: descMap[a] || "" };
  }
  
  // 3. 其他 (灰色)
  return { bg: 'bg-slate-500', text: 'text-white', isHighRisk: false, desc: "" };
};

// 专门给 Card 这种只需要颜色的地方用
export const getAllergenSeverityColor = (text: string) => getAllergenConfig(text).bg;