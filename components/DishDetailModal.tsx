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

const getSpicyComparison = (level: number) => {
  if (level <= 1) return { label: 'Mild', comparison: 'Jalapeño' };
  if (level <= 3) return { label: 'Medium', comparison: 'Cayenne' };
  return { label: 'Extra Spicy', comparison: 'Habanero' };
};

export const DishDetailModal: React.FC<DishDetailModalProps> = ({ 
  dish, 
  onClose, 
  onIngredientClick, 
  onSpicyClick,
  isLoadingDetail = false 
}) => {
  // 1. 字段防御与名称解析
  const nameCN = dish.name_cn || dish.dish_name_cn || dish.name || "未知菜品";
  const nameEN = dish.name_en || dish.dish_name_en || dish.english_name || "Unknown Dish";
  
  // 2. 简介增强逻辑：如果原始描述太短，尝试用 [做法] + [主要食材] 合成
  let displayDescription = dish.description || "";
  const ingredients = Array.isArray(dish.ingredients) ? dish.ingredients : [];
  
  if (displayDescription.length < 15 && !isLoadingDetail) {
    const method = dish.cooking_method || "";
    const mainIngs = ingredients
      .slice(0, 3)
      .map((i: any) => typeof i === 'string' ? i : i.name_en)
      .join(', ');
    
    if (mainIngs) {
      displayDescription = method 
        ? `A savory ${method.toLowerCase()} specialty featuring ${mainIngs}.` 
        : `Traditional preparation highlighting ${mainIngs}.`;
    }
  }

  // 3. 语音播放逻辑
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
  // 合并中英文搜索词，确保 Bing 搜索结果精准
  const query = encodeURIComponent(`${nameEN} ${nameCN} Chinese food`);
  // 替换为 Bing 国际版图片搜索链接
  window.open(`https://www.bing.com/images/search?q=${query}`, '_blank');
};

  const spicyLevel = Number(dish.spiciness_level || dish.spiciness || 0);
  const spicyInfo = getSpicyComparison(spicyLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[96vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section: 采用醒目的红色 */}
        <div className="relative bg-red-600 pt-12 pb-14 px-8 text-white border-b-4 border-yellow-400 shrink-0">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full hover:bg-white/40 active:scale-90 transition-transform z-10">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <div className="space-y-1 text-left relative z-0">
            <h2 className="text-xl font-bold tracking-tight opacity-80 line-clamp-1 uppercase text-[10px] tracking-[0.2em] mb-1">Authentic Selection</h2>
            <div className="flex items-center gap-4">
              <p className="text-4xl sm:text-5xl font-black tracking-tighter drop-shadow-md">{nameCN}</p>
              <button 
                onClick={speakDishName} 
                className="bg-white text-red-600 p-3 rounded-2xl active:scale-90 transition-all shadow-xl hover:bg-yellow-400"
              >
                <SpeakerIcon className="w-6 h-6" />
              </button>
            </div>
            <p className="text-xl font-semibold opacity-90 mt-1 line-clamp-1">{nameEN}</p>
          </div>

          <div className="absolute -bottom-6 left-8 right-8 flex justify-between items-center">
             {dish.price && <span className="bg-yellow-400 text-red-900 px-6 py-2.5 rounded-2xl font-black text-2xl shadow-2xl border-2 border-white">{dish.price}</span>}
             <button onClick={handleImageSearch} className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-xl flex items-center gap-2 active:scale-95 border border-white/20 transition-all uppercase tracking-widest">🔍 Search Photos</button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 pt-12 overflow-y-auto flex-1 space-y-8 text-slate-900 text-left custom-scrollbar">
          
          {/* Animal Fat Alert */}
          {!isLoadingDetail && dish.has_animal_fats && (
            <div className="p-5 bg-red-50 border-2 border-red-100 rounded-[2rem] flex gap-4 animate-in zoom-in duration-500">
              <div className="bg-red-100 p-3 rounded-2xl shrink-0 h-fit">
                <AnimalFatIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h5 className="text-red-900 font-black text-[10px] uppercase tracking-widest">Ingredients Notice</h5>
                <p className="text-red-800 text-sm font-bold leading-snug mt-1">Contains <span className="underline decoration-red-300">Animal Fats / Lard (猪油)</span>. Not suitable for vegetarians.</p>
              </div>
            </div>
          )}

          {/* Description Section */}
          <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Dish Profile</h4>
            {isLoadingDetail ? (
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 animate-pulse rounded w-full" />
                <div className="h-4 bg-slate-200 animate-pulse rounded w-2/3" />
              </div>
            ) : (
              <p className="text-slate-800 leading-relaxed text-lg font-bold">
                {displayDescription || "Identifying unique preparation methods and flavor profiles..."}
              </p>
            )}
          </section>

          {/* Ingredients Grid */}
          <section>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">
              Core Components {isLoadingDetail && " (Scanning...)"}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {isLoadingDetail ? (
                [1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-3xl border border-slate-100" />)
              ) : (
                ingredients.map((ing: any, i: number) => {
                  const en = typeof ing === 'string' ? ing : ing.name_en;
                  const cn = typeof ing === 'string' ? '' : ing.name_cn;
                  return (
                    <button 
                      key={i} 
                      onClick={() => onIngredientClick(ing)} 
                      className="group p-4 bg-white hover:bg-red-600 rounded-3xl text-left border-2 border-slate-100 hover:border-red-600 transition-all active:scale-95 flex flex-col justify-center h-24 shadow-sm"
                    >
                      <span className="text-[9px] font-black text-slate-400 group-hover:text-white/70 uppercase tracking-tighter mb-1 line-clamp-1">{en}</span>
                      <span className="text-xl font-black group-hover:text-white transition-colors">{cn || en}</span>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Communication Interaction Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
            {/* Spice Meter */}
            <button 
              onClick={onSpicyClick} 
              className={`p-6 rounded-[2.5rem] border-2 text-left transition-all active:scale-95 ${isLoadingDetail ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-red-600 border-red-700 shadow-lg shadow-red-100'}`}
            >
              <h4 className={`text-[9px] font-black uppercase mb-3 tracking-widest ${isLoadingDetail ? 'text-slate-400' : 'text-white/70'}`}>Heat Level</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-xl ${i < spicyLevel ? 'grayscale-0' : 'grayscale opacity-30'}`}>🌶️</span>
                    ))}
                  </div>
                  <span className={`text-[10px] font-black uppercase italic ${isLoadingDetail ? 'text-slate-400' : 'text-yellow-400'}`}>{spicyInfo.label}</span>
                </div>
                <p className={`text-[10px] font-bold uppercase ${isLoadingDetail ? 'text-slate-400' : 'text-white'}`}>Ask Staff About Spiciness →</p>
              </div>
            </button>

            {/* Dietary Flags */}
            <div className={`p-6 rounded-[2.5rem] border-2 flex flex-col justify-center transition-all ${isLoadingDetail ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-emerald-50 border-emerald-100'}`}>
              <h4 className="text-[9px] font-black text-emerald-800/60 uppercase mb-3 tracking-widest">Dietary Flags</h4>
              <div className="flex flex-wrap gap-2">
                {dish.allergens?.length > 0 ? (
                  dish.allergens.map((a: string, i: number) => (
                    <span key={i} className="text-[10px] font-black uppercase bg-emerald-600 px-3 py-1.5 rounded-xl text-white shadow-sm">{a}</span>
                  ))
                ) : (
                  <span className="text-xs font-bold text-emerald-700 italic">{isLoadingDetail ? 'Analyzing allergens...' : 'No Common Allergens Identified'}</span>
                )}
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="w-full bg-slate-900 text-white font-black py-7 rounded-[2.5rem] shadow-2xl uppercase tracking-[0.3em] text-sm active:scale-[0.98] transition-all">
            Return to Menu
          </button>
        </div>
      </div>
    </div>
  );
};