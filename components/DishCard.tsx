import React from 'react';
import { ChiliIcon } from './Icons';

// 内部定义的搜索图标
const SearchIconInternal = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export const DishCard: React.FC<{ dish: any; onClick: () => void }> = ({ dish, onClick }) => {
  const nameCN = dish.name_cn || dish.dish_name_cn || dish.name || "未知菜名";
  const nameEN = dish.name_en || dish.dish_name_en || dish.english_name || "Unknown Dish";
  const description = dish.description || dish.desc || "";
  const price = dish.price || "";
  const spiciness = Number(dish.spiciness_level || dish.spiciness || 0);
  
  // 核心修复：更智能的食材解析逻辑
  const getIngredientDisplay = (ing: any) => {
    if (!ing) return null;
    
    // 如果是对象结构 {"name_cn": "...", "name_en": "..."}
    if (typeof ing === 'object' && (ing.name_en || ing.name_cn)) {
      // 优先显示英文，如果英文缺失则显示中文
      return ing.name_en || ing.name_cn;
    }
    
    // 如果直接是字符串
    if (typeof ing === 'string') {
      return ing;
    }
    
    return null;
  };

  const ingredients = Array.isArray(dish.ingredients) ? dish.ingredients : [];
  const isAnalyzing = !dish.ingredients || ingredients.length === 0;

  const getSpicyReference = (lvl: number) => {
    if (lvl <= 0) return "";
    if (lvl <= 1) return "Poblano (Mild)";
    if (lvl <= 2) return "Jalapeño (Medium)";
    if (lvl <= 3) return "Thai Chili (Hot)";
    return "Habanero (X-Hot)";
  };

  return (
    <button 
      onClick={onClick} 
      className="group relative text-left overflow-hidden bg-white border border-slate-100 rounded-[2.2rem] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 w-full h-full flex flex-col"
    >
      {isAnalyzing && (
        <div className="absolute top-0 left-0 w-full h-1 overflow-hidden bg-slate-50">
          <div className="h-full bg-rose-500 animate-[shimmer_2s_infinite] w-1/2"></div>
        </div>
      )}

      <div className="p-5 md:p-7 flex flex-col justify-between h-full w-full">
        <div>
          <div className="flex justify-between items-start gap-3 mb-1">
            <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight group-hover:text-rose-600 transition-colors">
              {nameCN}
            </h3>
            {price && (
              <span className="bg-rose-50 text-rose-600 font-black px-2 py-0.5 rounded-lg text-[10px] whitespace-nowrap border border-rose-100/50">
                {price}
              </span>
            )}
          </div>
          
          <h4 className="text-sm font-bold text-slate-400 mb-4 tracking-tight leading-tight uppercase italic">{nameEN}</h4>
          
          <div className="min-h-[32px] mb-4">
            {isAnalyzing ? (
              <div className="flex gap-2 animate-pulse">
                <div className="h-6 w-16 bg-slate-50 rounded-lg"></div>
                <div className="h-6 w-20 bg-slate-50 rounded-lg"></div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 animate-in fade-in duration-700">
                {ingredients.slice(0, 4).map((ing: any, i: number) => {
                  const label = getIngredientDisplay(ing);
                  if (!label) return null;
                  return (
                    <span key={i} className="text-[9px] font-black bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-100 group-hover:border-rose-100 transition-colors uppercase tracking-tight">
                      {label}
                    </span>
                  );
                })}
                {ingredients.length > 4 && (
                  <span className="text-[9px] font-bold text-slate-300 py-1">+{ingredients.length - 4}</span>
                )}
              </div>
            )}
          </div>

          <p className="text-slate-400 text-[11px] line-clamp-2 mb-4 leading-relaxed font-medium italic">
            {description || "Discovering the ingredients and flavors..."}
          </p>
        </div>
        
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <ChiliIcon 
                  key={i} 
                  className={`w-3.5 h-3.5 transition-all duration-300 ${i < spiciness ? 'text-rose-600 scale-110 drop-shadow-sm' : 'text-slate-100'}`} 
                  filled={i < spiciness} 
                />
              ))}
            </div>
            {spiciness > 0 && (
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                Ref: {getSpicyReference(spiciness)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-300 group-hover:border-rose-500 group-hover:text-rose-500 group-hover:bg-rose-50 transition-all">
              <SearchIconInternal className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.15em] group-hover:text-rose-600 transition-colors">
              Details
            </span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(250%); }
        }
      `}} />
    </button>
  );
};