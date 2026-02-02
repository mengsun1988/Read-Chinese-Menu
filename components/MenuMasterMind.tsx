import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface FoodQuestion {
  id: number;
  literal: string;
  correct: string;
  options: string[];
  ingredients: string;
  note: string;
}

interface MenuMasterMindProps {
  onFinish?: () => void;
  onAwardPoints?: () => void;
}

export default function MenuMasterMind({ onFinish, onAwardPoints }: MenuMasterMindProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [hasAwarded, setHasAwarded] = useState(false);

  // 1. 从 i18n 获取所有题目并随机抽取 5 本
  const questions = useMemo(() => {
    const allQuestions = t('game.questions', { returnObjects: true }) as FoodQuestion[];
    if (!Array.isArray(allQuestions)) return [];
    return [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 5);
  }, [t]);

  const current = questions[index];
  const isFinished = index >= questions.length;

  // 2. 满分奖励逻辑
  useEffect(() => {
    if (isFinished && score === 5 && onAwardPoints && !hasAwarded) {
      onAwardPoints();
      setHasAwarded(true);
    }
  }, [isFinished, score, onAwardPoints, hasAwarded]);

  const handleSelect = (option: string) => {
    if (selected) return;
    setSelected(option);
    
    if (window.navigator.vibrate) {
      option === current.correct ? window.navigator.vibrate([10, 30, 10]) : window.navigator.vibrate(80);
    }
    
    if (option === current.correct) setScore(s => s + 1);
    setTimeout(() => setShowResult(true), 200);
  };

  const nextQuestion = () => {
    setSelected(null);
    setShowResult(false);
    setIndex(i => i + 1);
  };

  // 游戏结束视图
  if (isFinished) {
    const isPerfect = score === 5;
    return (
      <div className="bg-emerald-900 rounded-[2rem] p-6 md:p-10 text-center shadow-2xl animate-in zoom-in duration-500 relative max-w-sm mx-auto w-full">
        <div className="text-6xl mb-4">{isPerfect ? "🏆" : "🎊"}</div>
        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
          {isPerfect ? t('game.status.perfect') : t('game.status.wellDone')}
        </h3>
        <p className="text-emerald-200/60 text-xs mt-2 mb-4 uppercase tracking-widest font-bold">
          {t('game.status.score', { score })}
        </p>
        
        {isPerfect && (
          <div className="mb-8 p-4 bg-emerald-400/10 border border-emerald-400/30 rounded-2xl animate-pulse">
            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              {t('game.status.reward')}
            </p>
          </div>
        )}

        {!isPerfect && (
          <p className="text-emerald-200/40 text-[10px] mb-8 font-bold italic">
            {t('game.status.hint')}
          </p>
        )}

        <button 
          onClick={onFinish}
          className="w-full bg-emerald-400 text-emerald-950 font-black py-4 rounded-full uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all"
        >
          {t('game.status.finish')}
        </button>
      </div>
    );
  }

  // 容错处理
  if (!current) return null;

  return (
    <div className="bg-white rounded-[2rem] p-5 md:p-6 shadow-xl border border-emerald-100 relative overflow-hidden transition-all duration-500 max-w-sm mx-auto w-full">
      {/* 顶部关闭 */}
      <button 
        onClick={onFinish}
        className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors z-20"
      >
        ✕
      </button>

      {/* 顶部进度条 */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-50">
        <div className="h-full bg-emerald-500 transition-all duration-700 ease-out" style={{ width: `${((index + 1) / 5) * 100}%` }} />
      </div>

      <div className="mt-4 flex justify-between items-center mb-10 pr-10">
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">
          {t('game.title')}
        </span>
        <div className="bg-emerald-50 px-3 py-1 rounded-full">
            <span className="text-[10px] font-black text-emerald-500 italic">{index + 1} OF 5</span>
        </div>
      </div>

      <div className="mb-10 text-center px-4">
        <p className="text-slate-400 text-[9px] uppercase font-black tracking-widest mb-3">
          {t('game.status.literalLabel')}
        </p>
        <h4 className="text-2xl md:text-3xl font-black text-slate-900 italic leading-tight tracking-tighter">
          "{current.literal}"
        </h4>
      </div>

      <div className="grid gap-3">
        {current.options.map((opt) => {
          const isCorrect = opt === current.correct;
          const isSelected = selected === opt;
          let btnStyle = "border-slate-100 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/30";
          if (selected) {
            if (isCorrect) btnStyle = "border-emerald-500 bg-emerald-500 text-white scale-[1.02] shadow-lg shadow-emerald-200 z-10";
            else if (isSelected) btnStyle = "border-rose-500 bg-rose-50 text-rose-600 animate-shake";
            else btnStyle = "opacity-20 grayscale border-slate-50";
          }
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={!!selected}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 font-bold text-sm flex justify-between items-center ${btnStyle} active:scale-95`}
            >
              <span className="pr-4">{opt}</span>
              {selected && isCorrect && <span className="text-lg">✨</span>}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="mt-8 p-6 bg-slate-900 rounded-[2rem] text-white animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px]">✓</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 italic">
              {t('game.status.insight')}
            </span>
          </div>
          <p className="text-xs font-bold leading-relaxed mb-5 text-slate-200 tracking-tight">{current.note}</p>
          <div className="bg-white/5 p-4 rounded-xl mb-6 border border-white/5">
            <span className="text-[8px] uppercase text-slate-500 font-black block mb-1 tracking-widest">
              {t('game.status.ingredientsLabel')}
            </span>
            <span className="text-[11px] font-bold text-emerald-200 leading-tight block">{current.ingredients}</span>
          </div>
          <button
            onClick={nextQuestion}
            className="w-full bg-emerald-500 text-emerald-950 font-black py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] active:bg-emerald-400 transition-colors"
          >
            {index === 4 ? t('game.status.results') : t('game.status.next')}
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}} />
    </div>
  );
}