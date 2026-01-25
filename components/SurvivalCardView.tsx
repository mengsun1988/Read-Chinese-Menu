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
  
  // 新建议表单状态
  const [newEn, setNewEn] = useState("");
  const [newCn, setNewCn] = useState("");
  const [newIcon, setNewIcon] = useState("✨");

  // 1. 从 Cloudflare KV 真实获取社区数据
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

  // 2. 真实投票处理 (对接后端 API)
  const handleVote = async (id: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 乐观 UI 更新：先在界面上改，让用户觉得爽
    setCommunityCards(prev => 
      prev.map(c => c.id === id ? { ...c, votes: c.votes + delta } : c)
          .filter(c => delta < 0 ? (c.votes + delta > -5) : true)
    );

    try {
      await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote', cardId: id, delta })
      });
      // 投票后静默刷新一次，确保同步后端状态（比如是否被自动删除了）
      fetchCommunityCards();
    } catch (err) {
      console.error("Vote failed:", err);
    }
  };

  // 3. 提交新建议 (对接后端 API)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEn || !newCn) return;

    const newCardData = {
      category: "Community",
      en: newEn,
      cn: newCn,
      icon: newIcon,
    };

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', newCard: newCardData })
      });
      
      if (response.ok) {
        setShowAddForm(false);
        setNewEn(""); 
        setNewCn("");
        fetchCommunityCards(); // 重新加载列表
      }
    } catch (err) {
      console.error("Submit failed:", err);
    }
  };

  const filteredCards = useMemo(() => {
    if (activeTab === "Community") {
      return [...communityCards].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    }
    return OFFICIAL_CARDS.filter(c => c.category === activeTab);
  }, [activeTab, communityCards]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col animate-in slide-in-from-bottom duration-300">
      
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 flex justify-between items-end border-b border-slate-100 shadow-sm shrink-0">
        <div>
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] mb-1">Communication Assist</p>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Survival Cards</h2>
        </div>
        <button onClick={onClose} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-900 font-bold active:scale-75 transition-transform">✕</button>
      </div>

      {/* Tabs & Add Button */}
      <div className="bg-white px-4 py-4 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-50 shrink-0">
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 rounded-xl bg-rose-600 text-white text-[10px] font-black shrink-0 shadow-lg shadow-rose-100 flex items-center gap-1"
        >
          <span>+ CONTRIBUTE</span>
        </button>
        <div className="h-4 w-[1px] bg-slate-200 shrink-0 mx-1"></div>
        {SURVIVAL_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0
              ${activeTab === cat ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 gap-4 content-start pb-32 no-scrollbar">
        {isLoading && communityCards.length === 0 ? (
          <div className="col-span-2 py-20 text-center text-slate-300 font-bold animate-pulse">Loading community phrases...</div>
        ) : filteredCards.map((card) => (
          <div
            key={card.id}
            onClick={() => { setSelectedCard(card); speak(card.cn); }}
            className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm text-left flex flex-col justify-between aspect-[4/5] active:scale-95 transition-all hover:border-rose-200 group relative"
          >
            <div className="text-3xl group-hover:scale-110 transition-transform duration-300">{card.icon}</div>
            <div className="space-y-1">
              <p className="text-[12px] font-black text-slate-900 leading-tight group-hover:text-rose-600 transition-colors">{card.en}</p>
              <p className="text-[9px] font-bold text-slate-400 truncate">{card.cn}</p>
            </div>

            {!card.isOfficial && (
              <div className="absolute top-4 right-4 flex flex-col items-center bg-slate-50 rounded-full py-1 px-1.5 border border-slate-100">
                <button onClick={(e) => handleVote(card.id!, 1, e)} className="text-[10px] hover:scale-125 transition-transform">👍</button>
                <span className={`text-[8px] font-black my-0.5 ${card.votes! >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{card.votes}</span>
                <button onClick={(e) => handleVote(card.id!, -1, e)} className="text-[10px] hover:scale-125 transition-transform">👎</button>
              </div>
            )}
          </div>
        ))}
        {activeTab === "Community" && communityCards.length === 0 && !isLoading && (
          <div className="col-span-2 py-20 text-center space-y-4">
             <div className="text-4xl opacity-20">🍃</div>
             <p className="text-slate-400 text-xs font-bold">No community phrases yet.<br/>Be the first to contribute!</p>
          </div>
        )}
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[220] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-sm rounded-[3rem] p-8 space-y-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 text-center">Contribute Phrase</h3>
            <div className="space-y-4">
              <input required value={newEn} onChange={e => setNewEn(e.target.value)} placeholder="English phrase..." className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-rose-500" />
              <input required value={newCn} onChange={e => setNewCn(e.target.value)} placeholder="Chinese translation..." className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-rose-500" />
              <div className="flex justify-around bg-slate-50 p-3 rounded-2xl">
                {["✨", "🍱", "🚑", "🚕", "🤝", "🌿"].map(emoji => (
                  <button type="button" key={emoji} onClick={() => setNewIcon(emoji)} className={`text-2xl p-2 rounded-xl transition-all ${newIcon === emoji ? 'bg-white shadow-md scale-110' : 'opacity-40'}`}>{emoji}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-4 text-xs font-bold text-slate-400">CANCEL</button>
              <button type="submit" className="flex-1 py-4 bg-rose-600 text-white rounded-full font-black text-xs shadow-lg shadow-rose-200">SUBMIT</button>
            </div>
          </form>
        </div>
      )}

      {/* Big Text Mode */}
      {selectedCard && (
        <div className="fixed inset-0 z-[210] bg-rose-600 p-10 flex flex-col items-center justify-center text-center animate-in zoom-in duration-200" onClick={() => setSelectedCard(null)}>
          <div className="absolute top-12 text-rose-200/50 text-[10px] font-black uppercase tracking-[0.3em]">
            {selectedCard.isOfficial ? "Official Card" : `Community • ${selectedCard.votes} Votes`}
          </div>
          <div className="mb-12 text-7xl animate-bounce-slow">{selectedCard.icon}</div>
          <div className="space-y-12 w-full max-w-sm">
            <div className="space-y-3">
              <p className="text-rose-200 text-[10px] font-black uppercase tracking-widest opacity-80">English</p>
              <h3 className="text-white text-2xl font-bold italic leading-tight">{selectedCard.en}</h3>
            </div>
            <div className="flex items-center gap-4 text-white/20"><div className="h-[1px] flex-1 bg-current"></div>◆<div className="h-[1px] flex-1 bg-current"></div></div>
            <div className="space-y-4">
              <p className="text-rose-200 text-[10px] font-black uppercase tracking-widest opacity-80">Show to Staff</p>
              <h2 className="text-white text-5xl font-black leading-tight tracking-tight drop-shadow-lg">{selectedCard.cn}</h2>
            </div>
          </div>
          <button className="absolute bottom-20 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all" onClick={(e) => { e.stopPropagation(); speak(selectedCard.cn); }}>
            <span className="text-3xl">🔊</span>
          </button>
          <p className="absolute bottom-8 text-rose-200/40 text-[9px] font-black uppercase tracking-widest">Tap anywhere to return</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
      `}} />
    </div>
  );
};