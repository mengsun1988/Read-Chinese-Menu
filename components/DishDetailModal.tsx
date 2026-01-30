import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { ChiliIcon, AnimalFatIcon, SpeakerIcon } from './Icons';
import { useDishTranslator } from '../src/hooks/useDishTranslator';

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

export const DishDetailModal: React.FC<DishDetailModalProps> = ({ 
  dish: rawDish, 
  onClose, 
  onIngredientClick, 
  onSpicyClick,
  isLoadingDetail = false 
}) => {
  const { t, i18n } = useTranslation();
  const { translateDish } = useDishTranslator();

  // 使用 Hook 处理后的 dish 数据
  const dish = translateDish(rawDish);

  if (!dish) return null;

  const getSpicyComparison = (level: number) => {
    if (level <= 0) return { label: t('dishDetail.spicyLabels.notSpicy'), color: 'text-slate-400' };
    if (level <= 1) return { label: t('dishDetail.spicyLabels.mild'), color: 'text-yellow-400' };
    if (level <= 2) return { label: t('dishDetail.spicyLabels.medium'), color: 'text-orange-400' };
    if (level <= 3) return { label: t('dishDetail.spicyLabels.hot'), color: 'text-rose-300' };
    return { label: t('dishDetail.spicyLabels.extraSpicy'), color: 'text-red-400' };
  };

  const formatChinesePhonetic = (text: string) => {
    if (!text) return "";
    const numMap: Record<string, string> = {
      '0': 'líng', '1': 'yī', '2': 'èr', '3': 'sān', '4': 'sì',
      '5': 'wǔ', '6': 'liù', '7': 'qī', '8': 'bā', '9': 'jiǔ'
    };
    return text.toLowerCase().replace(/[0-9]/g, (m) => numMap[m] + " ");
  };

  // 统一变量命名，确保清晰
  const nameCN = dish.name_cn || "未知菜品";
  const nameDisplay = dish.displayName; // 已经由 Hook 根据语言处理好了
  const pinyin = formatChinesePhonetic(dish.pinyin || dish.pinyin_name || "");
  const pronunciation = formatChinesePhonetic(dish.pronunciation || dish.sounds_like || "");

  const speakDishName = (e: React.MouseEvent) => {
    e.stopPropagation();
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel(); 
    const utterance = new SpeechSynthesisUtterance(nameCN);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85; 
    synth.speak(utterance);
  };

  const handleImageSearch = () => {
    const query = encodeURIComponent(`${dish.name_en} ${nameCN} Chinese food`);
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
        <div className="relative bg-red-600 pt-10 pb-14 px-8 text-white border-b-4 border-yellow-400 shrink-0">
          <button onClick={onClose} className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center bg-black/10 text-white rounded-full hover:bg-black/20 active:scale-90 transition-all z-10">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <div className="space-y-3 text-left relative z-0">
            <h2 className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">{t('dishDetail.authenticSelection')}</h2>
            <div className="space-y-1">
                {/* 菜品主标题：跟随语言环境的外文或中文 */}
                <p className="text-4xl font-black tracking-tighter drop-shadow-sm leading-tight">{nameDisplay}</p>
                <div className="flex items-center gap-3 py-1">
                  {/* 副标题：始终显示原始中文名，用于对照 */}
                  <p className="text-3xl font-black tracking-tighter drop-shadow-sm">{nameCN}</p>
                  <button onClick={speakDishName} className="bg-white text-red-600 w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-lg shrink-0 border-2 border-red-50">
                    <SpeakerIcon className="w-5 h-5" />
                  </button>
                </div>
            </div>

            {(pinyin || pronunciation) && (
              <div className="flex flex-col gap-1.5 pt-2 mt-1 border-t border-white/10 w-fit">
                {pinyin && <p className="text-sm font-medium text-yellow-300 lowercase italic leading-none">{pinyin}</p>}
                {pronunciation && (
                  <p className="text-[11px] font-medium text-white/80 italic flex items-center gap-2">
                    <span className="opacity-50 not-italic font-normal">{t('dishDetail.approx')}:</span> "{pronunciation}"
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="absolute -bottom-6 left-8 right-8 flex justify-between items-center">
             {dish.displayPrice ? (
               <span className="bg-yellow-400 text-red-900 px-5 py-2 rounded-2xl font-black text-xl shadow-xl border-2 border-white">
                 {dish.displayPrice}
               </span>
             ) : <div />}
             <button onClick={handleImageSearch} className="bg-white text-slate-700 px-4 py-2.5 rounded-2xl font-black text-[10px] shadow-xl flex items-center gap-2 active:scale-95 border border-slate-100 transition-all uppercase tracking-widest">
               🔍 {t('dishDetail.searchPhotos')}
             </button>
          </div>
        </div>

        <div className="p-8 pt-12 overflow-y-auto flex-1 space-y-8 text-slate-900 text-left custom-scrollbar">
          {!isLoadingDetail && dish.has_animal_fats && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 animate-in zoom-in duration-300">
              <AnimalFatIcon className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-red-800 text-xs font-bold leading-tight">
                <Trans i18nKey="dishDetail.containsAnimalFat">
                  Contains <span className="underline font-black">Animal Fats / Lard (猪油)</span>.
                </Trans>
              </p>
            </div>
          )}

          <section className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm">
            <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3">{t('dishDetail.aiInsight')}</h4>
            {isLoadingDetail ? (
              <div className="space-y-2 py-1">
                <div className="h-3 bg-slate-100 animate-pulse rounded-full w-full" />
                <div className="h-3 bg-slate-100 animate-pulse rounded-full w-4/5" />
              </div>
            ) : (
              <p className="text-slate-700 leading-relaxed text-base font-bold italic">
                "{dish.description || t('dishDetail.defaultInsight')}"
              </p>
            )}
          </section>

          <section>
            <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
              {t('dishDetail.coreComponents')}
              {isLoadingDetail && <span className="text-rose-500 animate-pulse lowercase font-normal">{t('dishDetail.analyzing')}</span>}
            </h4>
            
            {dish.displayIngredients && dish.displayIngredients.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {dish.displayIngredients.map((ing: any, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => onIngredientClick({ name_en: ing.name_en, name_cn: ing.name_cn })} 
                    className="p-4 bg-white hover:bg-slate-50 rounded-2xl text-left border border-slate-200 transition-all active:scale-95 flex flex-col justify-center h-24 shadow-sm"
                  >
                    {/* 第一行：主标题，由 Hook 决定（中文下为中文，外文下为译名） */}
                    <span className="text-sm font-black text-slate-700 leading-tight mb-1 line-clamp-2 uppercase tracking-tight">
                      {ing.displayName}
                    </span>
                    
                    {/* 第二行：副标题对照逻辑 */}
                    {/* 只有在非中文环境下，且 Hook 处理出的 name_cn 与 displayName 不相同时，才显示中文对照 */}
                    {!i18n.language.startsWith('zh') && ing.name_cn && ing.name_cn !== ing.displayName && (
                      <span className="text-[11px] font-bold text-slate-400 tracking-wide">
                        {ing.name_cn}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : isLoadingDetail ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
                ))}
              </div>
            ) : null}
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={onSpicyClick} 
              className={`p-6 rounded-[2rem] border-2 text-left transition-all active:scale-95 ${
                isLoadingDetail ? 'bg-slate-50 border-slate-100 opacity-60' 
                : spicyLevel > 0 ? 'bg-red-600 border-red-700 shadow-lg shadow-red-50' 
                : 'bg-slate-100 border-slate-200 shadow-none'
              }`}
            >
              <h4 className={`text-[8px] font-black uppercase mb-3 tracking-widest ${isLoadingDetail || spicyLevel === 0 ? 'text-slate-400' : 'text-white/70'}`}>{t('dishDetail.heatLevel')}</h4>
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-lg ${i < spicyLevel ? 'grayscale-0' : 'grayscale opacity-20'}`}>🌶️</span>
                  ))}
                </div>
                {!isLoadingDetail && (
                  <span className={`text-[9px] font-black uppercase ${spicyInfo.color}`}>{spicyInfo.label}</span>
                )}
              </div>
            </button>

            <div className={`p-6 rounded-[2rem] border-2 flex flex-col justify-center transition-all ${isLoadingDetail ? 'bg-slate-50 border-slate-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <h4 className="text-[8px] font-black text-emerald-800/40 uppercase mb-3 tracking-widest">{t('dishDetail.dietaryFlags')}</h4>
              <div className="flex flex-wrap gap-1.5">
                {isLoadingDetail ? (
                    <div className="h-4 w-24 bg-emerald-100/50 animate-pulse rounded-full" />
                ) : dish.allergens?.length > 0 ? (
                  dish.allergens.map((a: string, i: number) => (
                    <span key={i} className="text-[9px] font-black uppercase bg-emerald-600 px-2.5 py-1 rounded-lg text-white">{a}</span>
                  ))
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 italic">{t('dishDetail.noAllergens')}</span>
                )}
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] shadow-xl uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-all">
            {t('dishDetail.returnToMenu')}
          </button>
        </div>
      </div>
    </div>
  );
};