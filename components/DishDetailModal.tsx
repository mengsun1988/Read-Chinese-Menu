import React from 'react';
import { ChiliIcon, LeafIcon, WarningIcon } from './Icons';

export const DishDetailModal: React.FC<{ dish: any; onClose: () => void; onIngredientClick: (ing: any) => void; onSpicyClick: () => void; }> = ({ dish, onClose, onIngredientClick, onSpicyClick }) => {
  if (!dish) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#fcfbf9] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl relative p-8 md:p-12 animate-in zoom-in-95 duration-300 text-left">
        <button onClick={onClose} className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-lg text-slate-400">✕</button>
        
        <header className="mb-10">
          <h2 className="chinese-font text-6xl md:text-7xl font-bold text-slate-900 mb-4">{dish.name_cn}</h2>
          <h3 className="text-2xl font-semibold text-rose-600">{dish.name_en}</h3>
        </header>

        <section className="mb-10">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Ingredients (Tap to show Waiter)</h4>
          <div className="flex flex-wrap gap-3">
            {/* 关键防御：使用可选链或保底数组 */}
            {(dish.ingredients || []).map((ing: any, i: number) => (
              <button key={i} onClick={() => onIngredientClick(ing)} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium hover:border-rose-600 transition-colors">
                {ing.name_en} {ing.name_cn}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-10 p-6 bg-slate-50 rounded-2xl">
          <p className="text-slate-600 leading-relaxed font-medium">{dish.description}</p>
        </section>

        <div className="flex gap-4">
          <button onClick={onSpicyClick} className="flex-1 bg-rose-50 text-rose-600 font-bold py-4 rounded-2xl border border-rose-100">Adjust Spiciness</button>
          <button onClick={onClose} className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl">Close</button>
        </div>
      </div>
    </div>
  );
};