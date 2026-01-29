import React from 'react';
import { ChiliIcon } from './Icons';

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
  const nameCN = dish.name_cn || "未知菜名";
  const nameEN = dish.name_en || "Unknown Dish";
  const spiciness = Number(dish.spiciness_level || 0);
  const isAnalyzed = dish.isFullyAnalyzed;
  
  // 核心改进：只要有数据就展示，不等待深度分析完成
  const ingredients = Array.isArray(dish.ingredients) ? dish.ingredients : [];
  const hasExtraData = ingredients.length > 0 || !!dish.description;

  // 价格格式化：只保留数字 + Yuan 后缀
  const formatPrice = (p: any) => {
    if (!p) return "";
    const pStr = p.toString();
    const cleanPrice = pStr.replace(/[^\d.]/g, '');
    return cleanPrice ? `${cleanPrice} Yuan` : pStr;
  };
  const displayPrice = formatPrice(dish.price);

  const getIngredientLabel = (ing: any) => {
    if (!ing) return null;
    if (typeof ing === 'object') return ing.name_en || ing.name_cn;
    return typeof ing === 'string' ? ing : null;
  };

  return (
    <button 
      onClick={onClick} 
      className={`group relative text-left overflow-hidden bg-white border transition-all duration-500 w-full flex flex-col ${
        isAnalyzed 
          ? 'border-rose-200 shadow-md rounded-[2.2rem] h-full ring-1 ring-rose-100' 
          : 'border-slate-100 shadow-sm rounded-[1.5rem] h-fit hover:border-rose-200 hover:shadow-lg hover:-translate-y-1'
      }`}
    >
      {/* 顶部极细进度条 - 仅在未分析时显示 */}
      {!isAnalyzed && (
        <div className="absolute top-0 left-0 w-full h-0.5 overflow-hidden bg-slate-50/50">
          <div className="h-full bg-rose-200/40 animate-[shimmer_3s_infinite] w-1/3"></div>
        </div>
      )}

      <div className={`flex flex-col justify-between w-full ${isAnalyzed ? 'p-5 md:p-6' : 'p-4'}`}>
        <div>
          <div className="flex justify-between items-start gap-2 mb-0.5">
            <h4 className={`font-black text-rose-600 tracking-tight leading-tight uppercase italic flex-1 ${isAnalyzed ? 'text-lg' : 'text-base'}`}>
              {nameEN}
            </h4>
            {displayPrice && (
              <span className="bg-rose-50 text-rose-600 font-black px-1.5 py-0.5 rounded-md text-[9px] whitespace-nowrap border border-rose-100/30">
                {displayPrice}
              </span>
            )}
          </div>
          
          <h3 className={`font-bold text-slate-500 tracking-tight ${isAnalyzed ? 'text-sm mb-3' : 'text-xs mb-1'}`}>
            {nameCN}
          </h3>
          
          {/* 修改：只要有内容且符合展示条件就渲染 */}
          {hasExtraData && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {ingredients.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {ingredients.slice(0, 3).map((ing: any, i: number) => {
                    const label = getIngredientLabel(ing);
                    return label ? (
                      <span key={i} className="text-[8px] font-black bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-100 uppercase">
                        {label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              {dish.description && (
                <p className="text-slate-400 text-[10px] line-clamp-2 mb-3 font-medium italic leading-relaxed">
                  {dish.description}
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className={`mt-auto flex items-center justify-between border-t border-slate-50 ${isAnalyzed ? 'pt-4' : 'pt-2'}`}>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <ChiliIcon 
                key={i} 
                className={`transition-all duration-300 ${isAnalyzed ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'} ${
                  i < spiciness ? 'text-rose-600' : 'text-slate-100'
                }`} 
                filled={i < spiciness} 
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`text-[8px] font-black uppercase tracking-[0.1em] transition-colors ${
              isAnalyzed ? 'text-rose-600' : 'text-slate-300 group-hover:text-rose-600'
            }`}>
              {isAnalyzed ? 'Full Info' : 'Details'}
            </span>
            <div className={`rounded-full border flex items-center justify-center transition-all ${
              isAnalyzed 
                ? 'h-7 w-7 bg-rose-600 border-rose-600 text-white shadow-sm' 
                : 'h-6 w-6 border-slate-100 text-slate-200 group-hover:border-rose-300 group-hover:text-rose-300'
            }`}>
              <SearchIconInternal className={isAnalyzed ? "w-3.5 h-3.5" : "w-3 h-3"} />
            </div>
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