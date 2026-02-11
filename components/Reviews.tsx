import React, { useState } from 'react';
import { FeedbackType } from '../types';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
// 修正路径
import posts from '../src/data/posts.json'; 

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

export const Reviews: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [comment, setComment] = useState("");
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('EXPERIENCE');

  const featuredPost = posts && posts.length > 0 ? posts[0] : null;

  const handleGoToBlog = (postId?: string) => {
    const params = new URLSearchParams(location.search);
    const lang = params.get('lang');
    const path = postId ? `/blog/${postId}` : '/blog';
    navigate(lang ? `${path}?lang=${lang}` : path);
  };

  const REVIEWS = [
    { ...t('reviews.list.rev1', { returnObjects: true }), rating: 5, avatar: "🎒" },
    { ...t('reviews.list.rev2', { returnObjects: true }), rating: 5, avatar: "🥘" },
    { ...t('reviews.list.rev3', { returnObjects: true }), rating: 4, avatar: "🇮🇹" }
  ];

  const handleSendEmail = () => {
    if (!comment.trim()) return;
    const labels: Record<FeedbackType, string> = {
      'EXPERIENCE': t('reviews.review'), 'IMPROVEMENT': t('reviews.suggestions'), 'STORY': t('reviews.story')
    };
    const subject = encodeURIComponent(`[${labels[feedbackType]}] Read Chinese Menu Feedback`);
    const body = encodeURIComponent(comment);
    window.location.href = `mailto:feedback@readchinesemenu.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="w-full max-w-full overflow-hidden flex flex-col gap-24">
      
      {/* 1. Review 滑动区域 (保持顶部) */}
      <section className="relative w-full">
        <div className="flex flex-row overflow-x-auto gap-4 no-scrollbar snap-x snap-mandatory px-12 -mx-8 py-10 -my-10">
          <div className="shrink-0 w-1 md:hidden" />
          {REVIEWS.map((rev: any, i) => (
            <div key={i} className="w-[280px] md:w-[360px] bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] shrink-0 snap-center flex flex-col justify-between transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:border-rose-100 group">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg transition-transform group-hover:rotate-12">{rev.avatar}</div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{rev.name}</h4>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{rev.role}</p>
                  </div>
                </div>
                <div className="h-px w-8 bg-rose-100 mb-6 transition-all group-hover:w-12" />
                <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6 italic">"{rev.text}"</p>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className={`text-xs transition-colors duration-500 ${j < rev.rating ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>
                ))}
              </div>
            </div>
          ))}
          <div className="shrink-0 w-1 md:hidden" />
        </div>
      </section>

      {/* 2. 博客独立板块 (位于 Review 和 Feedback 之间) */}
      <section className="px-4">
        <div className="max-w-6xl mx-auto bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row items-stretch transition-all hover:shadow-md">
          {/* 左侧：封面图 */}
          <div className="w-full md:w-5/12 h-64 md:h-auto relative overflow-hidden bg-slate-100">
            <img 
              src={featuredPost?.image || "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80"} 
              alt="Dish Story" 
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
            />
            <div className="absolute top-6 left-6 bg-rose-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg">
              New Story
            </div>
          </div>

          {/* 右侧：内容区 */}
          <div className="w-full md:w-7/12 p-10 md:p-14 flex flex-col justify-center text-left space-y-6">
            <div className="space-y-3">
              <span className="text-rose-500 font-bold text-[10px] uppercase tracking-[0.3em]">Foodie Blog</span>
              <h2 className="text-2xl md:text-4xl font-bold text-slate-900 leading-[1.15]">
                {featuredPost?.title || "Unlock the Secrets of Chinese Dishes"}
              </h2>
              <p className="text-slate-500 text-sm md:text-base leading-relaxed line-clamp-2">
                {featuredPost?.excerpt || "Ever wondered about the history of Kung Pao Chicken? Discover authentic stories and tips for your next meal."}
              </p>
            </div>
            
            <div className="flex items-center gap-6 pt-2">
              <button 
                onClick={() => handleGoToBlog(featuredPost?.id)}
                className="bg-slate-900 hover:bg-rose-600 text-white font-bold py-4 px-10 rounded-2xl transition-all active:scale-95 text-[11px] uppercase tracking-widest shadow-xl shadow-slate-900/10"
              >
                Start Reading
              </button>
              <button 
                onClick={() => handleGoToBlog()}
                className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-[11px] uppercase tracking-widest transition-colors"
              >
                All Articles <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Feedback Card (底部) */}
      <section className="w-full bg-slate-900 p-10 md:p-16 rounded-[3rem] text-center space-y-8 border border-white/10 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <h3 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">{t('reviews.enjoyExperience')}</h3>
          <p className="text-slate-400 font-medium uppercase tracking-[0.2em] text-[10px]">{t('reviews.leaveFeedback')}</p>
        </div>

        <div className="max-w-xl mx-auto space-y-6 relative z-10">
          <div className="flex flex-wrap justify-center gap-2">
            {[{ id: 'EXPERIENCE', label: t('reviews.review') }, { id: 'IMPROVEMENT', label: t('reviews.suggestions') }, { id: 'STORY', label: t('reviews.story') }].map((cat) => (
              <button key={cat.id} onClick={() => setFeedbackType(cat.id as FeedbackType)} className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${feedbackType === cat.id ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}>
                {cat.label}
              </button>
            ))}
          </div>

          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('reviews.tellUs')} className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-white placeholder:text-white/20 focus:outline-none focus:border-rose-500/50 transition-all min-h-[140px] resize-none font-medium text-sm" />

          <button onClick={handleSendEmail} disabled={!comment.trim()} className="group bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:hover:bg-rose-600 text-white font-bold py-4 px-10 rounded-2xl transition-all active:scale-95 text-base flex items-center justify-center gap-3 mx-auto shadow-xl shadow-rose-600/20">
            <span>{t('reviews.sendEmail')}</span>
            <div className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"><SendIcon /></div>
          </button>
        </div>
        <div className="absolute -bottom-6 -right-6 text-8xl font-black text-white/[0.02] select-none pointer-events-none uppercase italic">Feedback</div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};