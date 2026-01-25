import React from 'react';
import { ChiliIcon, AnimalFatIcon, SpeakerIcon } from './Icons';

interface DishDetailModalProps {
  dish: any;
  onClose: () => void;
  onIngredientClick: (ing: any) => void;
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
  // 1. 字段防御性处理（确保即使 AI 返回字段不规范也能显示名称）
  const nameCN = dish.name_cn || dish.dish_name_cn || dish.name || "未知菜品";
  const nameEN = dish.name_en || dish.dish_name_en || dish.english_name || "Unknown Dish";
  const description = dish.description || "Analyzing dish profile...";
  
  // 2. 食材数据格式清洗 (处理后端可能返回的字符串数组或对象数组)
  const ingredients = Array.isArray(dish.ingredients) ? dish.ingredients : [];

  // 3. 语音播放修复：增加 cancel 以确保每次点击都能立即触发
  const speakDishName = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // 关键：清除之前的播放队列
    const utterance = new SpeechSynthesisUtterance(nameCN);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8; 
    window.speechSynthesis.speak(utterance);
  };

  const handleImageSearch = () => {
    const query = encodeURIComponent(`${nameEN} ${nameCN} Chinese food`);
    window.open(`https://www.google.com/search?q=${query}&tbm=isch`, '_blank');
  };

  const spicyLevel = Number(dish.spiciness_level || dish.spiciness || 0);
  const spicyInfo = getSpicyComparison(spicyLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="relative bg-red-600 pt-10 pb-12 px-8 text-white border-b-4 border-yellow-400 shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/40 active:scale-90 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <div className="space-y-1 text-left">
            <h2 className="text-xl font-semibold tracking-tight opacity-90 line-clamp-1">{nameEN}</h2>
            <div className="flex items-center gap-4">
              <p className="text-4xl sm:text-5xl font-bold tracking-tighter">{nameCN}</p>
              <button 
                onClick={speakDishName} 
                className="bg-white/20 hover:bg-white/30 p-2 rounded-xl active:scale-90 transition-all shadow-inner"
                title="Listen to pronunciation"
              >
                <SpeakerIcon className="w-6 h-6" />
              </button>
            </div>
            {dish.pinyin && (
              <p className="mt-2 text-sm font-medium tracking-wide text-white/90 italic bg-white/10 px-3 py-1 rounded-lg inline-block">
                {dish.pinyin}
              </p>
            )}
          </div>

          <div className="absolute -bottom-6 left-8 right-8 flex justify-between items-center">
             {dish.price && <span className="bg-yellow-400 text-red-900 px-5 py-2 rounded-2xl font-bold text-xl shadow-xl border-2 border-white">{dish.price}</span>}
             <button onClick={handleImageSearch} className="bg-white text-slate-900 px-4 py-2 rounded-2xl font-bold text-xs shadow-xl flex items-center gap-2 active:scale-95 border-2 border-slate-50 transition-all uppercase tracking-wider">🔍 Photos</button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 pt-12 overflow-y-auto flex-1 space-y-8 text-slate-900 text-left custom-scrollbar">
          
          {/* Hidden Animal Fat Alert */}
          {!isLoadingDetail && dish.has_animal_fats && (
            <div className="p-5 bg-amber-50 border-2 border-amber-100 rounded-[1.5rem] flex gap-4 animate-in zoom-in duration-500">
              <div className="bg-amber-100 p-2 rounded-xl shrink-0 h-fit">
                <AnimalFatIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h5 className="text-amber-900 font-bold text-xs uppercase tracking-[0.1em]">Fat Content Warning</h5>
                <p className="text-amber-800 text-sm font-medium leading-relaxed mt-1">This dish may use <strong>Lard (猪油)</strong> or animal fats for seasoning.</p>
              </div>
            </div>
          )}

          {/* Description */}
          <section>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Chef's Note</h4>
            <p className="text-slate-700 leading-relaxed text-lg font-semibold">{description}</p>
          </section>

          {/* Ingredients Grid */}
          <section>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
              Main Ingredients {isLoadingDetail && " (Analyzing...)"}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {isLoadingDetail ? (
                [1, 2, 4].map(i => <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />)
              ) : (
                ingredients.map((ing: any, i: number) => {
                  const en = typeof ing === 'string' ? ing : ing.name_en;
                  const cn = typeof ing === 'string' ? '' : ing.name_cn;
                  return (
                    <button 
                      key={i} 
                      onClick={() => onIngredientClick(ing)} 
                      className="group p-4 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl text-left border-2 border-slate-100 transition-all active:scale-95 flex flex-col justify-between h-20 shadow-sm"
                    >
                      <span className="text-xs font-bold text-slate-400 group-hover:text-slate-500 line-clamp-1 uppercase tracking-tighter">{en}</span>
                      <span className="text-xl font-black group-hover:text-yellow-400">{cn || en}</span>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Interaction Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
            {/* Spice Meter - 始终可点击 */}
            <button 
              onClick={onSpicyClick} 
              className={`p-5 rounded-[2rem] border-2 text-left transition-all active:scale-95 ${isLoadingDetail ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-red-50/50 border-red-100'}`}
            >
              <h4 className="text-[10px] font-bold text-red-800/60 uppercase mb-3 tracking-widest">Spice Meter</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-xl ${i < spicyLevel ? 'grayscale-0' : 'grayscale opacity-20'}`}>🌶️</span>
                    ))}
                  </div>
                  <span className="text-[10px] font-black text-red-600 uppercase italic">{spicyInfo.label}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Ask Waiter About Heat →</p>
              </div>
            </button>

            {/* Allergens Card */}
            <div className={`p-5 rounded-[2rem] border-2 flex flex-col justify-center transition-all ${isLoadingDetail ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-emerald-50/50 border-emerald-100'}`}>
              <h4 className="text-[10px] font-bold text-emerald-800/60 uppercase mb-3 tracking-widest">Dietary Flags</h4>
              <div className="flex flex-wrap gap-2">
                {dish.allergens?.length > 0 ? (
                  dish.allergens.map((a: string, i: number) => (
                    <span key={i} className="text-[10px] font-black uppercase bg-white px-2 py-1 rounded-lg border border-emerald-100 text-emerald-700 shadow-sm">{a}</span>
                  ))
                ) : (
                  <span className="text-xs font-bold text-emerald-700 italic">{isLoadingDetail ? 'Scanning...' : 'No Common Allergens'}</span>
                )}
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] shadow-xl uppercase tracking-[0.2em] text-sm active:scale-[0.98] transition-all">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};