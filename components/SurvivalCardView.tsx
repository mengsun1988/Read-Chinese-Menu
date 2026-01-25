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
  const [newCn, setNewCn] = useState(""); // 由 API 翻译填充
  const [newCategory, setNewCategory] = useState(""); 
  const [isTranslating, setIsTranslating] = useState(false);

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

  // 模拟 API 获取翻译逻辑
  const handleTranslate = async () => {
    if (!newEn || newEn.length < 2) return;
    setIsTranslating(true);
    try {
      // 这里调用你的翻译接口
      const response = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newEn })
      });
      const data = await response.json();
      setNewCn(data.translation || "Translation Error");
    } catch (err) {
      setNewCn("Translation failed, please type manually.");
    } finally {
      setIsTranslating(false);
    }
  };

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
    } catch (err) { console.error("Vote failed:", err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEn || !newCn || !newCategory) return;
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'add', 
          newCard: { category: newCategory, en: newEn, cn: newCn, icon: "✨", votes: 0 } 
        })
      });
      if (response.ok) {
        setShowAddForm(false);
        setNewEn(""); setNewCn(""); setNewCategory("");
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
      
      {/* 1. Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm shrink-0">
        <div className="max-w-3xl mx-auto px-6 pt-12 pb-6 flex justify-between items-end">
          <div className="text-left">
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] mb-1">China 100</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Essential Cards</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-900 active:scale-90 transition-all">
            <span className="text-xl font-bold">✕</span>
          </button>
        </div>
      </div>

      {/* 2. Full Width Contribute Button & Tabs */}
      <div className="bg-white border-b border-slate-50 shrink-0 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-2 space-y-4">
          {/* 长横条红色按钮 */}
          <button 
            onClick={() => setShowAddForm(true)}
            className="w-full py-4 bg-rose-600 text-white rounded-2xl text-xs font-black tracking-widest shadow-xl shadow-rose-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase"
          >
            <span>+ Contribute New Survival Card</span>
          </button>

          {/* Tab List */}
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

      {/* 3. Cards Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50">
        <div className="max-w-3xl mx-auto p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 content-start pb-32">
          {isLoading && communityCards.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-400 font-black animate-pulse">LOADING...</div>
          ) : filteredCards.map((card) => (
            <div
              key={card.id || card.en}
              onClick={() => { setSelectedCard(card); speak(card.cn); }}
              className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between aspect-[4/5] active:scale-95 transition-all hover:border-rose-200 group relative cursor-pointer"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">{card.icon}</div>
              <div className="space-y-1 mt-auto">
                <p className="text-[12px] font-black text-slate-900 leading-tight line-clamp-2">{card.en}</p>
                <p className="text-[10px] font-bold text-slate-400 truncate">{card.cn}</p>
              </div>

              {/* 评分审核系统：只有 Community Tab 显示 */}
              {activeTab === "Community" && (
                <div className="absolute top-4 right-4 flex flex-col items-center bg-slate-50/80 backdrop-blur-sm rounded-full py-1 px-1.5 border border-slate-100 shadow-sm">
                  <button onClick={(e) => handleVote(card.id!, 1, e)} className="text-[12px] p-0.5 hover:scale-125 transition-transform">👍</button>
                  <span className={`text-[8px] font-black my-0.5 ${(card.votes || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{card.votes || 0}</span>
                  <button onClick={(e) => handleVote(card.id!, -1, e)} className="text-[12px] p-0.5 hover:scale-125 transition-transform">👎</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Big Text Mode */}
      {selectedCard && (
        <div className="fixed inset-0 z-[400] bg-rose-600 p-6 flex flex-col items-center justify-center text-center animate-in zoom-in duration-200" onClick={() => setSelectedCard(null)}>
          <div className="max-w-2xl w-full">
            <div className="mb-10 text-9xl animate-bounce-slow drop-shadow-2xl">{selectedCard.icon}</div>
            <div className="space-y-12">
              <div className="space-y-4">
                <p className="text-rose-100/40 text-[10px] font-black uppercase tracking-[0.2em]">English</p>
                <h3 className="text-white text-3xl font-black italic">{selectedCard.en}</h3>
              </div>
              <div className="space-y-4">
                <p className="text-rose-100/40 text-[10px] font-black uppercase tracking-[0.2em]">Show to Staff</p>
                <h2 className="text-white text-6xl md:text-8xl font-black leading-tight drop-shadow-2xl">{selectedCard.cn}</h2>
              </div>
            </div>
            <button className="mt-16 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-3xl active:scale-90" onClick={(e) => { e.stopPropagation(); speak(selectedCard.cn); }}>
              <span className="text-3xl">🔊</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Add Form Modal (重构逻辑) */}
      {showAddForm && (
        <div className="fixed inset-0 z-[500] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-[3rem] p-8 space-y-6 shadow-2xl overflow-hidden relative">
            <button type="button" onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 text-slate-300 font-bold">✕</button>
            
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">New Survival Card</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase mt-1">Contribute to the traveler community</p>
            </div>

            <div className="space-y-5">
              {/* 步骤 1: 选择分类 */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">1. Select Category</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {SURVIVAL_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all border shrink-0
                        ${newCategory === cat ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 步骤 2: 输入英文 */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">2. English Phrase</label>
                <div className="relative">
                  <input 
                    required 
                    value={newEn} 
                    onChange={e => setNewEn(e.target.value)}
                    onBlur={handleTranslate}
                    placeholder="e.g. Can I have more napkins?" 
                    className="w-full bg-slate-50 border-2 border-slate-50 focus:border-rose-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 outline-none transition-all"
                  />
                  {isTranslating && <div className="absolute right-4 top-4 animate-spin">⏳</div>}
                </div>
              </div>

              {/* 步骤 3: 预览中文 (API 获取) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">3. Chinese Preview (AI Translated)</label>
                <div className="w-full bg-slate-900 rounded-2xl px-5 py-4 min-h-[56px] flex items-center">
                  <p className="text-white font-black text-lg tracking-tight">
                    {newCn || (newEn ? "Waiting for translation..." : "Type above first")}
                  </p>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!newCn || !newCategory}
              className={`w-full py-5 rounded-full font-black text-xs shadow-xl transition-all
                ${(!newCn || !newCategory) ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-rose-600 text-white active:scale-95 shadow-rose-200'}`}
            >
              SUBMIT FOR COMMUNITY REVIEW
            </button>
          </form>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}} />
    </div>
  );
};