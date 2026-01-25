import React from 'react';
import { ChiliIcon, LeafIcon, WarningIcon } from './Icons';

export const DishCard: React.FC<{ dish: any; onClick: () => void }> = ({ dish, onClick }) => {
  // 1. 强化菜名抓取逻辑 (兼容所有可能的 AI 返回字段)
  const nameCN = dish.name_cn || dish.dish_name_cn || dish.name || "未知菜名";
  const nameEN = dish.name_en || dish.dish_name_en || dish.english_name || dish.name_en_us || "Unknown Dish";
  
  // 2. 强化描述抓取
  const description = dish.description || dish.desc || dish.brief || "No description available.";
  
  // 3. 价格处理
  const price = dish.price || "";
  
  // 4. 辣度处理
  const spiciness = typeof dish.spiciness === 'number' ? dish.spiciness : (Number(dish.spiciness_level) || 0);

  // 5. 食材抓取逻辑 (即使在列表页不显示，也要确保数据存在以防报错)
  const ingredients = Array.isArray(dish.ingredients) 
    ? dish.ingredients 
    : (Array.isArray(dish.classic_ingredients) ? dish.classic_ingredients : []);

  return (
    <button 
      onClick={onClick} 
      className="group text-left overflow-hidden bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-rose-200 transition-all duration-300 w-full h-full flex flex-col"
    >
      <div className="p-6 md:p-8 flex flex-col justify-between h-full w-full">
        <div>
          {/* 标题与价格 */}
          <div className="flex justify-between items-start gap-4 mb-4">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
              {nameCN}
            </h3>
            {price && (
              <span className="bg-slate-900 text-white font-medium px-3 py-1 rounded-xl text-[10px] whitespace-nowrap">
                {price}
              </span>
            )}
          </div>
          
          <h4 className="text-base font-semibold text-rose-600 mb-3">{nameEN}</h4>
          
          {/* 食材简览 (新增：如果有食材，就在卡片上显示前三个) */}
          {ingredients.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {ingredients.slice(0, 3).map((ing: any, i: number) => (
                <span key={i} className="text-[9px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-100">
                  {typeof ing === 'string' ? ing : (ing.name_en || ing.name_cn)}
                </span>
              ))}
              {ingredients.length > 3 && <span className="text-[9px] text-slate-400">...</span>}
            </div>
          )}

          <p className="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed">
            {description}
          </p>
          
          <div className="flex items-start gap-2 border-l-2 border-slate-100 pl-3 py-1 mb-4">
            <p className="text-[10px] text-slate-400 italic leading-snug">
              Note: Ingredients may vary. <br/>
              Tap to check details with staff.
            </p>
          </div>
        </div>
        
        {/* 底部状态栏 */}
        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(dish.is_vegetarian || dish.dietary_flags?.includes('vegetarian')) && (
              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <LeafIcon className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-wide">Veg</span>
              </div>
            )}
            {dish.has_animal_fats && (
              <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                <WarningIcon className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-wide">Fats</span>
              </div>
            )}
            {/* 辣度图标 */}
            <div className="flex items-center gap-0.5 ml-1">
              {[...Array(5)].map((_, i) => (
                <ChiliIcon 
                  key={i} 
                  className={`w-3 h-3 ${i < spiciness ? 'text-rose-600' : 'text-slate-100'}`} 
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