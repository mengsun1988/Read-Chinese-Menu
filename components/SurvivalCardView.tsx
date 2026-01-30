import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SurvivalCard, SURVIVAL_CATEGORIES, OFFICIAL_CARDS } from './SurvivalData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE = "https://api.readchinesemenu.com/api/survival";
const CACHE_KEY = "cached_survival_community";

export const SurvivalCardView: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("Safety");
  const [selectedCard, setSelectedCard] = useState<SurvivalCard | null>(null);
  const [communityCards, setCommunityCards] = useState<SurvivalCard[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [newEn, setNewEn] = useState("");
  const [newCn, setNewCn] = useState(""); 
  const [isTranslating, setIsTranslating] = useState(false);

  const fetchCommunityCards = useCallback(async () => {
    // 1. 优先读取本地缓存实现秒开
    if (communityCards.length === 0) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) setCommunityCards(JSON.parse(cached));
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_BASE);
      if (response.ok) {
        const data = await response.json();
        setCommunityCards(data);
        // 2. 存入缓存供下次使用
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.error("Failed to fetch cards:", err);
    } finally {
      setIsLoading(false);
    }
  }, [communityCards.length]);

  useEffect(() => {
    // 只要面板打开，就静默执行同步
    if (isOpen) {
      fetchCommunityCards();
    }
  }, [isOpen, fetchCommunityCards]);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleTranslate = async () => {
    if (!newEn || newEn.length < 3) return;
    setIsTranslating(true);
    try {
      const response = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newEn })
      });
      const data = await response.json();
      if (data.translation) setNewCn(data.translation);
    } catch (err) {
      console.error("Translation Error:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEn || !newCn) return;
    setIsLoading(true);
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'add', 
          newCard: { en: newEn, cn: newCn, icon: "✨", votes: 0, category: activeTab === "Community" ? "Street" : activeTab } 
        })
      });
      if (response.ok) {
        setShowAddForm(false);
        setNewEn(""); setNewCn("");
        await fetchCommunityCards();
      }
    } catch (err) { 
      console.error("Submit failed:", err); 
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCards = useMemo(() => {
    if (activeTab === "Community") {
      return [...communityCards].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    }
    const official = OFFICIAL_CARDS.filter(c => c.category === activeTab);
    const promoted = communityCards.filter(c => c.category === activeTab && (c.votes || 0) >= 20);
    return [...official, ...promoted];
  }, [activeTab, communityCards]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-slate-50 flex flex-col animate-in slide-in-from-bottom duration-300">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-100 shrink-0">
        <div className="max-w-3xl mx-auto px-6 pt-10 pb-4 flex justify-between items-end">
          <div className="text-left">
            <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">{t('survival.badge')}</p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{t('survival.title')}</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-900 active:scale-90 transition-all">
            <span className="text-lg">✕</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white border-b border-slate-50 shrink-0 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 space-y-3">
          <button 
            onClick={() => setShowAddForm(true)}
            className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black tracking-widest shadow-lg shadow-rose-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase"
          >
            <span>+ {t('survival.contribute')}</span>
          </button>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {SURVIVAL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border shrink-0
                  ${activeTab === cat ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500'}`}
              >
                {t(`survival.categories.${cat}`)}
              </button>
            ))}
            <button
              onClick={() => setActiveTab("Community")}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border shrink-0
                ${activeTab === "Community" ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-emerald-600'}`}
            >
              {t('survival.community')}
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50">
        <div className="max-w-3xl mx-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 content-start pb-32 grid-container">
          
          {/* 直接渲染卡片，不再等待 isLoading */}
          {filteredCards.map((card) => (
            <div
              key={card.id || card.en}
              onClick={() => { setSelectedCard(card); speak(card.cn); }}
              className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-[50px_1fr] items-center gap-4 active:scale-95 transition-all relative cursor-pointer min-h-[80px]"
            >
              <div className="text-3xl text-center">{card.icon}</div>
              <div className="flex flex-col justify-center border-l border-slate-50 pl-2">
                <p className="text-[14px] font-black text-slate-900 leading-tight italic tracking-tight line-clamp-2 mb-0.5">
                  {card.id ? t(`survival.cards.${card.id}`) : card.en}
                </p>
                <p className="text-[12px] font-bold text-slate-400 truncate">{card.cn}</p>
              </div>
            </div>
          ))}

          {/* 仅在完全没有数据且加载时显示占位提示 */}
          {isLoading && filteredCards.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 font-black animate-pulse uppercase tracking-widest text-[10px]">
              {t('survival.loading')}
            </div>
          )}
        </div>
      </div>

      {/* Big Card Overlay */}
      {selectedCard && (
        <div className="fixed inset-0 z-[400] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm bg-rose-600 rounded-[3rem] p-8 shadow-2xl shadow-rose-900/20 relative animate-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedCard(null)}
              className="absolute top-6 right-6 w-8 h-8 bg-rose-500/50 rounded-full flex items-center justify-center text-white font-bold"
            >✕</button>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="text-[6rem] drop-shadow-xl animate-bounce-slow shrink-0">{selectedCard.icon}</div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-rose-100/40 text-[9px] font-black uppercase tracking-widest">{t('survival.overlay.requestLabel')}</p>
                  <h3 className="text-white text-xl font-black italic tracking-tighter line-clamp-2 leading-tight">
                    {selectedCard.id ? t(`survival.cards.${selectedCard.id}`) : selectedCard.en}
                  </h3>
                </div>
                <div className="py-4">
                  <h2 className="text-white text-5xl font-black leading-tight drop-shadow-lg break-words animate-breathe">
                    {selectedCard.cn}
                  </h2>
                </div>
              </div>
              <button 
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform" 
                onClick={(e) => { e.stopPropagation(); speak(selectedCard.cn); }}
              >
                <span className="text-3xl">🔊</span>
              </button>
            </div>
          </div>
          <div className="absolute inset-0 -z-10" onClick={() => setSelectedCard(null)}></div>
        </div>
      )}

      {/* Add Form Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 z-[500] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative">
            <button type="button" onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 text-slate-300 font-bold text-lg">✕</button>
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{t('survival.form.title')}</h3>
            </div>
            <div className="space-y-4">
              <input 
                required autoFocus value={newEn} 
                onChange={e => setNewEn(e.target.value)}
                onBlur={handleTranslate}
                placeholder={t('survival.form.placeholder')} 
                className="w-full bg-slate-50 rounded-xl px-5 py-4 text-sm font-bold text-slate-900 outline-none border-2 border-transparent focus:border-rose-100"
              />
              <div className="w-full bg-slate-900 rounded-xl px-5 py-4 flex items-center">
                <p className="text-white font-black text-lg">{newCn || (newEn ? "..." : "")}</p>
              </div>
            </div>
            <button type="submit" className="w-full py-5 rounded-full font-black text-xs bg-rose-600 text-white active:scale-95">
              {t('survival.form.submit')}
            </button>
          </form>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .grid-container { content-visibility: auto; contain-intrinsic-size: 0 80px; }
        
        @keyframes bounce-slow { 
          0%, 100% { transform: translateY(0); } 
          50% { transform: translateY(-10px); } 
        }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }

        @keyframes breathe {
          0% { transform: scale(0.98); opacity: 0.85; text-shadow: 0 0 10px rgba(255,255,255,0); }
          100% { transform: scale(1.05); opacity: 1; text-shadow: 0 0 25px rgba(255,255,255,0.6), 0 0 50px rgba(255,255,255,0.2); }
        }
        .animate-breathe {
          display: inline-block;
          animation: breathe 2.5s ease-in-out infinite alternate;
          will-change: transform, opacity;
        }
      `}} />
    </div>
  );
};