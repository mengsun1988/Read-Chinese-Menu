import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { SurvivalCard, SURVIVAL_CATEGORIES, OFFICIAL_CARDS } from './SurvivalData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE = "https://api.readchinesemenu.com/api/survival";

export const SurvivalCardView: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>("Safety");
  const [selectedCard, setSelectedCard] = useState<SurvivalCard | null>(null);
  const [communityCards, setCommunityCards] = useState<SurvivalCard[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [newEn, setNewEn] = useState("");
  const [newCn, setNewCn] = useState(""); 
  const [newCategory, setNewCategory] = useState(""); 
  const [isTranslating, setIsTranslating] = useState(false);

  // 获取社区卡片数据
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

  // 语音播报逻辑
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  }, []);

  // 核心：调用 Cloudflare AI 翻译
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
      if (data.translation) {
        setNewCn(data.translation);
      }
    } catch (err) {
      console.error("Translation Error:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  // 核心：处理投票逻辑 (Optimistic UI) - Only upvotes now
  const handleVote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // 本地先更新，提升流畅感
    setCommunityCards(prev => 
      prev.map(c => c.id === id ? { ...c, votes: (c.votes || 0) + 1 } : c)
    );
    try {
      await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote', cardId: id })
      });
    } catch (err) { 
      console.error("Vote failed:", err);
      // Revert local change on failure
      setCommunityCards(prev => 
        prev.map(c => c.id === id ? { ...c, votes: Math.max(0, (c.votes || 0) - 1) } : c)
      );
    }
  };

  // 核心：提交新卡片
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEn || !newCn) return;
    
    // Basic profanity check
    const profanityWords = ['shit', 'fuck', 'bitch', 'asshole', 'piss', 'damn', 'hell', 'bastard', 'cunt', 'dick'];
    const containsProfanity = profanityWords.some(word => 
      newEn.toLowerCase().includes(word) || newCn.toLowerCase().includes(word)
    );
    
    if (containsProfanity) {
      alert("Your submission contains inappropriate language. Please revise and try again.");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'add', 
          newCard: { 
            en: newEn, 
            cn: newCn, 
            icon: "✨", 
            votes: 0 
          } 
        })
      });
      
      if (response.ok) {
        setShowAddForm(false);
        setNewEn(""); 
        setNewCn("");
        await fetchCommunityCards();
      } else {
        const err = await response.json();
        alert(err.error || "Submission failed. Please check your input.");
      }
    } catch (err) { 
      console.error("Submit failed:", err); 
      alert("Network error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // 过滤显示逻辑
  const filteredCards = useMemo(() => {
    if (activeTab === "Community") {
      return [...communityCards].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    }
    
    // Include community cards with >= 20 votes in official categories
    const promotedCards = communityCards.filter(c => 
      c.category === activeTab && (c.votes || 0) >= 20
    );
    
    return [...OFFICIAL_CARDS.filter(c => c.category === activeTab), ...promotedCards];
  }, [activeTab, communityCards]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-slate-50 flex flex-col animate-in slide-in-from-bottom duration-300">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm shrink-0">
        <div className="max-w-3xl mx-auto px-6 pt-12 pb-6 flex justify-between items-end">
          <div className="text-left">
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] mb-1">Global CrowdSourced</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Survival Cards</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-900 active:scale-90 transition-all">
            <span className="text-xl font-bold">✕</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Contribute & Tabs */}
      <div className="bg-white border-b border-slate-50 shrink-0 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-2 space-y-4">
          <button 
            onClick={() => setShowAddForm(true)}
            className="w-full py-5 bg-rose-600 text-white rounded-[1.5rem] text-xs font-black tracking-widest shadow-xl shadow-rose-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase"
          >
            <span>+ Share Your Experience</span>
          </button>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            {SURVIVAL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0
                  ${activeTab === cat ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={() => setActiveTab("Community")}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0
                ${activeTab === "Community" ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-200 text-emerald-600'}`}
            >
              COMMUNITY
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50">
        <div className="max-w-3xl mx-auto p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 content-start pb-32">
          {isLoading && communityCards.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-400 font-black animate-pulse uppercase tracking-[0.3em] text-[10px]">Loading Knowledge...</div>
          ) : filteredCards.map((card) => (
            <div
              key={card.id || card.en}
              onClick={() => { setSelectedCard(card); speak(card.cn); }}
              className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 active:scale-95 transition-all hover:border-rose-200 group relative cursor-pointer"
            >
              <div className="text-4xl shrink-0 group-hover:scale-110 transition-transform duration-300">{card.icon}</div>
              <div className="space-y-1 overflow-hidden">
                <p className="text-[18px] font-black text-slate-900 leading-tight line-clamp-2 italic tracking-tight">{card.en}</p>
                <p className="text-[14px] font-bold text-slate-400 truncate">{card.cn}</p>
              </div>

              {activeTab === "Community" && (
                <div className="absolute top-4 right-4 flex flex-col items-center bg-slate-50/80 backdrop-blur-sm rounded-full py-1 px-1.5 border border-slate-100 shadow-sm scale-90">
                  <button onClick={(e) => handleVote(card.id!, e)} className="text-[12px] p-0.5 hover:scale-125 transition-transform">👍</button>
                  <span className="text-[8px] font-black my-0.5 text-emerald-600">{card.votes || 0}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Big Card Overlay */}
      {selectedCard && (
        <div 
          className="fixed inset-0 z-[400] bg-rose-600 p-8 flex flex-col items-center justify-center text-center animate-in zoom-in duration-200" 
          onClick={() => setSelectedCard(null)}
        >
          <div className="max-w-2xl w-full">
            <div className="mb-12 text-[10rem] animate-bounce-slow drop-shadow-2xl">{selectedCard.icon}</div>
            <div className="space-y-16">
              <div className="space-y-4">
                <p className="text-rose-100/40 text-[12px] font-black uppercase tracking-[0.2em]">Translate to Shop Staff</p>
                <h3 className="text-white text-4xl md:text-5xl font-black italic tracking-tighter">{selectedCard.en}</h3>
              </div>
              <div className="space-y-4">
                <h2 className="text-white text-7xl md:text-9xl font-black leading-tight drop-shadow-2xl break-words">{selectedCard.cn}</h2>
              </div>
            </div>
            <button 
              className="mt-20 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-3xl active:scale-90 transition-transform" 
              onClick={(e) => { e.stopPropagation(); speak(selectedCard.cn); }}
            >
              <span className="text-4xl">🔊</span>
            </button>
          </div>
        </div>
      )}

      {/* Add New Card Form Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 z-[500] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-8 shadow-2xl overflow-hidden relative">
            <button type="button" onClick={() => setShowAddForm(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 font-bold text-xl">✕</button>
            
            <div className="text-center">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Share Wisdom</h3>
              <p className="text-slate-400 text-[11px] font-bold uppercase mt-2">Help fellow travelers in China</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 ml-4 uppercase tracking-widest">English Request</label>
                <div className="relative">
                  <input 
                    required 
                    autoFocus
                    value={newEn} 
                    onChange={e => setNewEn(e.target.value)}
                    onBlur={handleTranslate}
                    placeholder="e.g. Do you have ice water?" 
                    className="w-full bg-slate-50 border-2 border-slate-50 focus:border-rose-200 rounded-2xl px-6 py-5 text-base font-bold text-slate-900 outline-none transition-all"
                  />
                  {isTranslating && <div className="absolute right-5 top-5 animate-spin text-rose-500">⏳</div>}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 ml-4 uppercase tracking-widest">AI Chinese Translation</label>
                <div className="w-full bg-slate-900 rounded-2xl px-6 py-5 min-h-[64px] flex items-center">
                  <p className="text-white font-black text-xl tracking-tight">
                    {newCn || (newEn ? "Translating..." : "...")}
                  </p>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!newCn || isLoading}
              className={`w-full py-6 rounded-full font-black text-sm shadow-xl transition-all uppercase tracking-widest
                ${(!newCn || isLoading) ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-rose-600 text-white active:scale-95 shadow-rose-200'}`}
            >
              {isLoading ? "Vetting..." : "Add to Knowledge Base"}
            </button>
          </form>
        </div>
      )}

      {/* Global CSS for Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}} />
    </div>
  );
};
