import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

// 常用食材应急字典：纠正 API 错误并提供核心翻译对照
const FALLBACK_CN_MAP: Record<string, string> = {
  // --- 1. 灵魂调味 & 香料 (Soul Seasonings) ---
  'Sichuan Pepper': '花椒',
  'Green Sichuan Pepper': '青花椒',
  'Wild Pepper': '木姜子',
  'Mountain Pepper': '山苍子',
  'Five Spice Powder': '五香粉',
  'Thirteen Spices': '十三香',
  'Star Anise': '八角',
  'Cinnamon': '桂皮',
  'Bay Leaf': '香叶',
  'Cumin': '孜然',
  'Fennel': '小茴香',
  'Dried Chili': '干辣椒',
  'Millet Spicy Chili': '小米辣',
  'Pickled Pepper': '泡椒',
  'Pickled Ginger': '泡姜',
  'Broad Bean Paste': '豆瓣酱',
  'Sweet Bean Sauce': '甜面酱',
  'Oyster Sauce': '蚝油',
  'Soy Sauce': '酱油',
  'Dark Soy Sauce': '老抽',
  'Light Soy Sauce': '生抽',
  'Vinegar': '醋',
  'Chinkiang Vinegar': '陈醋',
  'Cooking Wine': '料酒',
  'Fermented Bean Curd': '腐乳',
  'Rock Sugar': '冰糖',
  'Maltose': '麦芽糖',
  'Sesame Oil': '麻油/香油',
  'Lard': '猪油',

  // --- 2. 常见中式蔬菜 (Chinese Vegetables) ---
  'Coriander': '香菜',
  'Cilantro': '香菜',
  'Scallion': '葱',
  'Spring Onion': '葱',
  'Chive': '韭菜',
  'Garlic Bolt': '蒜苔',
  'Garlic Sprout': '蒜苗',
  'Ginger': '姜',
  'Garlic': '大蒜',
  'Lotus Root': '莲藕',
  'Bamboo Shoot': '竹笋',
  'Winter Melon': '冬瓜',
  'Bitter Melon': '苦瓜',
  'Loofah': '丝瓜',
  'Yam': '山药',
  'Water Chestnut': '马蹄',
  'Taro': '芋头',
  'Shepherd\'s Purse': '荠菜',
  'Chrysanthemum Vegetable': '茼蒿',
  'Chinese Cabbage': '大白菜',
  'Bok Choy': '小白菜/上海青',
  'Water Spinach': '空心菜',

  // --- 3. 菌菇 & 干货 (Fungi & Dried Goods) ---
  'Wood Ear': '木耳',
  'Silver Ear': '银耳',
  'Shiitake Mushroom': '香菇',
  'Enoki Mushroom': '金针菇',
  'Oyster Mushroom': '平菇',
  'Bamboo Fungus': '竹荪',
  'Day Lily': '黄花菜',
  'Wolfberry': '枸杞',
  'Jujube': '红枣',
  'Ginkgo': '白果',
  'Lotus Seed': '莲子',
  'Lily Bulb': '百合',

  // --- 4. 肉禽内脏 (The "Hardcore" Parts) ---
  'Pork Belly': '五花肉',
  'Pork Trotter': '猪蹄',
  'Pork Intestine': '猪大肠',
  'Pork Blood': '猪血',
  'Duck Blood': '鸭血',
  'Beef Tripe': '毛肚/牛肚',
  'Beef Tendon': '牛筋',
  'Beef Omasum': '百叶/千层肚',
  'Chicken Feet': '鸡爪',
  'Duck Tongue': '鸭舌',
  'Pig Brain': '猪脑',
  'Giblets': '下水/内脏',
  'Offal': '内脏',

  // --- 5. 水产 & 豆制品 (Aquatic & Tofu) ---
  'Soft-shell Turtle': '甲鱼',
  'Bullfrog': '牛蛙',
  'River Snail': '螺蛳',
  'Crayfish': '小龙虾',
  'Silver Carp': '鲢鱼',
  'Grass Carp': '草鱼',
  'Perch': '鲈鱼',
  'Tofu': '豆腐',
  'Stinky Tofu': '臭豆腐',
  'Tofu Skin': '豆腐皮/腐竹',
  'Tofu Curd': '豆花/豆腐脑',

  // --- 6. 蛋类 & 其他 (Eggs & Others) ---
  'Century Egg': '皮蛋',
  'Salted Duck Egg': '咸鸭蛋',
  'Quail Egg': '鹌鹑蛋',
  'Vermicelli': '粉丝/粉条',
  'Rice Noodle': '米粉'
};
export const useDishTranslator = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  const translateDish = useMemo(() => (dish: any) => {
    if (!dish) return null;

    const formatFallback = (text: string) => 
      text ? text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "";

    // 1. 菜名处理
    const name_cn = dish.name_cn || "未知菜品";
    const displayName = dish.name_translated || 
                        t(`dishes.${dish.name_en}`, { 
                          defaultValue: formatFallback(dish.name_en || dish.name_cn) 
                        });

    // 2. 食材处理逻辑
    const displayIngredients = (Array.isArray(dish.ingredients) ? dish.ingredients : []).map((ing: any) => {
      const isStr = typeof ing === 'string';
      const enKey = isStr ? ing : (ing.name_en || '');
      
      // 【策略 A】提取纯净中文名 (name_cn)
      // 1. 优先查应急字典
      // 2. 其次用 API 返回的 name_cn
      // 3. 最后兜底用格式化的英文
      const pureCn = FALLBACK_CN_MAP[enKey] || (!isStr && ing.name_cn) || formatFallback(enKey);

      // 【策略 B】提取展示名称 (displayName)
      let translatedName = "";
      if (currentLang.startsWith('zh')) {
        // 中文模式：直接显示中文名
        translatedName = pureCn;
      } else {
        // 非中文模式：
        // 1. 尝试本地 i18n 翻译文件
        // 2. 尝试使用 API 提供的翻译字段
        // 3. 实在不行用格式化的英文
        const i18nEntry = t(`ingredients.${enKey}`, { defaultValue: "" });
        
        if (i18nEntry) {
          translatedName = i18nEntry;
        } else {
          translatedName = (!isStr && ing.name_translated && ing.name_translated !== enKey) 
            ? ing.name_translated 
            : formatFallback(enKey);
        }
      }

      return {
        ...(isStr ? {} : ing),
        name_en: enKey,
        name_cn: pureCn, 
        displayName: translatedName,
      };
    });

    return {
      ...dish,
      name_cn, 
      displayName,
      displayIngredients, 
      displayPrice: dish.price 
        ? `${dish.price.toString().replace(/[^\d.]/g, '')} ${t('common.currency', { defaultValue: 'Yuan' })}`
        : null
    };
  }, [t, currentLang]);

  return { translateDish, currentLang };
};