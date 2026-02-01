import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChiliIcon } from './Icons';
import { useDishTranslator } from '../src/hooks/useDishTranslator';
import { getAllergenSeverityColor } from '../src/utils/allergenHelper';

const SearchIconInternal = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const RiskIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

export const DishCard: React.FC<{ dish: any; onClick: () => void }> = ({ dish: rawDish, onClick }) => {
  const { t } = useTranslation();
  const { translateDish } = useDishTranslator();
  
  const dish = translateDish(rawDish);
  
  if (!dish) return null;

  const nameCN = rawDish.name_cn || "未知菜名";
  const nameDisplay = dish.displayName; 
  const spiciness = Number(dish.spiciness_level || 0);
  const isAnalyzed = dish.isFullyAnalyzed;
  const allergens = dish.allergens || [];

  return (
    <button 
      onClick={onClick} 
      className={`group relative text-left overflow-hidden bg-white border transition-all duration-500 w-full flex flex-col ${
        isAnalyzed ? 'border-rose-200 shadow-md rounded-[2.2rem] h-full ring-1 ring-rose-100' : 'border-slate-100 shadow-sm rounded-[1.5rem] h-fit hover:border-rose-200 hover:shadow-lg hover:-translate-y-1'
      }`}
    >
      {/* 右上角仅保留价格，不再受圆点干扰 */}
      {dish.displayPrice && !isAnalyzed && (
        <div className="absolute top-3 right-3 z-20">
          <span className="bg-rose-50/90 backdrop-blur-sm text-rose-600 font-black px-2 py-0.5 rounded-lg text-[10px] border border-rose-100 shadow-sm">
            {dish.displayPrice}
          </span>
        </div>
      )}

      <div className={`flex flex-col justify-between w-full ${isAnalyzed ? 'p-5 md:p-6' : 'p-4'}`}>
        <div>
          <div className="flex justify-between items-start gap-2 mb-0.5">
            <h4 className={`font-black text-rose-600 tracking-tight leading-tight uppercase italic flex-1 ${isAnalyzed ? 'text-lg' : 'text-base pr-12'}`}>
              {nameDisplay}
            </h4>
          </div>
          
          <h3 className={`font-bold text-slate-500 tracking-tight ${isAnalyzed ? 'text-sm mb-3' : 'text-xs mb-1'}`}>
            {nameCN}
          </h3>
          
          {/* 食材展示 */}
          {(dish.displayIngredients || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {dish.displayIngredients.slice(0, 3).map((ing: any, i: number) => {
                const rawIng = (rawDish.ingredients || []).find((ri: any) => 
                  ri.name_en === ing.name_en || ri.name_cn === ing.name_cn
                );
                const originalCn = rawIng?.name_cn || ing.name_cn || "";
                return (
                  <span key={i} className="text-[8px] font-black bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-100 uppercase flex items-center gap-1">
                    <span className="text-slate-600">{originalCn}</span>
                    {ing.displayName && ing.displayName !== originalCn && (
                      <span className="opacity-50 border-l border-slate-200 pl-1">
                        {ing.displayName}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          )}

          {/* 已分析状态下的过敏原文本保留 */}
          {isAnalyzed && allergens.length > 0 && (
            <p className="text-[9px] font-bold text-rose-400 mb-2 italic flex items-center gap-1">
              <span className="not-italic">⚠️</span> {t('dishDetail.dietaryFlags')}: {allergens.slice(0, 2).join(', ')}
            </p>
          )}
        </div>
        
        {/* 底部功能区：左侧现在放置风险标识 */}
        <div className={`mt-auto flex items-end justify-between border-t border-slate-50 ${isAnalyzed ? 'pt-4' : 'pt-3'}`}>
          <div className="flex flex-col gap-2">
            {/* 辣度指示器 */}
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <ChiliIcon key={i} className={`transition-all duration-300 ${isAnalyzed ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'} ${i < spiciness ? 'text-rose-600' : 'text-slate-100'}`} filled={i < spiciness} />
              ))}
            </div>

            {/* 风险标签移至左下角 */}
            {allergens.length > 0 && (
              <div className="flex items-center gap-1.5 bg-rose-50 px-2 py-1 rounded-md border border-rose-100/50 w-fit shadow-[0_1px_2px_rgba(225,29,72,0.05)]">
                <RiskIcon className="w-2.5 h-2.5 text-rose-500" />
                <div className="flex gap-1">
                  {allergens.slice(0, 3).map((a: string, i: number) => (
                    <div 
                      key={i} 
                      className={`w-1.5 h-1.5 rounded-full ${getAllergenSeverityColor(a)}`} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 pb-0.5">
            <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${isAnalyzed ? 'text-rose-600' : 'text-slate-300'}`}>
              {isAnalyzed ? t('common.fullInfo') : t('common.details')}
            </span>
            <div className={`rounded-full border flex items-center justify-center transition-all ${isAnalyzed ? 'h-7 w-7 bg-rose-600 border-rose-600 text-white' : 'h-6 w-6 border-slate-100 text-slate-200 group-hover:text-rose-600 group-hover:border-rose-200'}`}>
              <SearchIconInternal className={isAnalyzed ? "w-3.5 h-3.5" : "w-3 h-3"} />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};