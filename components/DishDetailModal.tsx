import React from 'react';
import { Dish, Ingredient } from '../types';
import { ChiliIcon, AnimalFatIcon, SpeakerIcon, WarningIcon } from './Icons';

interface DishDetailModalProps {
  dish: Dish;
  onClose: () => void;
  onIngredientClick: (ing: Ingredient) => void;
  onSpicyClick: () => void;
}

const getSpicyComparison = (level: number) => {
  if (level <= 1) return { label: 'Mild', comparison: 'Jalapeño level' };
  if (level <= 3) return { label: 'Medium', comparison: 'Cayenne level' };
  return { label: 'Extra Spicy', comparison: 'Habanero / Reaper level' };
};

export const DishDetailModal: React.FC<DishDetailModalProps> = ({ dish, onClose, onIngredientClick, onSpicyClick }) => {
  const handleImageSearch = () => {
    const query = encodeURIComponent(`${dish.dish_name_en} ${dish.dish_name_cn} Chinese food`);
    window.open(`https://www.google.com/search?q=${query}&tbm=isch`, '_blank');
  };

  const speakDishName = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(dish.dish_name_cn);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const spicyInfo = getSpicyComparison(dish.spiciness);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-red-600 pt-10 pb-12 px-8 text-white border-b-4 border-yellow-400">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/40 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="space-y-1">
            <h2 className="text-3xl font-semibold tracking-tight">{dish.dish_name_en}</h2>
            <div className="flex items-center gap-4">
              <p className="chinese-font text-5xl font-bold">{dish.dish_name_cn}</p>
              <button 
                onClick={speakDishName}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors active:scale-90"
                title="Hear Pronunciation"
              >
                <SpeakerIcon className="w-6 h-6" />
              </button>
            </div>
            {(dish.pinyin || dish.pronunciation_guide) && (
              <div className="mt-3 bg-white/10 rounded-xl p-3 inline-block">
                {dish.pinyin && (
                  <p className="text-sm font-medium tracking-wide text-white/90 italic">{dish.pinyin}</p>
                )}
                {dish.pronunciation_guide && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-yellow-300 mt-0.5">
                    Sounds like: {dish.pronunciation_guide}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="absolute -bottom-6 left-8 right-8 flex justify-between items-center">
             {dish.price && (
               <span className="bg-yellow-400 text-red-900 px-5 py-2 rounded-2xl font-semibold text-xl shadow-xl">
                 {dish.price}
               </span>
             )}
             <button 
               onClick={handleImageSearch}
               className="bg-white text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-2xl font-medium text-sm shadow-xl flex items-center gap-2 transition-all active:scale-95"
             >
               🔍 Search Photos
             </button>
          </div>
        </div>

        <div className="p-8 pt-10 overflow-y-auto flex-1 space-y-8 text-slate-900">
          {dish.has_animal_fats && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 animate-pulse">
              <AnimalFatIcon className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h5 className="text-amber-900 font-semibold text-xs uppercase tracking-wider">Hidden Animal Fat Warning</h5>
                <p className="text-amber-800 text-xs font-medium leading-normal mt-1">
                  This dish is often cooked with <strong>Lard (猪油)</strong> or <strong>Tallow (牛油)</strong>. It may not be strictly vegetarian or vegan even without meat chunks.
                </p>
              </div>
            </div>
          )}

          <section>
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3">Chef's Description</h4>
            <p className="text-slate-700 leading-relaxed text-lg font-medium">
              {dish.description}
            </p>
          </section>

          <section>
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">Ingredients (Tap to show Waiter)</h4>
            <div className="flex flex-wrap gap-3">
              {dish.classic_ingredients.map((ing, i) => (
                <button 
                  key={i} 
                  onClick={() => onIngredientClick(ing)}
                  className="group px-4 py-3 bg-slate-50 hover:bg-red-600 hover:text-white text-slate-800 rounded-2xl text-base font-medium border-2 border-slate-100 transition-all active:scale-95 flex flex-col items-start gap-0.5"
                >
                  <span className="text-sm">{ing.name_en}</span>
                  <span className="chinese-font text-xl group-hover:text-yellow-300">{ing.name_cn}</span>
                </button>
              ))}
              {dish.potential_ingredients.map((ing, i) => (
                <button 
                  key={`pot-${i}`} 
                  onClick={() => onIngredientClick(ing)}
                  className="group px-4 py-3 bg-amber-50/50 hover:bg-red-600 hover:text-white text-amber-900 rounded-2xl text-base font-medium border-2 border-amber-100 transition-all active:scale-95 flex flex-col items-start gap-0.5 italic"
                >
                  <span className="text-sm">{ing.name_en}?</span>
                  <span className="chinese-font text-xl group-hover:text-yellow-300">{ing.name_cn}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Spice Meter Component */}
            <button 
              onClick={onSpicyClick}
              className="bg-slate-50 p-5 rounded-[2rem] border-2 border-slate-100 text-left hover:bg-red-50 hover:border-red-200 transition-all group overflow-hidden relative"
            >
              <h4 className="text-[10px] font-semibold text-slate-400 uppercase mb-3 group-hover:text-red-500">Spice Meter (Click to ask)</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <ChiliIcon 
                        key={i} 
                        className={`w-5 h-5 transition-transform duration-300 ${i < dish.spiciness ? 'text-red-600 scale-110' : 'text-slate-200'}`} 
                        filled={i < dish.spiciness} 
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-tighter">{spicyInfo.label}</span>
                </div>

                {/* Progress Bar Visualization */}
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 transition-all duration-1000"
                    style={{ width: `${(dish.spiciness / 5) * 100}%` }}
                  ></div>
                </div>

                <p className="text-[9px] font-medium text-slate-400 group-hover:text-red-800 leading-tight">
                  Compared to: <span className="font-bold">{spicyInfo.comparison}</span>
                </p>
              </div>
            </button>

            <div className="bg-slate-50 p-5 rounded-[2rem] border-2 border-slate-100 flex flex-col justify-center">
              <h4 className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Allergens Detected</h4>
              <div className="flex flex-wrap gap-1.5">
                {dish.allergens.length > 0 ? (
                  dish.allergens.map((a, i) => (
                    <span key={i} className="text-red-700 font-medium text-xs bg-red-100 px-2 py-1 rounded-lg border border-red-200">{a}</span>
                  ))
                ) : (
                  <span className="text-green-700 font-medium text-xs flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                    </svg>
                    None Detected
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-900 text-slate-300 rounded-[2rem] flex gap-4">
            <WarningIcon className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-normal uppercase tracking-wider italic">
              AI analysis is for reference only. Ingredients vary by establishment. Always confirm with your waiter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};