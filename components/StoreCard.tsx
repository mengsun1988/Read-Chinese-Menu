import React from 'react';
import { useTranslation } from 'react-i18next';
import { StoreResult } from '../types';

interface StoreCardProps {
  store: any; // 使用 any 以兼容 AI 可能返回的不同字段名
  onShowStaff: () => void;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store, onShowStaff }) => {
  const { t } = useTranslation();

  if (!store) return null;

  // 字段对齐：优先取 App.tsx 处理过的标准字段，没有则取原始字段
  const displayName = store.name || store.store_name || store.name_cn || t('storeCard.localShop');
  const displayCuisine = store.cuisine || store.cuisine_type || t('storeCard.establishment');
  const specialtyDishes = store.specialty_dishes || store.specialties || [];
  const priceRange = store.average_price_range || store.price || t('storeCard.fairPrice');

  // 判断是否为餐饮类（如果是药店、理发店则隐藏菜品部分）
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
            {/* 只有餐厅才显示招牌菜 */}
            {isFood && specialtyDishes.length > 0 && (
              <section>
                <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-3">
                  {t('storeCard.houseSpecialties')}
                </h4>
                <ul className="space-y-2">
                  {specialtyDishes.map((dish: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-white/80 font-medium">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                      {dish}
                    </li>
                  ))}
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