import React from 'react';
import { useTranslation } from 'react-i18next';
import { getAllergenSeverityColor } from '../src/utils/allergenHelper';

interface StoreCardProps {
  store: any; // 使用 any 以兼容 AI 可能返回的不同字段名
  onShowStaff: () => void;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store, onShowStaff }) => {
  const { t } = useTranslation();

  if (!store) return null;

  // 字段对齐
  const displayName = store.name || store.store_name || store.name_cn || t('storeCard.localShop');
  const displayCuisine = store.cuisine || store.cuisine_type || t('storeCard.establishment');
  const specialtyDishes = store.specialty_dishes || store.specialties || [];
  const priceRange = store.average_price_range || store.price || t('storeCard.fairPrice');

  // 判断是否为餐饮类
  const cuisineLower = displayCuisine.toLowerCase();
  const isFood = !cuisineLower.includes('pharmacy') && 
                  !cuisineLower.includes('hair') &&
                  !cuisineLower.includes('salon');

  return (
    <div className="bg-slate-900 text-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-700 max-w-2xl mx-auto border border-white/10">
      <div className="p-8 md:p-12 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-rose-600 text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest">
              {isFood ? t('storeCard.restaurantIdentified') : t('storeCard.businessIdentified')}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
            {displayName}
          </h2>
          <p className="text-rose-400 font-medium text-lg italic uppercase tracking-wider">
            {displayCuisine}
          </p>
        </div>

        <div className="h-px bg-white/10 w-full"></div>

        <div className="space-y-6">
          <section>
            <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-3">
              {t('storeCard.expertInsight')}
            </h4>
            <p className="text-white/90 text-xl font-medium leading-relaxed italic">
              "{store.description || t('storeCard.defaultDescription')}"
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 招牌菜部分：调用外部风险识别 */}
            {isFood && specialtyDishes.length > 0 && (
              <section>
                <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-3">
                  {t('storeCard.houseSpecialties')}
                </h4>
                <ul className="space-y-2.5">
                  {specialtyDishes.map((dish: string, i: number) => {
                    const helperColor = getAllergenSeverityColor(dish);
                    // 适配 StoreCard 的特殊灰色逻辑 (bg-white/20)
                    const dotColor = helperColor === 'bg-slate-300' ? 'bg-white/20' : helperColor;
                    
                    return (
                      <li key={i} className="flex items-center gap-2 text-white/80 font-medium group">
                        <span className={`w-2 h-2 rounded-full shrink-0 transition-all ${dotColor} ${dotColor !== 'bg-white/20' ? 'animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]' : ''}`}></span>
                        <span className="leading-tight">{dish}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
            
            <section>
              <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-3">
                {t('storeCard.serviceContext')}
              </h4>
              <p className="text-3xl font-semibold text-white">
                {priceRange}
              </p>
            </section>
          </div>
        </div>

        {/* 底部预警条 */}
        {isFood && specialtyDishes.some((d: string) => getAllergenSeverityColor(d) !== 'bg-slate-300') && (
          <div className="bg-amber-900/30 border border-amber-500/30 p-3 rounded-2xl flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex flex-col">
              <span className="uppercase font-black text-[9px] text-amber-500 opacity-70 mb-0.5">{t('dishDetail.dietaryFlags')}</span>
              <p className="text-[11px] text-amber-200 font-medium leading-tight">
                House specialties may contain allergens.
              </p>
            </div>
          </div>
        )}

        <div className="pt-6">
          <button 
            onClick={onShowStaff}
            className="w-full bg-white text-slate-900 hover:bg-rose-600 hover:text-white font-bold py-5 rounded-3xl transition-all active:scale-95 shadow-xl text-lg flex items-center justify-center gap-3 group"
          >
            <span>💬 {t('storeCard.showToStaff')}</span>
            <span className="text-sm font-medium opacity-60 group-hover:opacity-100">
              {isFood ? t('storeCard.askForTable') : t('storeCard.askForAssistance')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};