import React, { useEffect, useState } from 'react';
import { Dish } from '../types';

// 初始静态词库（当 KV 为空或加载失败时展示）
const CLASSIC_DISHES = [
  "Kung Pao Chicken (宫保鸡丁)", "Mapo Tofu (麻婆豆腐)", "Peking Duck (北京烤鸭)", 
  "Soup Dumplings (小笼包)", "Hot Pot (火锅)", "Twice-Cooked Pork (回锅肉)", 
  "Dim Sum (点心)", "General Tso's Chicken (左宗棠鸡)", "Dan Dan Noodles (担担面)", 
  "Chow Mein (炒面)", "Scallion Pancake (葱油饼)", "Sweet and Sour Pork (糖醋里脊)",
  "Beef Broccoli (西兰花牛)", "Egg Fried Rice (蛋炒饭)", "Spring Rolls (春卷)"
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
      {[...items, ...items, ...items].map((item, i) => (
        <button 
          key={i} 
          onClick={() => onItemClick(item)}
          className={`px-5 py-2.5 border rounded-full shadow-sm flex items-center gap-3 transition-all group active:scale-95 ${
            item.isHistory 
              ? 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-400 ring-1 ring-red-100' 
              : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <span className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${
            item.isHistory ? 'text-red-500' : 'text-slate-400 group-hover:text-slate-600'
          }`}>
            {item.en}
          </span>
          <span className={`text-sm font-bold ${
            item.isHistory ? 'text-red-700' : 'text-slate-800'
          }`}>
            {item.cn}
          </span>
          {item.isHistory && <span className="animate-pulse">✨</span>}
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
        // 2. 这里的地址请替换为你部署后的 Worker 域名
        // 如果是本地开发环境，通常是 http://localhost:8787/api/history
        const API_BASE = window.location.hostname === 'localhost' 
          ? 'http://localhost:8787' 
          : 'https://你的worker项目名.workers.dev'; // <--- 只需要修改这里

        const response = await fetch(`${API_BASE}/api/history`);
        const historyData = await response.json();
        
        const historyItems = historyData.map((d: any) => ({
          en: d.name_en,
          cn: d.name_cn,
          isHistory: true,
          fullData: d 
        }));

        // 3. 合并：历史词条放在最前面，增强视觉区分
        setDisplayItems([...historyItems, ...baseItems]);
      } catch (e) {
        console.error("Failed to load history from KV:", e);
        setDisplayItems(baseItems);
      }
    };

    loadCloudData();
  }, []);

  const handleItemClick = (item: any) => {
    if (item.isHistory) {
      // 红色词条：直接打开详情卡片
      onShowDetail(item.fullData);
    } else {
      // 普通词条：跳转 Bing 国际版图片搜索
      const query = encodeURIComponent(`${item.en} ${item.cn} Chinese food`);
      window.open(`https://www.bing.com/images/search?q=${query}`, '_blank');
    }
  };

  if (displayItems.length === 0) return null;

  const rowCount = 4;
  const chunkSize = Math.ceil(displayItems.length / rowCount);
  const rows = Array.from({ length: rowCount }, (_, i) => 
    displayItems.slice(i * chunkSize, (i + 1) * chunkSize)
  );

  return (
    <div className="w-full overflow-hidden bg-white/30 backdrop-blur-sm py-16 border-t border-slate-100">
      <Row items={rows[0] || []} onItemClick={handleItemClick} duration="100s" />
      <Row items={rows[1] || []} onItemClick={handleItemClick} reverse duration="80s" />
      <Row items={rows[2] || []} onItemClick={handleItemClick} duration="110s" />
      <Row items={rows[3] || []} onItemClick={handleItemClick} reverse duration="90s" />
      
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } }
        @keyframes marquee-reverse { 0% { transform: translateX(-33.33%); } 100% { transform: translateX(0); } }
        .animate-marquee { animation: marquee linear infinite; }
        .animate-marquee-reverse { animation: marquee-reverse linear infinite; }
      `}</style>
    </div>
  );
};