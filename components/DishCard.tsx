import React from 'react';
import { ChiliIcon } from './Icons';
import { Ingredient } from '../types';

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
  // 统一字段读取逻辑，与 Worker 映射一致
  const nameCN = dish.name_cn || "未知菜名";
  const nameEN = dish.name_en || "Unknown Dish";
  const description = dish.description || "";
  const price = dish.price || "";
  const spiciness = Number(dish.spiciness_level || 0);
  
  // 核心逻辑：是否已经完成了深度分析（由 App.tsx 触发 getDishDeepDetail 后标记）
  const isAnalyzed = dish.isFullyAnalyzed;
  const ingredients = Array.isArray(dish.ingredients) ? dish.ingredients : [];

  const getIngredientDisplay = (ing: Ingredient | string | any) => {
    if (!ing) return null;
    if (typeof ing === 'object' && (ing.name_en || ing.name_cn)) {
      return ing.name_en || ing.name_cn;
    }
    return typeof ing === 'string' ? ing : null;
  };

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
      className={`group relative text-left overflow-hidden bg-white border rounded-[2.2rem] transition-all duration-500 w-full h-full flex flex-col ${
        isAnalyzed 
          ? 'border-rose-100 shadow-md hover:shadow-xl' 
          : 'border-slate-100 shadow-sm hover:border-rose-200'
      }`}
    >
      {/* 顶部进度条：仅在未分析时显示微弱动效，提示可以点击查看详情 */}
      {!isAnalyzed && (
        <div className="absolute top-0 left-0 w-full h-1 overflow-hidden bg-slate-50/50">
          <div className="h-full bg-slate-200 animate-[shimmer_3s_infinite] w-1/3"></div>
        </div>
      )}

      <div className="p-5 md:p-7 flex flex-col justify-between h-full w-full">
        <div>
          <div className="flex justify-between items-start gap-3 mb-1">
            <h4 className="text-lg font-black text-rose-600 tracking-tight leading-tight uppercase italic flex-1">
              {nameEN}
            </h4>
            {price ? (
              <span className="bg-rose-50 text-rose-600 font-black px-2 py-0.5 rounded-lg text-[10px] whitespace-nowrap border border-rose-100/50 mt-1">
                {price}
              </span>
            ) : isAnalyzed && (
              <span className="bg-emerald-50 text-emerald-600 font-black px-2 py-0.5 rounded-lg text-[8px] uppercase tracking-tighter border border-emerald-100/50 mt-1">
                Analyzed
              </span>
            )}
          </div>
          
          <h3 className="text-sm font-bold text-slate-500 mb-4 tracking-tight leading-tight">
            {nameCN}
          </h3>
          
          {/* 食材展示区：如果未分析，显示占位符 */}
          <div className="min-h-[32px] mb-4">
            {!isAnalyzed ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-24 bg-slate-50 rounded-md border border-slate-100/50 flex items-center px-2">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Tap for Details</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 animate-in fade-in zoom-in duration-500">
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
            {description || (isAnalyzed ? "No further description available." : "Tap to analyze ingredients, hidden fats, and pronunciation...")}
          </p>
        </div>
        
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <ChiliIcon 
                  key={i} 
                  className={`w-3.5 h-3.5 transition-all duration-300 ${
                    i < spiciness ? 'text-rose-600 scale-110 drop-shadow-sm' : 'text-slate-100'
                  }`} 
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
            <div className={`h-7 w-7 rounded-full border flex items-center justify-center transition-all ${
              isAnalyzed 
                ? 'bg-rose-600 border-rose-600 text-white' 
                : 'border-slate-200 text-slate-300 group-hover:border-rose-500 group-hover:text-rose-500 group-hover:bg-rose-50'
            }`}>
              <SearchIconInternal className="w-3.5 h-3.5" />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-colors ${
              isAnalyzed ? 'text-rose-600' : 'text-slate-300 group-hover:text-rose-600'
            }`}>
              {isAnalyzed ? 'Full Info' : 'Details'}
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