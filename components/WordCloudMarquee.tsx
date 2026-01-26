import React, { useEffect, useState } from 'react';

const CLASSIC_DISHES = [
  "Kung Pao Chicken (宫保鸡丁)", "Mapo Tofu (麻婆豆腐)", "Peking Duck (北京烤鸭)", 
  "Soup Dumplings (小笼包)", "Hot Pot (火锅)", "Twice-Cooked Pork (回锅肉)", 
  "Dim Sum (点心)", "General Tso's Chicken (左宗棠鸡)", "Dan Dan Noodles (担担面)", 
  "Chow Mein (炒面)", "Scallion Pancake (葱油饼)", "Sweet and Sour Pork (糖醋里脊)",
  "Beef Broccoli (西兰花牛)", "Egg Fried Rice (蛋炒饭)", "Spring Rolls (春卷)",
  "Wonton Soup (馄饨汤)", "Char Siu (叉烧)", "Hainanese Chicken Rice (海南鸡饭)",
  "Zha Jiang Mian (炸酱面)", "Rou Jia Mo (肉夹馍)", "Stinky Tofu (臭豆腐)",
  "Biang Biang Noodles (油泼扯面)", "Lion's Head (狮子头)", "Dongpo Pork (东坡肉)",
  "Bridge Noodles (过桥米线)", "Claypot Rice (煲仔饭)", "Beef Chow Fun (干炒牛河)"
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
    <div className="flex overflow-hidden mb-4 select-none">
      <div 
        className={`flex gap-4 items-center shrink-0 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}
        style={{ animationDuration: duration }}
      >
        {/* 渲染两组以实现无缝循环 */}
        {Array.from({ length: 2 }).map((_, idx) => (
          <div key={idx} className="flex gap-4 items-center">
            {items.map((item, i) => (
              <button 
                key={`${idx}-${i}`} 
                onClick={() => onItemClick(item)}
                className={`px-5 py-2.5 border rounded-full shadow-sm flex items-center gap-3 transition-all active:scale-95 whitespace-nowrap ${
                  item.isHistory 
                    ? 'bg-rose-50 border-rose-200 ring-1 ring-rose-100' 
                    : 'bg-white border-slate-100'
                }`}
              >
                <div className="flex flex-col items-start leading-none">
                  <span className={`text-[9px] font-black uppercase tracking-tighter mb-1 ${
                    item.isHistory ? 'text-rose-500' : 'text-slate-400'
                  }`}>
                    {item.en}
                  </span>
                  <span className={`text-sm font-bold ${
                    item.isHistory ? 'text-rose-700' : 'text-slate-800'
                  }`}>
                    {item.cn}
                  </span>
                </div>
                {item.isHistory && (
                  <div className="flex items-center gap-1 bg-rose-600 text-white text-[8px] font-black px-2 py-1 rounded-full animate-pulse">
                    <span>LIVE</span>
                  </div>
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
      const baseItems = CLASSIC_DISHES.map(dish => {
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

  // 将数据分配到 4 行
  const rowCount = 4;
  const rows = Array.from({ length: rowCount }, (_, i) => {
    return displayItems.filter((_, idx) => idx % rowCount === i);
  });

  return (
    // 修改点：去掉了 bg-slate-50/50 和 border-t，改为透明背景
    <div className="w-full overflow-hidden bg-transparent py-16">
      <div className="max-w-xl mx-auto px-6 mb-10 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-900 leading-tight">Traveler Feed</h3>
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1">Recently identified items</p>
          </div>
        </div>
      </div>

      <div className="relative w-full">
        {/* 修改点：遮罩颜色从 slate-50 改为 transparent，确保过渡自然 */}
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none"></div>

        <Row items={rows[0]} onItemClick={handleItemClick} duration="80s" />
        <Row items={rows[1]} onItemClick={handleItemClick} reverse duration="65s" />
        <Row items={rows[2]} onItemClick={handleItemClick} duration="90s" />
        <Row items={rows[3]} onItemClick={handleItemClick} reverse duration="75s" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse linear infinite;
        }
      `}} />
    </div>
  );
};