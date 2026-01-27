import React, { useEffect, useState } from 'react';

const DOMESTIC_DISHES = [
  "Fish Flavored Shredded Pork (鱼香肉丝)", "Mapo Tofu (麻婆豆腐)", "Peking Duck (北京烤鸭)", 
  "Soup Dumplings (小笼包)", "Spicy Hot Pot (麻辣香锅)", "Twice-Cooked Pork (回锅肉)", 
  "Pan-Fried Buns (生煎包)", "Spicy Crayfish (麻辣小龙虾)", "Dan Dan Noodles (担担面)", 
  "Lanzhou Beef Noodles (兰州牛肉面)", "Scallion Pancake (葱油饼)", "Sweet and Sour Ribs (糖醋排骨)",
  "Hunan Sautéed Pork (小炒肉)", "Steamed Fish Head with Chili (剁椒鱼头)", "Boiled Fish with Chili (水煮鱼)",
  "Wonton Soup (馄饨)", "Char Siu (叉烧)", "Hainanese Chicken Rice (海南鸡饭)",
  "Zha Jiang Mian (炸酱面)", "Rou Jia Mo (肉夹馍)", "Stinky Tofu (臭豆腐)",
  "Biang Biang Noodles (油泼扯面)", "Lion's Head Meatballs (狮子头)", "Dongpo Pork (东坡肉)",
  "Bridge Crossing Noodles (过桥米线)", "Claypot Rice (煲仔饭)", "Beef Chow Fun (干炒牛河)",
  "Kung Pao Chicken (宫保鸡丁)", "Braised Pork Belly (红烧肉)", "White Cut Chicken (白切鸡)",
  "Stir-fried Pea Shoots (清炒豆苗)", "Preserved Egg Porridge (皮蛋瘦肉粥)", "Maltang (麻辣烫)"
];

interface RowProps {
  items: Array<{en: string, cn: string, isHistory?: boolean, fullData?: any}>;
  onItemClick: (item: any) => void;
  reverse?: boolean;
  duration?: string;
}

const Row = ({ items, onItemClick, reverse = false, duration = "40s" }: RowProps) => {
  if (!items.length) return null;
  
  return (
    <div className="flex overflow-hidden mb-4 select-none w-full">
      <div 
        className={`flex gap-4 items-center shrink-0 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}
        style={{ animationDuration: duration }}
      >
        {Array.from({ length: 2 }).map((_, idx) => (
          <div key={idx} className="flex gap-4 items-center pr-4">
            {items.map((item, i) => (
              <button 
                key={`${idx}-${i}`} 
                onClick={() => onItemClick(item)}
                // 核心改动：bg-white/40 + backdrop-blur 完美融入灰底
                className={`px-6 py-3 border rounded-full shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] flex items-center gap-4 transition-all active:scale-95 whitespace-nowrap backdrop-blur-md ${
                  item.isHistory 
                    ? 'bg-rose-50/60 border-rose-200/50 ring-1 ring-rose-100/50' 
                    : 'bg-white/40 border-slate-200/40 hover:bg-white/80 hover:border-slate-300/50'
                }`}
              >
                <div className="flex flex-col items-start leading-none">
                  {/* 英文主标题：加重加大 */}
                  <span className={`text-[13px] font-black uppercase tracking-tight mb-1 ${
                    item.isHistory ? 'text-rose-600' : 'text-slate-900'
                  }`}>
                    {item.en}
                  </span>
                  {/* 中文副标题：缩小淡化 */}
                  <span className={`text-[9px] font-bold tracking-wider ${
                    item.isHistory ? 'text-rose-400' : 'text-slate-400'
                  }`}>
                    {item.cn}
                  </span>
                </div>
                {item.isHistory && (
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const WordCloudMarquee: React.FC<{ onShowDetail: (d: any) => void }> = ({ onShowDetail }) => {
  const [displayItems, setDisplayItems] = useState<any[]>([]);

  useEffect(() => {
    const loadCloudData = async () => {
      const baseItems = DOMESTIC_DISHES.map(dish => {
        const [en, cnFull] = dish.split(' (');
        return { en, cn: cnFull.replace(')', ''), isHistory: false };
      });

      try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8787' : '';
        const response = await fetch(`${API_BASE}/api/history`);
        if (!response.ok) throw new Error();
        const historyData = await response.json();
        
        const historyItems = historyData.map((d: any) => ({
          en: d.name_en, cn: d.name_cn, isHistory: true, fullData: d 
        }));

        const combined = [...historyItems, ...baseItems];
        setDisplayItems(combined.slice(0, 300));
      } catch (e) {
        setDisplayItems(baseItems);
      }
    };
    loadCloudData();
  }, []);

  const handleItemClick = (item: any) => {
    if (item.isHistory) {
      onShowDetail(item.fullData);
    } else {
      const query = encodeURIComponent(`${item.en} ${item.cn} Chinese food`);
      window.open(`https://www.bing.com/images/search?q=${query}`, '_blank');
    }
  };

  if (displayItems.length === 0) return null;

  const rowCount = 4;
  const rows = Array.from({ length: rowCount }, (_, i) => displayItems.filter((_, idx) => idx % rowCount === i));

  return (
    <div className="w-full relative bg-transparent overflow-hidden">
      {/* 标题部分按要求保持不动 */}
      <header className="mb-12 space-y-4 text-center px-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full">
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
          <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">Traveler Feed</span>
        </div>
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Recently Identified</h3>
      </header>

      {/* 词云轨道 */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-[100vw] space-y-2">
        <Row items={rows[0]} onItemClick={handleItemClick} duration="100s" />
        <Row items={rows[1]} onItemClick={handleItemClick} reverse duration="80s" />
        <Row items={rows[2]} onItemClick={handleItemClick} duration="110s" />
        <Row items={rows[3]} onItemClick={handleItemClick} reverse duration="90s" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes marquee-reverse { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        .animate-marquee { animation: marquee linear infinite; }
        .animate-marquee-reverse { animation: marquee-reverse linear infinite; }
      `}} />
    </div>
  );
};