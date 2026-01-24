import React from 'react';
import { ChiliIcon, LeafIcon, WarningIcon } from './Icons';

export const DishCard: React.FC<{ dish: any; onClick: () => void }> = ({ dish, onClick }) => {
  return (
    <button onClick={onClick} className="modern-card group text-left overflow-hidden hover:border-rose-600 transition-all duration-300 w-full bg-white rounded-[2rem] border border-slate-100 shadow-sm">
      <div className="p-6 md:p-8 flex flex-col justify-between h-full">
        <div>
          <div className="flex justify-between items-start gap-4 mb-4">
            <h3 className="chinese-font text-4xl font-bold text-slate-900 leading-tight">{dish.dish_name_cn}</h3>
            {dish.price && <span className="bg-slate-900 text-white font-medium px-3 py-1 rounded-xl text-xs">{dish.price}</span>}
          </div>
          <h4 className="text-xl font-semibold text-rose-600 mb-4">{dish.dish_name_en}</h4>
          <p className="text-slate-500 text-sm line-clamp-2">{dish.description}</p>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {dish.is_vegetarian && <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase"><LeafIcon className="w-3.5 h-3.5" />Vegetarian</div>}
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <ChiliIcon key={i} className={`w-4 h-4 ${i < dish.spiciness ? 'text-rose-600' : 'text-slate-100'}`} filled={i < dish.spiciness} />
              ))}
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-rose-600 transition-colors">Details →</span>
        </div>
      </div>
    </button>
  );
};