import React from 'react';
import { ChiliIcon, LeafIcon, WarningIcon } from './Icons';

interface DishCardProps {
  dish: any;
  onClick: () => void;
}

export const DishCard: React.FC<DishCardProps> = ({ dish, onClick }) => {
  const spiceLevel = Number(dish.spiciness) || 0;

  return (
    <button 
      onClick={onClick}
      className="modern-card group text-left overflow-hidden hover:border-rose-600 transition-all duration-300 w-full"
    >
      <div className="p-6 md:p-8 flex flex-col justify-between h-full">
        <div>
          <div className="flex justify-between items-start gap-4 mb-4">
            <h3 className="chinese-font text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              {dish.dish_name_cn}
            </h3>
            {dish.price && (
              <span className="bg-slate-900 text-white font-medium px-3 py-1 rounded-xl text-xs whitespace-nowrap">
                {dish.price}
              </span>
            )}
          </div>
          
          <h4 className="text-xl font-semibold text-rose-600 leading-tight mb-4 group-hover:text-rose-700">
            {dish.dish_name_en}
          </h4>

          <p className="text-slate-500 text-sm font-medium line-clamp-2 leading-relaxed">
            {dish.description}
          </p>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {dish.is_vegetarian && (
              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <LeafIcon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium uppercase tracking-wide">Vegetarian</span>
              </div>
            )}
            {dish.has_animal_fats && (
              <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                <WarningIcon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium uppercase tracking-wide">Hidden Fats</span>
              </div>
            )}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                 <ChiliIcon 
                   key={i} 
                   className={`w-4 h-4 ${i < spiceLevel ? 'text-rose-600' : 'text-slate-100'}`} 
                   filled={i < spiceLevel} 
                 />
              ))}
            </div>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest group-hover:text-rose-600 transition-colors">
            Tap for Details →
          </span>
        </div>
      </div>
    </button>
  );
};