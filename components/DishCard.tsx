import React from 'react';
import { ChiliIcon, LeafIcon, WarningIcon } from './Icons';

export const DishCard: React.FC<{ dish: any; onClick: () => void }> = ({ dish, onClick }) => {
  // 核心修复：对齐变量名。如果 AI 返回的是 name_cn，则优先使用；如果没有，尝试 dish_name_cn
  const nameCN = dish.name_cn || dish.dish_name_cn || "未知菜名";
  const nameEN = dish.name_en || dish.dish_name_en || "Unknown Dish";
  const description = dish.description || "No description available.";
  const price = dish.price || "";
  const spiciness = typeof dish.spiciness === 'number' ? dish.spiciness : 0;

  return (
    <button 
      onClick={onClick} 
      // 这里的 class 增加了 border, shadow, rounded 以确保轮廓显示
      className="group text-left overflow-hidden bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-rose-200 transition-all duration-300 w-full h-full flex flex-col"
    >
      <div className="p-6 md:p-8 flex flex-col justify-between h-full w-full">
        <div>
          <div className="flex justify-between items-start gap-4 mb-4">
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
              {nameCN}
            </h3>
            {price && (
              <span className="bg-slate-900 text-white font-medium px-3 py-1 rounded-xl text-xs whitespace-nowrap">
                {price}
              </span>
            )}
          </div>
          
          <h4 className="text-lg font-semibold text-rose-600 mb-3">{nameEN}</h4>
          <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">{description}</p>
          
          {/* 提示栏 */}
          <div className="flex items-start gap-2 border-l-2 border-slate-100 pl-3 py-1 mb-4">
            <p className="text-[10px] text-slate-400 italic leading-snug">
              Note: Ingredients may vary. <br/>
              Tap to check details with staff.
            </p>
          </div>
        </div>
        
        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {dish.is_vegetarian && (
              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <LeafIcon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wide">Veg</span>
              </div>
            )}
            {dish.has_animal_fats && (
              <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                <WarningIcon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wide">Fats</span>
              </div>
            )}
            <div className="flex items-center gap-0.5 ml-1">
              {[...Array(5)].map((_, i) => (
                <ChiliIcon 
                  key={i} 
                  className={`w-3.5 h-3.5 ${i < spiciness ? 'text-rose-600' : 'text-slate-100'}`} 
                  filled={i < spiciness} 
                />
              ))}
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-rose-600 transition-colors">Details →</span>
        </div>
      </div>
    </button>
  );
};