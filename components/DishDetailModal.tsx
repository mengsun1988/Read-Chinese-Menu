import React from 'react';
import { ChiliIcon, AnimalFatIcon, SpeakerIcon } from './Icons';

interface Ingredient {
  name_en: string;
  name_cn: string;
}

interface DishDetailModalProps {
  dish: any;
  onClose: () => void;
  onIngredientClick: (ing: Ingredient) => void;
  onSpicyClick: () => void;
  isLoadingDetail?: boolean;
}

// 辣度判断逻辑
const getSpicyComparison = (level: number) => {
  if (level <= 0) return { label: 'Not Spicy', comparison: 'None', color: 'text-slate-400' };
  if (level <= 1) return { label: 'Mild', comparison: 'Poblano', color: 'text-yellow-400' };
  if (level <= 2) return { label: 'Medium', comparison: 'Jalapeño', color: 'text-orange-400' };
  if (level <= 3) return { label: 'Hot', comparison: 'Cayenne', color: 'text-rose-300' };
  return { label: 'Extra Spicy', comparison: 'Habanero', color: 'text-red-400' };
};

export const DishDetailModal: React.FC<DishDetailModalProps> = ({ 
  dish, 
  onClose, 
  onIngredientClick, 
  onSpicyClick,
  isLoadingDetail = false 
}) => {
  const nameCN = dish.name_cn || dish.dish_name_cn || dish.name || "未知菜品";
  const nameEN = dish.name_en || dish.dish_name_en || dish.english_name || "Unknown Dish";
  
  let displayDescription = dish.description || "";
  const ingredients = Array.isArray(dish.ingredients) ? dish.ingredients : [];
  
  // 语音播放
  const speakDishName = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(nameCN);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8; 
    window.speechSynthesis.speak(utterance);
  };

  const handleImageSearch = () => {
    const query = encodeURIComponent(`${nameEN} ${nameCN} Chinese food`);
    window.open(`https://www.bing.com/images/search?q=${query}`, '_blank');
  };

  const spicyLevel = Number(dish.spiciness_level || dish.spiciness || 0);
  const spicyInfo = getSpicyComparison(spicyLevel);

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-[#fcfbf9] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="relative bg-red-600 pt-10 pb-12 px-8 text-white border-b-4 border-yellow-400 shrink-0">
          <button onClick={onClose} className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center bg-black/10 text-white rounded-full hover:bg-black/20 active:scale-90 transition-all z-10">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <div className="space-y-2 text-left relative z-0">
            <h2 className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Authentic Selection</h2>
            <p className="text-4xl font-black tracking-tighter drop-shadow-sm">{nameEN}</p>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-black tracking-tighter drop-shadow-sm">{nameCN}</p>
              <button 
                onClick={speakDishName} 
                className="bg-white text-red-600 w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-lg"
              >
                <SpeakerIcon className="w-5 h-5" />
              </button>
            </div>
            {dish.pinyin && (
              <p className="text-lg font-bold opacity-70 text-center">{dish.pinyin}</p>
            )}
            {dish.pronunciation && (
              <p className="text-lg font-bold opacity-60 text-center italic">{dish.pronunciation}</p>
            )}
          </div>

          <div className="absolute -bottom-6 left-8 right-8 flex justify-between items-center">
             {dish.price ? (
               <span className="bg-yellow-400 text-red-900 px-5 py-2 rounded-2xl font-black text-xl shadow-xl border-2 border-white">{dish.price}</span>
             ) : <div />}
             <button 
               onClick={handleImageSearch} 
               className="bg-white text-slate-700 px-4 py-2.5 rounded-2xl font-black text-[10px] shadow-xl flex items-center gap-2 active:scale-95 border border-slate-100 transition-all uppercase tracking-widest"
             >
               🔍 Search Photos
             </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 pt-10 overflow-y-auto flex-1 space-y-8 text-slate-900 text-left custom-scrollbar">
          
          {!isLoadingDetail && dish.has_animal_fats && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 animate-in zoom-in duration-300">
              <AnimalFatIcon className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-red-800 text-xs font-bold leading-tight">Contains <span className="underline">Animal Fats / Lard (猪油)</span>.</p>
            </div>
          )}

          {/* Description Section */}
          <section className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm">
            <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3">AI Deep Insight</h4>
            {isLoadingDetail ? (
              <div className="space-y-2 py-1">
                <div className="h-3 bg-slate-100 animate-pulse rounded-full w-full" />
                <div className="h-3 bg-slate-100 animate-pulse rounded-full w-4/5" />
              </div>
            ) : (
              <p className="text-slate-700 leading-relaxed text-base font-bold italic">
                "{displayDescription || "This specialty is known for its authentic flavor and traditional preparation."}"
              </p>
            )}
          </section>

          {/* Ingredients Grid - 核心修改部分 */}
          <section>
            <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
              Core Components
              {isLoadingDetail && <span className="text-rose-500 animate-pulse lowercase font-normal">Analyzing...</span>}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {isLoadingDetail ? (
                [1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />)
              ) : (
                ingredients.map((ing: any, i: number) => {
                  const en = typeof ing === 'string' ? ing : ing.name_en;
                  const cn = typeof ing === 'string' ? '' : ing.name_cn;
                  return (
                    <button 
                      key={i} 
                      onClick={() => onIngredientClick(ing)} 
                      className="group p-4 bg-white hover:bg-slate-50 rounded-2xl text-left border border-slate-100 transition-all active:scale-95 flex flex-col justify-center h-24 shadow-sm"
                    >
                      {/* 英文：大一些，红色 */}
                      <span className="text-sm font-black text-rose-600 leading-tight mb-1 line-clamp-2 uppercase tracking-tight">
                        {en}
                      </span>
                      {/* 中文：小一些，灰色 */}
                      <span className="text-[11px] font-bold text-slate-400 tracking-wide">
                        {cn}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Spice & Dietary Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={onSpicyClick} 
              className={`p-6 rounded-[2rem] border-2 text-left transition-all active:scale-95 ${
                isLoadingDetail 
                  ? 'bg-slate-50 border-slate-100 opacity-60' 
                  : spicyLevel > 0 
                    ? 'bg-red-600 border-red-700 shadow-lg shadow-red-50' 
                    : 'bg-slate-100 border-slate-200 shadow-none'
              }`}
            >
              <h4 className={`text-[8px] font-black uppercase mb-3 tracking-widest ${
                isLoadingDetail ? 'text-slate-400' : spicyLevel > 0 ? 'text-white/70' : 'text-slate-400'
              }`}>Heat Level</h4>
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-lg ${i < spicyLevel ? 'grayscale-0' : 'grayscale opacity-20'}`}>🌶️</span>
                  ))}
                </div>
                {!isLoadingDetail && (
                  <span className={`text-[9px] font-black uppercase ${spicyInfo.color}`}>
                    {spicyInfo.label}
                  </span>
                )}
              </div>
            </button>

            <div className={`p-6 rounded-[2rem] border-2 flex flex-col justify-center transition-all ${isLoadingDetail ? 'bg-slate-50 border-slate-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <h4 className="text-[8px] font-black text-emerald-800/40 uppercase mb-3 tracking-widest">Dietary Flags</h4>
              <div className="flex flex-wrap gap-1.5">
                {isLoadingDetail ? (
                   <div className="h-4 w-24 bg-emerald-100/50 animate-pulse rounded-full" />
                ) : dish.allergens?.length > 0 ? (
                  dish.allergens.map((a: string, i: number) => (
                    <span key={i} className="text-[9px] font-black uppercase bg-emerald-600 px-2.5 py-1 rounded-lg text-white">{a}</span>
                  ))
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 italic">No Common Allergens</span>
                )}
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] shadow-xl uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-all">
            Return to Menu
          </button>
        </div>
      </div>
    </div>
  );
};
