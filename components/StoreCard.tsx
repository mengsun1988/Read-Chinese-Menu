import React from 'react';
import { StoreResult } from '../types';

interface StoreCardProps {
  store: any; // 使用 any 以兼容 AI 可能返回的不同字段名
  onShowStaff: () => void;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store, onShowStaff }) => {
  if (!store) return null;

  // 字段对齐：优先取 App.tsx 处理过的标准字段，没有则取原始字段
  const displayName = store.name || store.store_name || store.name_cn || "Local Shop";
  const displayCuisine = store.cuisine || store.cuisine_type || "Establishment";
  const specialtyDishes = store.specialty_dishes || store.specialties || [];
  const priceRange = store.average_price_range || store.price || "Fair Price";

  // 判断是否为餐饮类（如果是药店、理发店则隐藏菜品部分）
  const isFood = !displayCuisine.toLowerCase().includes('pharmacy') && 
                 !displayCuisine.toLowerCase().includes('hair') &&
                 !displayCuisine.toLowerCase().includes('salon');

  return (
    <div className="bg-slate-900 text-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-700 max-w-2xl mx-auto border border-white/10">
      <div className="p-8 md:p-12 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-rose-600 text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest">
              {isFood ? "Restaurant Identified" : "Business Identified"}
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
            <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-3">Expert Insight</h4>
            <p className="text-white/90 text-xl font-medium leading-relaxed italic">
              "{store.description || "A notable local establishment offering authentic services and experiences."}"
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 只有餐厅才显示招牌菜，且增加防崩溃保护 */}
            {isFood && specialtyDishes.length > 0 && (
              <section>
                <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-3">House Specialties</h4>
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
              <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-3">Service Context</h4>
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
            <span>💬 Show to Staff</span>
            <span className="text-sm font-medium opacity-60 group-hover:opacity-100">
              {isFood ? "(Ask for Table)" : "(Ask for Assistance)"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};