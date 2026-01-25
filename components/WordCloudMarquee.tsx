import React, { useEffect, useState } from 'react';

// 基础静态词库：当 KV 为空或加载失败时展示
const CLASSIC_DISHES = [
  "Kung Pao Chicken (宫保鸡丁)", "Mapo Tofu (麻婆豆腐)", "Peking Duck (北京烤鸭)", 
  "Soup Dumplings (小笼包)", "Hot Pot (火锅)", "Twice-Cooked Pork (回锅肉)", 
  "Dim Sum (点心)", "General Tso's Chicken (左宗棠鸡)", "Dan Dan Noodles (担担面)", 
  "Chow Mein (炒面)", "Scallion Pancake (葱油饼)", "Sweet and Sour Pork (糖醋里脊)",
  "Beef Broccoli (西兰花牛)", "Egg Fried Rice (蛋炒饭)", "Spring Rolls (春卷)",
  "Wonton Soup (馄饨汤)", "Char Siu (叉烧)", "Hainanese Chicken Rice (海南鸡饭)",
  "Zha Jiang Mian (炸酱面)", "Rou Jia Mo (肉夹馍)", "Stinky Tofu (臭豆腐)"
];

interface RowProps {
  items: Array<{en: string, cn: string, isHistory?: boolean, fullData?: any}>;
  onItemClick: (item: any) => void;
  reverse?: boolean;
  duration?: string;
}

const Row = ({ items, onItemClick, reverse = false, duration = "40s" }: RowProps) => (
  <div className={`flex whitespace-nowrap gap-4 mb-4 ${reverse ? 'flex-row-reverse' : 'flex-row'}`}>
    <div 
      className={`flex gap-4 items-center shrink-0 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}
      style={{ animationDuration: duration }}
    >
      {[...items, ...items].map((item, i) => (
        <button 
          key={i} 
          onClick={() => onItemClick(item)}
          className={`px-5 py-2.5 border rounded-full shadow-sm flex items-center gap-3 transition-all group active:scale-95 ${
            item.isHistory 
              ? 'bg-rose-50 border-rose-200 hover:bg-rose-100 hover:border-rose-400 ring-1 ring-rose-100/50' 
              : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex flex-col items-start leading-none">
            <span className={`text-[9px] font-black uppercase tracking-tighter mb-1 transition-colors ${
              item.isHistory ? 'text-rose-500' : 'text-slate-400 group-hover:text-slate-600'
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
            <div className="flex items-center gap-1 bg-rose-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter animate-pulse">
              <span>LIVE</span>
            </div>
          )}
        </button>
      ))}
    </div>
  </div>
);

export const WordCloudMarquee: React.FC<{ onShowDetail: (d: any) => void }> = ({ onShowDetail }) => {
  const [displayItems, setDisplayItems] = useState<any[]>([]);

  useEffect(() => {
    const loadCloudData = async () => {
      // 1. 准备静态基础词库
      const baseItems = CLASSIC_DISHES.map(dish => {
        const [en, cnFull] = dish.split(' (');
        return { en, cn: cnFull.replace(')', ''), isHistory: false };
      });

      try {
        // 配置你的 Worker 地址
        const API_BASE = window.location.hostname === 'localhost' 
          ? 'http://localhost:8787' 
          : 'https://你的worker项目名.workers.dev'; 

        const response = await fetch(`${API_BASE}/api/history`);
        const historyData = await response.json();
        
        const historyItems = historyData.map((d: any) => ({
          en: d.name_en,
          cn: d.name_cn,
          isHistory: true,
          fullData: d 
        }));

        // 2. 合并数据并限制总数在 300 以内
        const combined = [...historyItems, ...baseItems];
        setDisplayItems(combined.slice(0, 300));
      } catch (e) {
        console.error("Failed to load history:", e);
        setDisplayItems(baseItems.slice(0, 300));
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

  // 将 300 个词条均匀分配到 4 行
  const rowCount = 4;
  const chunkSize = Math.ceil(displayItems.length / rowCount);
  const rows = Array.from({ length: rowCount }, (_, i) => 
    displayItems.slice(i * chunkSize, (i + 1) * chunkSize)
  );

  return (
    <div className="w-full overflow-hidden bg-slate-50/50 py-16 border-t border-slate-100">
      {/* 引导提示语 */}
      <div className="max-w-screen-xl mx-auto px-6 mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
             <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
             <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">See what others are searching</h3>
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1">
              Red bubbles = Recently identified by travelers
            </p>
          </div>
        </div>
        <div className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
          {displayItems.length} Dishes Live
        </div>
      </div>

      {/* 滚动词云主体 */}
      <div className="relative">
        {/* 左右两侧渐变遮罩，增加高级感 */}
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-slate-50 to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-slate-50 to-transparent z-10"></div>

        <Row items={rows[0] || []} onItemClick={handleItemClick} duration="120s" />
        <Row items={rows[1] || []} onItemClick={handleItemClick} reverse duration="100s" />
        <Row items={rows[2] || []} onItemClick={handleItemClick} duration="140s" />
        <Row items={rows[3] || []} onItemClick={handleItemClick} reverse duration="110s" />
      </div>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes marquee-reverse { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        .animate-marquee { animation: marquee linear infinite; }
        .animate-marquee-reverse { animation: marquee-reverse linear infinite; }
      `}</style>
    </div>
  );
};