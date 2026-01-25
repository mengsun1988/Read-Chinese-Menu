import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { SurvivalCard, SURVIVAL_CATEGORIES, OFFICIAL_CARDS } from './SurvivalData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE = "https://api.readchinesemenu.com/api/survival";

export const SurvivalCardView: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>("Dining");
  const [selectedCard, setSelectedCard] = useState<SurvivalCard | null>(null);
  const [communityCards, setCommunityCards] = useState<SurvivalCard[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [newEn, setNewEn] = useState("");
  const [newCn, setNewCn] = useState("");
  const [newIcon, setNewIcon] = useState("✨");

  const fetchCommunityCards = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_BASE);
      if (response.ok) {
        const data = await response.json();
        setCommunityCards(data);
      }
    } catch (err) {
      console.error("Failed to fetch cards:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
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
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleVote = async (id: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCommunityCards(prev => 
      prev.map(c => c.id === id ? { ...c, votes: (c.votes || 0) + delta } : c)
    );
    try {
      await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote', cardId: id, delta })
      });
      fetchCommunityCards();
    } catch (err) { console.error("Vote failed:", err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEn || !newCn) return;
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', newCard: { category: "Community", en: newEn, cn: newCn, icon: newIcon } })
      });
      if (response.ok) {
        setShowAddForm(false);
        setNewEn(""); setNewCn("");
        fetchCommunityCards();
      }
    } catch (err) { console.error("Submit failed:", err); }
  };

  const filteredCards = useMemo(() => {
    if (activeTab === "Community") {
      return [...communityCards].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    }
    return OFFICIAL_CARDS.filter(c => c.category === activeTab);
  }, [activeTab, communityCards]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-slate-50 flex flex-col animate-in slide-in-from-bottom duration-300">
      
      {/* 1. Header - 确保文字颜色为 slate-900 */}
      <div className="bg-white px-6 pt-12 pb-6 flex justify-between items-end border-b border-slate-100 shadow-sm shrink-0">
        <div className="text-left">
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] mb-1">Communication Assist</p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Survival Cards</h2>
        </div>
        <button 
          onClick={onClose} 
          className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-900 hover:bg-slate-200 active:scale-90 transition-all shadow-sm"
        >
          <span className="text-xl font-bold">✕</span>
        </button>
      </div>

      {/* 2. Tabs - 控制内间距确保不被遮挡 */}
      <div className="bg-white px-4 py-4 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-50 shrink-0">
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-[10px] font-black shrink-0 shadow-lg shadow-rose-100 flex items-center gap-1 active:scale-95 transition-transform"
        >
          <span>+ CONTRIBUTE</span>
        </button>
        <div className="h-4 w-[1px] bg-slate-200 shrink-0 mx-1"></div>
        {SURVIVAL_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0
              ${activeTab === cat ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. Cards Grid - 核心文字显示区域修复 */}
      <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 gap-4 content-start pb-32 no-scrollbar">
        {isLoading && communityCards.length === 0 ? (
          <div className="col-span-2 py-20 text-center text-slate-400 font-black animate-pulse">LOADING...</div>
        ) : filteredCards.map((card) => (
          <div
            key={card.id || card.en}
            onClick={() => { setSelectedCard(card); speak(card.cn); }}
            className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between aspect-[4/5] active:scale-95 transition-all hover:border-rose-200 group relative overflow-hidden"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">{card.icon}</div>
            
            <div className="space-y-1.5 mt-auto">
              {/* 英文标题：显式声明颜色为深色 */}
              <p className="text-[13px] font-black text-slate-900 leading-tight group-hover:text-rose-600 transition-colors">
                {card.en}
              </p>
              {/* 中文翻译：显式声明颜色 */}
              <p className="text-[10px] font-bold text-slate-400 break-words">
                {card.cn}
              </p>
            </div>

            {/* 投票按钮 */}
            {!card.isOfficial && (
              <div className="absolute top-4 right-4 flex flex-col items-center bg-slate-50/80 backdrop-blur-sm rounded-full py-1.5 px-2 border border-slate-100">
                <button onClick={(e) => handleVote(card.id!, 1, e)} className="text-[10px] hover:scale-125 transition-transform p-0.5">👍</button>
                <span className={`text-[8px] font-black my-0.5 ${ (card.votes || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{card.votes || 0}</span>
                <button onClick={(e) => handleVote(card.id!, -1, e)} className="text-[10px] hover:scale-125 transition-transform p-0.5">👎</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 4. Big Text Mode - 修复全屏显示时的颜色对比度 */}
      {selectedCard && (
        <div 
          className="fixed inset-0 z-[400] bg-rose-600 p-10 flex flex-col items-center justify-center text-center animate-in zoom-in duration-200" 
          onClick={() => setSelectedCard(null)}
        >
          <div className="absolute top-16 text-rose-200/60 text-[10px] font-black uppercase tracking-[0.3em]">
            {selectedCard.isOfficial ? "Official Survival Card" : `Community Contribution • ${selectedCard.votes} Votes`}
          </div>
          
          <div className="mb-12 text-8xl animate-bounce-slow drop-shadow-2xl">{selectedCard.icon}</div>
          
          <div className="space-y-12 w-full max-w-sm">
            <div className="space-y-4">
              <p className="text-rose-100/50 text-[10px] font-black uppercase tracking-[0.2em]">English Phrase</p>
              <h3 className="text-white text-3xl font-black italic leading-tight tracking-tight">{selectedCard.en}</h3>
            </div>
            
            <div className="flex items-center gap-4 text-white/30">
              <div className="h-[1px] flex-1 bg-current"></div>
              <div className="text-[10px]">TAP TO CLOSE</div>
              <div className="h-[1px] flex-1 bg-current"></div>
            </div>
            
            <div className="space-y-4">
              <p className="text-rose-100/50 text-[10px] font-black uppercase tracking-[0.2em]">Show to Staff</p>
              <h2 className="text-white text-6xl font-black leading-tight tracking-tight drop-shadow-2xl">
                {selectedCard.cn}
              </h2>
            </div>
          </div>

          <button 
            className="absolute bottom-16 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-3xl active:scale-90 transition-all hover:scale-105"
            onClick={(e) => { e.stopPropagation(); speak(selectedCard.cn); }}
          >
            <span className="text-4xl">🔊</span>
          </button>
        </div>
      )}

      {/* 5. Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[500] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 space-y-8 shadow-2xl relative">
            <button 
              type="button"
              onClick={() => setShowAddForm(false)} 
              className="absolute top-8 right-8 text-slate-300 font-bold"
            >✕</button>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Contribute</h3>
              <p className="text-slate-400 text-xs font-bold">Help fellow travelers in China</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">English</label>
                <input required value={newEn} onChange={e => setNewEn(e.target.value)} placeholder="e.g. No Cilantro please" className="w-full bg-slate-50 border-2 border-slate-50 focus:border-rose-100 rounded-3xl px-6 py-4 text-sm font-bold text-slate-900 outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">Chinese</label>
                <input required value={newCn} onChange={e => setNewCn(e.target.value)} placeholder="e.g. 不要香菜" className="w-full bg-slate-50 border-2 border-slate-50 focus:border-rose-100 rounded-3xl px-6 py-4 text-sm font-bold text-slate-900 outline-none transition-all" />
              </div>
              <div className="flex justify-between bg-slate-50 p-4 rounded-[2rem] gap-2">
                {["✨", "🍱", "🚑", "🤝", "🌿"].map(emoji => (
                  <button type="button" key={emoji} onClick={() => setNewIcon(emoji)} className={`text-2xl w-12 h-12 rounded-2xl transition-all flex items-center justify-center ${newIcon === emoji ? 'bg-white shadow-sm scale-110' : 'opacity-30 grayscale'}`}>{emoji}</button>
                ))}
              </div>
            </div>
            
            <button type="submit" className="w-full py-5 bg-rose-600 text-white rounded-full font-black text-sm shadow-xl shadow-rose-200 active:scale-95 transition-transform">
              SUBMIT PHRASE
            </button>
          </form>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes bounce-slow { 
          0%, 100% { transform: translateY(0) scale(1); } 
          50% { transform: translateY(-10px) scale(1.05); } 
        }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}} />
    </div>
  );
};