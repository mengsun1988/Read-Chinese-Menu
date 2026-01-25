import React from 'react';
import { ChiliIcon, LeafIcon, WarningIcon } from './Icons';

export const DishCard: React.FC<{ dish: any; onClick: () => void }> = ({ dish, onClick }) => {
  // 核心修复：确保字段多重兼容
  const nameCN = dish.name_cn || dish.dish_name_cn || dish.name || "未知菜名";
  const nameEN = dish.name_en || dish.dish_name_en || dish.english_name || "Unknown Dish";
  const description = dish.description || dish.desc || "";
  const price = dish.price || "";
  const spiciness = Number(dish.spiciness_level || dish.spiciness || 0);

  // 食材显示逻辑：处理对象数组或字符串数组
  const ingredients = Array.isArray(dish.ingredients) ? dish.ingredients : [];

  return (
    <button 
      onClick={onClick} 
      className="group text-left overflow-hidden bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-rose-200 transition-all duration-300 w-full h-full flex flex-col"
    >
      <div className="p-6 md:p-8 flex flex-col justify-between h-full w-full">
        <div>
          <div className="flex justify-between items-start gap-4 mb-2">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
              {nameCN}
            </h3>
            {price && (
              <span className="bg-slate-900 text-white font-medium px-3 py-1 rounded-xl text-xs whitespace-nowrap">
                {price}
              </span>
            )}
          </div>
          
          <h4 className="text-base font-semibold text-rose-600 mb-3">{nameEN}</h4>
          
          {/* 食材预览区域 */}
          {ingredients.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {ingredients.slice(0, 3).map((ing: any, i: number) => (
                <span key={i} className="text-[10px] bg-slate-50 text-slate-600 px-2 py-1 rounded-lg border border-slate-100">
                  {typeof ing === 'string' ? ing : (ing.name_en || ing.name_cn)}
                </span>
              ))}
              {ingredients.length > 3 && <span className="text-xs text-slate-400">...</span>}
            </div>
          )}

          <p className="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed">
            {description}
          </p>
        </div>
        
        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <ChiliIcon 
                  key={i} 
                  className={`w-3.5 h-3.5 ${i < spiciness ? 'text-rose-600' : 'text-slate-100'}`} 
                  filled={i < spiciness} 
                />
              ))}
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-rose-600">Details →</span>
        </div>
      </div>
    </button>
  );
};