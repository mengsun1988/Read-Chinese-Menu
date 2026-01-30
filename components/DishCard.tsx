import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChiliIcon } from './Icons';
import { useDishTranslator } from '../src/hooks/useDishTranslator';

const SearchIconInternal = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export const DishCard: React.FC<{ dish: any; onClick: () => void }> = ({ dish: rawDish, onClick }) => {
  const { t } = useTranslation();
  const { translateDish } = useDishTranslator();
  
  // 响应式翻译数据（用于获取 displayName 和翻译后的食材列表）
  const dish = translateDish(rawDish);
  
  if (!dish) return null;

  // 1. 菜名：强行锁定原始中文
  const nameCN = rawDish.name_cn || "未知菜名";
  const nameDisplay = dish.displayName; 

  const spiciness = Number(dish.spiciness_level || 0);
  const isAnalyzed = dish.isFullyAnalyzed;

  return (
    <button 
      onClick={onClick} 
      className={`group relative text-left overflow-hidden bg-white border transition-all duration-500 w-full flex flex-col ${
        isAnalyzed ? 'border-rose-200 shadow-md rounded-[2.2rem] h-full ring-1 ring-rose-100' : 'border-slate-100 shadow-sm rounded-[1.5rem] h-fit hover:border-rose-200 hover:shadow-lg hover:-translate-y-1'
      }`}
    >
      <div className={`flex flex-col justify-between w-full ${isAnalyzed ? 'p-5 md:p-6' : 'p-4'}`}>
        <div>
          <div className="flex justify-between items-start gap-2 mb-0.5">
            <h4 className={`font-black text-rose-600 tracking-tight leading-tight uppercase italic flex-1 ${isAnalyzed ? 'text-lg' : 'text-base'}`}>
              {nameDisplay}
            </h4>
            {dish.displayPrice && (
              <span className="bg-rose-50 text-rose-600 font-black px-1.5 py-0.5 rounded-md text-[9px] whitespace-nowrap border border-rose-100/30">
                {dish.displayPrice}
              </span>
            )}
          </div>
          
          {/* 副标题：永远显示原始中文菜名 */}
          <h3 className={`font-bold text-slate-500 tracking-tight ${isAnalyzed ? 'text-sm mb-3' : 'text-xs mb-1'}`}>
            {nameCN}
          </h3>
          
          {/* 食材 Badge：双语修复 */}
          {(dish.displayIngredients || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {dish.displayIngredients.slice(0, 3).map((ing: any, i: number) => {
                // 【核心修复】不信任 ing 内部的 name_cn，而是回溯到 rawDish 的原始数据中查找
                // 这样可以确保即便 Hook 内部逻辑出错，UI 渲染依然能抓到最初的中文名
                const rawIng = (rawDish.ingredients || []).find((ri: any) => 
                  ri.name_en === ing.name_en || ri.name_cn === ing.name_cn
                );
                
                const originalCn = rawIng?.name_cn || ing.name_cn || "";
                const translatedName = ing.displayName;

                // 只有当翻译后的名字和中文不同时，才显示分割线和翻译名
                const shouldShowTranslation = translatedName && translatedName !== originalCn;

                return (
                  <span key={i} className="text-[8px] font-black bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-100 uppercase flex items-center gap-1">
                    {/* 始终渲染中文 */}
                    <span className="text-slate-600">{originalCn}</span>
                    
                    {/* 如果有有效翻译，渲染外文部分 */}
                    {shouldShowTranslation && (
                      <span className="opacity-50 border-l border-slate-200 pl-1">
                        {translatedName}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        
        <div className={`mt-auto flex items-center justify-between border-t border-slate-50 ${isAnalyzed ? 'pt-4' : 'pt-2'}`}>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <ChiliIcon key={i} className={`transition-all duration-300 ${isAnalyzed ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'} ${i < spiciness ? 'text-rose-600' : 'text-slate-100'}`} filled={i < spiciness} />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${isAnalyzed ? 'text-rose-600' : 'text-slate-300'}`}>
              {isAnalyzed ? t('common.fullInfo') : t('common.details')}
            </span>
            <div className={`rounded-full border flex items-center justify-center ${isAnalyzed ? 'h-7 w-7 bg-rose-600 border-rose-600 text-white' : 'h-6 w-6 border-slate-100 text-slate-200'}`}>
              <SearchIconInternal className={isAnalyzed ? "w-3.5 h-3.5" : "w-3 h-3"} />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};