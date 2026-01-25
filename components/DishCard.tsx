import React from 'react';
import { ChiliIcon, SearchIcon } from './Icons'; // 假设你有 SearchIcon

export const DishCard: React.FC<{ dish: any; onClick: () => void }> = ({ dish, onClick }) => {
  // 核心修复：确保字段多重兼容
  const nameCN = dish.name_cn || dish.dish_name_cn || dish.name || "未知菜名";
  const nameEN = dish.name_en || dish.dish_name_en || dish.english_name || "Unknown Dish";
  const description = dish.description || dish.desc || "";
  const price = dish.price || "";
  const spiciness = Number(dish.spiciness_level || dish.spiciness || 0);
  const isAnalyzing = !dish.ingredients || dish.ingredients.length === 0;

  // 食材显示逻辑
  const ingredients = Array.isArray(dish.ingredients) ? dish.ingredients : [];

  // 西餐辣度参照逻辑
  const getSpicyReference = (lvl: number) => {
    if (lvl <= 1) return "Bell Pepper (Mild)";
    if (lvl <= 2) return "Jalapeño (Medium)";
    if (lvl <= 3) return "Thai Chili (Hot)";
    return "Habanero (X-Hot)";
  };

  return (
    <button 
      onClick={onClick} 
      className="group relative text-left overflow-hidden bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 w-full h-full flex flex-col"
    >
      {/* 顶部加载光条 (仅在分析中显示) */}
      {isAnalyzing && (
        <div className="absolute top-0 left-0 w-full h-1 overflow-hidden">
          <div className="h-full bg-rose-500 animate-[shimmer_2s_infinite] w-1/2"></div>
        </div>
      )}

      <div className="p-5 md:p-7 flex flex-col justify-between h-full w-full">
        <div>
          {/* 标题行 */}
          <div className="flex justify-between items-start gap-3 mb-1">
            <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight group-hover:text-rose-600 transition-colors">
              {nameCN}
            </h3>
            {price && (
              <span className="bg-rose-50 text-rose-600 font-black px-2.5 py-1 rounded-lg text-[10px] whitespace-nowrap border border-rose-100">
                {price}
              </span>
            )}
          </div>
          
          <h4 className="text-sm font-bold text-slate-400 mb-4 tracking-tight">{nameEN}</h4>
          
          {/* 食材区：带骨架屏动效 */}
          <div className="min-h-[32px] mb-4">
            {isAnalyzing ? (
              <div className="flex gap-2 animate-pulse">
                <div className="h-6 w-16 bg-slate-100 rounded-lg"></div>
                <div className="h-6 w-20 bg-slate-100 rounded-lg"></div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 transition-all duration-500 animate-in fade-in">
                {ingredients.slice(0, 3).map((ing: any, i: number) => (
                  <span key={i} className="text-[9px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-100 group-hover:border-rose-100 group-hover:bg-white transition-colors">
                    {typeof ing === 'string' ? ing : (ing.name_en || ing.name_cn)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <p className="text-slate-400 text-[11px] line-clamp-2 mb-4 leading-relaxed font-medium">
            {description || "AI is generating dish description..."}
          </p>
        </div>
        
        {/* 底部功能区 */}
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
          {/* 辣度 + 对比 */}
          <div className="space-y-1">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <ChiliIcon 
                  key={i} 
                  className={`w-3 h-3 transition-transform duration-300 ${i < spiciness ? 'text-rose-600 scale-110' : 'text-slate-100'}`} 
                  filled={i < spiciness} 
                />
              ))}
            </div>
            {spiciness > 0 && (
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">
                Ref: {getSpicyReference(spiciness)}
              </p>
            )}
          </div>

          {/* 小型化搜索按钮 */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-rose-500 group-hover:text-rose-500 transition-all active:scale-90">
              <SearchIcon className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest group-hover:text-rose-600 group-hover:translate-x-1 transition-all">
              Details
            </span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}} />
    </button>
  );
};