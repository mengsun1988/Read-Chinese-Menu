import React from 'react';
import { Dish } from '../types';

const CLASSIC_DISHES = [
  "Kung Pao Chicken (宫保鸡丁)", "Mapo Tofu (麻婆豆腐)", "Peking Duck (北京烤鸭)", 
  "Soup Dumplings (小笼包)", "Hot Pot (火锅)", "Twice-Cooked Pork (回锅肉)", 
  "Dim Sum (点心)", "General Tso's Chicken (左宗棠鸡)", "Dan Dan Noodles (担担面)", 
  "Chow Mein (炒面)", "Scallion Pancake (葱油饼)", "Sweet and Sour Pork (糖醋里脊)",
  "Beef Broccoli (西兰花牛)", "Egg Fried Rice (蛋炒饭)", "Spring Rolls (春卷)", 
  "Wonton Soup (馄饨汤)", "Ma Po Tofu (麻婆豆腐)", "Char Siu (叉烧)",
  "Hainanese Chicken Rice (海南鸡饭)", "Laksa (喇沙)", "Zha Jiang Mian (炸酱面)",
  "Biang Biang Noodles (油泼扯面)", "Rou Jia Mo (肉夹馍)", "Stinky Tofu (臭豆腐)",
  "Bubble Tea (珍珠奶茶)", "Mooncake (月饼)", "Tangyuan (汤圆)",
  "Lion's Head (狮子头)", "Ants Climbing Tree (蚂蚁上树)", "Dongpo Pork (东坡肉)",
  "Beggar's Chicken (叫花鸡)", "Mandarin Fish (松鼠鳜鱼)", "Bridge Noodles (过桥米线)",
  "Claypot Rice (煲仔饭)", "Beef Chow Fun (干炒牛河)", "Lo Mai Gai (糯米鸡)",
  "Egg Tart (蛋挞)", "Pineapple Bun (菠萝包)", "White Cut Chicken (白切鸡)",
  "Steamed Fish (清蒸鱼)", "Salt Pepper Squid (椒盐鱿鱼)", "Shrimp Dumplings (虾饺)",
  "Shumai (烧卖)", "Cheung Fun (肠粉)", "Radish Cake (萝卜糕)",
  "Turnip Cake (萝卜糕)", "Youtiao (油条)", "Soy Milk (豆浆)",
  "Century Egg (皮蛋)", "Tea Egg (茶叶蛋)", "Hot Sour Soup (酸辣汤)",
  "Egg Drop Soup (蛋花汤)", "Mashed Potatoes (土豆泥)", "Pickled Veg (泡菜)",
  "Lamb Skewers (羊肉串)", "Spicy Crawfish (麻辣小龙虾)", "Chongqing Chicken (辣子鸡)",
  "Yuxiang Pork (鱼香肉丝)", "Di San Xian (地三鲜)", "Braised Eggplant (红烧茄子)",
  "Green Beans (干煸四季豆)", "Pea Shoots (清炒豆苗)", "Bok Choy (蒜蓉青菜)",
  "Buddha Jumps (佛跳墙)", "Drunken Chicken (醉鸡)", "Pork Belly Bun (扣肉包)",
  "Sesame Chicken (芝麻鸡)", "Orange Chicken (陈皮鸡)", "Cashew Chicken (腰果鸡)",
  "Moo Shu Pork (木须肉)", "Sichuan Beef (水煮肉片)", "Black Pepper Beef (黑椒牛柳)",
  "Oyster Sauce Beef (蚝油牛肉)", "Lemon Chicken (柠檬鸡)", "Pork Ribs (排骨)",
  "Braised Pork (红烧肉)", "White Rice (白饭)", "Brown Rice (糙米)",
  "Fried Mantou (炸馒头)", "Red Bean Soup (红豆汤)", "Mango Sago (杨枝甘露)",
  "Grass Jelly (仙草)", "Abalone (鲍鱼)", "Bird's Nest (燕窝)",
  "Sea Cucumber (海参)", "Shark Fin (鱼翅)", "Crispy Pork (脆皮烧肉)",
  "Roast Pigeon (红烧乳鸽)", "Suckling Pig (乳猪)", "E-fu Noodles (伊面)",
  "Singpore Noodles (星洲炒米)", "Yangzhou Rice (扬州炒饭)", "Fujian Rice (福建炒饭)"
];

const Row = ({ items, onItemClick, reverse = false, duration = "40s" }: { items: string[], onItemClick: (d: Partial<Dish>) => void, reverse?: boolean, duration?: string }) => (
  <div className={`flex whitespace-nowrap gap-4 mb-4 ${reverse ? 'flex-row-reverse' : 'flex-row'}`}>
    <div 
      className={`flex gap-4 items-center shrink-0 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}
      style={{ animationDuration: duration }}
    >
      {[...items, ...items, ...items].map((dish, i) => {
        const [en, cnFull] = dish.split(' (');
        const cn = cnFull.replace(')', '');
        return (
          <button 
            key={i} 
            onClick={() => onItemClick({ dish_name_en: en, dish_name_cn: cn })}
            className="px-4 py-2 bg-white border border-slate-100 rounded-full shadow-sm flex items-center gap-3 hover:border-rose-400 hover:bg-rose-50 transition-all group active:scale-95"
          >
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-rose-600 uppercase tracking-tighter transition-colors">{en}</span>
            <span className="chinese-font text-sm font-black text-slate-800">{cn}</span>
          </button>
        );
      })}
    </div>
  </div>
);

export const WordCloudMarquee: React.FC<{ onItemClick: (d: Partial<Dish>) => void }> = ({ onItemClick }) => {
  const rowCount = 4;
  const chunkSize = Math.ceil(CLASSIC_DISHES.length / rowCount);
  const rows = Array.from({ length: rowCount }, (_, i) => 
    CLASSIC_DISHES.slice(i * chunkSize, (i + 1) * chunkSize)
  );

  return (
    <div className="w-full overflow-hidden bg-white/30 backdrop-blur-sm py-16 border-t border-slate-100">
      <Row items={rows[0]} onItemClick={onItemClick} duration="80s" />
      <Row items={rows[1]} onItemClick={onItemClick} reverse duration="65s" />
      <Row items={rows[2]} onItemClick={onItemClick} duration="90s" />
      <Row items={rows[3]} onItemClick={onItemClick} reverse duration="75s" />
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-33.33%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse linear infinite;
        }
      `}</style>
    </div>
  );
};