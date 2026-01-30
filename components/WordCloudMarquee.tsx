import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface RowProps {
  items: Array<{en: string, cn: string, isHistory?: boolean, fullData?: any}>;
  onItemClick: (item: any) => void;
  reverse?: boolean;
  duration?: string;
}

const Row = ({ items, onItemClick, reverse = false, duration = "40s" }: RowProps) => {
  if (!items || !items.length) return null;
  
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
                className={`px-6 py-3 border rounded-full shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] flex items-center gap-4 transition-all active:scale-95 whitespace-nowrap backdrop-blur-md ${
                  item.isHistory 
                    ? 'bg-rose-50/60 border-rose-200/50 ring-1 ring-rose-100/50' 
                    : 'bg-white/40 border-slate-200/40 hover:bg-white/80 hover:border-slate-300/50'
                }`}
              >
                <div className="flex flex-col items-start leading-none">
                  <span className={`text-[13px] font-black uppercase tracking-tight mb-1 ${
                    item.isHistory ? 'text-rose-600' : 'text-slate-900'
                  }`}>
                    {item.en}
                  </span>
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
  const { t, i18n } = useTranslation();
  const [displayItems, setDisplayItems] = useState<any[]>([]);

  useEffect(() => {
    const loadCloudData = async () => {
      // 1. 获取基础菜名数据（容错处理）
      let dishesFromI18n: string[] = [];
      try {
        const rawDishes = t('wordCloud.dishes', { returnObjects: true });
        dishesFromI18n = Array.isArray(rawDishes) ? rawDishes : [];
      } catch (e) {
        dishesFromI18n = [];
      }
      
      const baseItems = dishesFromI18n.map(dish => {
        const [en, cnFull] = dish.split(' (');
        return { 
          en: en || dish, 
          cn: cnFull ? cnFull.replace(')', '') : '', 
          isHistory: false 
        };
      });

      // 2. 尝试获取历史数据
      try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8787' : '';
        const response = await fetch(`${API_BASE}/api/history`, {
          // 增加信号，如果请求时间过长则放弃，防止卡死
          signal: AbortSignal.timeout(3000) 
        });
        
        if (!response.ok) throw new Error("Backend offline");
        const historyData = await response.json();
        
        const historyItems = historyData.map((d: any) => ({
          en: d.name_en, 
          cn: d.name_cn, 
          isHistory: true, 
          fullData: d 
        }));

        const combined = [...historyItems, ...baseItems];
        setDisplayItems(combined.slice(0, 300));
      } catch (e) {
        // 如果后端连接失败 (ERR_CONNECTION_REFUSED)，直接使用基础数据，控制台不再抛出未捕获异常
        console.log("CloudMarquee: Backend not available, showing default dishes.");
        setDisplayItems(baseItems);
      }
    };

    loadCloudData();
    // 关键：监听 i18n.language 而非 t 函数引用
  }, [i18n.language, t]); 

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
  const rows = Array.from({ length: rowCount }, (_, i) => 
    displayItems.filter((_, idx) => idx % rowCount === i)
  );

  return (
    <div className="w-full relative bg-transparent overflow-hidden">
      <header className="mb-12 space-y-4 text-center px-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full">
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
          <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">
            {t('wordCloud.badge')}
          </span>
        </div>
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
          {t('wordCloud.title')}
        </h3>
      </header>

      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-[100vw] space-y-2">
        {rows.map((rowItems, index) => (
          <Row 
            key={index}
            items={rowItems} 
            onItemClick={handleItemClick} 
            reverse={index % 2 !== 0}
            duration={`${90 + index * 10}s`} 
          />
        ))}
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