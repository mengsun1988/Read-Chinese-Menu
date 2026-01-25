import React from 'react';
import { ChiliIcon, AnimalFatIcon, SpeakerIcon, WarningIcon } from './Icons';

interface DishDetailModalProps {
  dish: any;
  onClose: () => void;
  onIngredientClick: (ing: any) => void;
  onSpicyClick: () => void;
  isLoadingDetail?: boolean; // 🆕 新增：标记是否正在进行深度解析
}

const getSpicyComparison = (level: number) => {
  if (level <= 1) return { label: 'Mild', comparison: 'Jalapeño level' };
  if (level <= 3) return { label: 'Medium', comparison: 'Cayenne level' };
  return { label: 'Extra Spicy', comparison: 'Habanero / Reaper level' };
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
  const description = dish.description || "No description available.";
  const pinyin = dish.pinyin || "";
  const pronunciation = dish.pronunciation_guide || "";
  
  const ingredients = Array.isArray(dish.ingredients) 
    ? dish.ingredients 
    : (Array.isArray(dish.classic_ingredients) ? dish.classic_ingredients : []);

  const handleImageSearch = () => {
    const query = encodeURIComponent(`${nameEN} ${nameCN} Chinese food`);
    window.open(`https://www.google.com/search?q=${query}&tbm=isch`, '_blank');
  };

  const speakDishName = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(nameCN);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const spicyLevel = typeof dish.spiciness === 'number' ? dish.spiciness : (Number(dish.spiciness_level) || 0);
  const spicyInfo = getSpicyComparison(spicyLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section - 始终显示，因为这是第一步拿到的数据 */}
        <div className="relative bg-red-600 pt-10 pb-12 px-8 text-white border-b-4 border-yellow-400">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/40">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <div className="space-y-1 text-left">
            <h2 className="text-2xl font-semibold tracking-tight opacity-90">{nameEN}</h2>
            <div className="flex items-center gap-4">
              <p className="text-5xl font-bold tracking-tighter">{nameCN}</p>
              <button onClick={speakDishName} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl active:scale-90">
                <SpeakerIcon className="w-6 h-6" />
              </button>
            </div>
            {(pinyin || pronunciation) && (
              <div className="mt-3 bg-white/10 rounded-xl p-3 inline-block">
                {pinyin && <p className="text-sm font-medium tracking-wide text-white/90 italic">{pinyin}</p>}
                {pronunciation && <p className="text-[10px] font-semibold uppercase tracking-widest text-yellow-300 mt-0.5">Sounds like: {pronunciation}</p>}
              </div>
            )}
          </div>

          <div className="absolute -bottom-6 left-8 right-8 flex justify-between items-center">
             {dish.price && <span className="bg-yellow-400 text-red-900 px-5 py-2 rounded-2xl font-semibold text-xl shadow-xl">{dish.price}</span>}
             <button onClick={handleImageSearch} className="bg-white text-slate-900 px-4 py-2 rounded-2xl font-medium text-sm shadow-xl flex items-center gap-2 active:scale-95">🔍 Search Photos</button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 pt-10 overflow-y-auto flex-1 space-y-8 text-slate-900 text-left">
          
          {/* 深度解析警告：仅在加载完成后根据数据展示 */}
          {!isLoadingDetail && dish.has_animal_fats && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 animate-in zoom-in duration-300">
              <AnimalFatIcon className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h5 className="text-amber-900 font-semibold text-xs uppercase tracking-wider">Hidden Animal Fat Warning</h5>
                <p className="text-amber-800 text-xs font-medium leading-normal mt-1">Contains <strong>Lard (猪油)</strong> or <strong>Tallow (牛油)</strong>.</p>
              </div>
            </div>
          )}

          <section>
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3">Chef's Description</h4>
            <p className="text-slate-700 leading-relaxed text-lg font-medium">{description}</p>
          </section>

          {/* 食材部分：如果正在加载，显示骨架屏 */}
          <section>
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">Ingredients {isLoadingDetail && "(Analyzing...)"}</h4>
            <div className="flex flex-wrap gap-3">
              {isLoadingDetail ? (
                [1, 2, 3].map(i => <div key={i} className="w-24 h-14 bg-slate-100 animate-pulse rounded-2xl" />)
              ) : (
                ingredients.map((ing: any, i: number) => (
                  <button key={i} onClick={() => onIngredientClick(ing)} className="group px-4 py-3 bg-slate-50 hover:bg-red-600 hover:text-white text-slate-800 rounded-2xl text-base font-medium border-2 border-slate-100 transition-all active:scale-95 flex flex-col items-start gap-0.5">
                    <span className="text-sm">{typeof ing === 'string' ? ing : ing.name_en}</span>
                    {typeof ing !== 'string' && <span className="text-xl font-bold group-hover:text-yellow-300">{ing.name_cn}</span>}
                  </button>
                ))
              )}
            </div>
          </section>

          {/* 辣度与过敏原：如果正在加载，显示模糊或分析中状态 */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-500 ${isLoadingDetail ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
            <button onClick={onSpicyClick} className="bg-slate-50 p-5 rounded-[2rem] border-2 border-slate-100 text-left relative">
              <h4 className="text-[10px] font-semibold text-slate-400 uppercase mb-3">Spice Meter</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <ChiliIcon key={i} className={`w-5 h-5 ${i < spicyLevel ? 'text-red-600' : 'text-slate-200'}`} filled={i < spicyLevel} />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-tighter">{spicyInfo.label}</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-400 to-red-600" style={{ width: `${(Math.min(spicyLevel, 5) / 5) * 100}%` }}></div>
                </div>
              </div>
            </button>

            <div className="bg-slate-50 p-5 rounded-[2rem] border-2 border-slate-100 flex flex-col justify-center">
              <h4 className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Allergens</h4>
              <div className="flex flex-wrap gap-1.5">
                {dish.allergens?.length > 0 ? (
                  dish.allergens.map((a: string, i: number) => (
                    <span key={i} className="text-red-700 font-medium text-xs bg-red-100 px-2 py-1 rounded-lg border border-red-200">{a}</span>
                  ))
                ) : (
                  <span className="text-green-700 font-medium text-xs flex items-center gap-1">{isLoadingDetail ? 'Analyzing...' : 'None Detected'}</span>
                )}
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="w-full bg-slate-900 text-white font-bold py-5 rounded-[2rem] shadow-xl uppercase tracking-widest text-xs">Close Details</button>
        </div>
      </div>
    </div>
  );
};