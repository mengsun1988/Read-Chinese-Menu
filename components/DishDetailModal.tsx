import React from 'react';
import { ChiliIcon, LeafIcon, WarningIcon } from './Icons';

interface DishDetailModalProps {
  dish: any;
  onClose: () => void;
  onIngredientClick: (ing: any) => void;
  onSpicyClick: () => void;
}

export const DishDetailModal: React.FC<DishDetailModalProps> = ({ dish, onClose, onIngredientClick, onSpicyClick }) => {
  if (!dish) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#fcfbf9] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl relative animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-lg text-slate-400 z-10">✕</button>
        
        <div className="p-8 md:p-12 space-y-10">
          <header className="space-y-4">
            <h2 className="chinese-font text-6xl md:text-7xl font-bold text-slate-900">{dish.name_cn || dish.dish_name_cn}</h2>
            <h3 className="text-2xl font-semibold text-rose-600">{dish.name_en || dish.dish_name_en}</h3>
          </header>

          <section className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Ingredients</h4>
            <div className="flex flex-wrap gap-3">
              {/* 这里必须加 ? 和保底，防止崩溃 */}
              {(dish.ingredients || []).map((ing: any, i: number) => (
                <button 
                  key={i}
                  onClick={() => onIngredientClick(ing)}
                  className="bg-white border border-slate-100 px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:border-rose-200 transition-colors"
                >
                  {ing.name_en} {ing.name_cn}
                </button>
              ))}
            </div>
          </section>

          {/* ... 其他内容保持防护 ... */}
          <button onClick={onClose} className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl shadow-xl">Close Details</button>
        </div>
      </div>
    </div>
  );
};