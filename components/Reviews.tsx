import React, { useState } from 'react';
import { FeedbackType } from '../types';

const REVIEWS = [
  {
    name: "Alex",
    role: "Digital Nomad",
    text: "Literally a lifesaver in Chengdu. I could finally order something other than fried rice!",
    rating: 5,
    avatar: "🎒"
  },
  {
    name: "Sarah",
    role: "Food Blogger",
    text: "The allergen detection is what impressed me most. It found peanuts in a dish I usually think is safe.",
    rating: 5,
    avatar: "🥘"
  },
  {
    name: "Marco",
    role: "Backpacker",
    text: "The 'Speak to Waiter' feature is genius. No more awkward pointing and guessing.",
    rating: 4,
    avatar: "🇮🇹"
  }
];

export const Reviews: React.FC = () => {
  const [comment, setComment] = useState("");
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('EXPERIENCE');

  const handleSendEmail = () => {
    if (!comment.trim()) return;
    const typeLabel = feedbackType === 'EXPERIENCE' ? 'Review' : feedbackType === 'IMPROVEMENT' ? 'Suggestions' : 'Story';
    const subject = encodeURIComponent(`[${typeLabel}] Read Chinese Menu Feedback`);
    const body = encodeURIComponent(comment);
    window.location.href = `mailto:feedback@readchinesemenu.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-16">
      {/* 1. Review 滑动区域 */}
      <div className="relative w-full">
        <div 
          // 关键点：-mx-8 配合 px-12 确保首尾卡片露边，且滑动区域撑满
          className="flex flex-row overflow-x-auto gap-2 no-scrollbar snap-x snap-mandatory px-12 -mx-8 py-10 -my-10"
        >
          {/* 这里的空白占位符能帮助首张卡片更好地对齐 */}
          <div className="shrink-0 w-2 md:hidden" />
          
          {REVIEWS.map((rev, i) => (
            <div 
              key={i} 
              // w-[280px]：稍微收窄，确保右侧卡片露出。
              // transition + active:scale：增加点击时的反馈。
              className="w-[280px] md:w-[360px] bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] shrink-0 snap-center flex flex-col justify-between transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:border-rose-100 group"
            >
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg transition-transform group-hover:rotate-12">
                    {rev.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{rev.name}</h4>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{rev.role}</p>
                  </div>
                </div>
                <div className="h-px w-8 bg-rose-100 mb-6 transition-all group-hover:w-12" />
                <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6 italic">
                  "{rev.text}"
                </p>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className={`text-xs transition-colors duration-500 ${j < rev.rating ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>
                ))}
              </div>
            </div>
          ))}
          
          <div className="shrink-0 w-2 md:hidden" />
        </div>
      </div>

      {/* 2. Feedback Card */}
      <div className="w-full bg-slate-900 p-10 md:p-16 rounded-[3rem] text-center space-y-8 border border-white/10 relative overflow-hidden">
        <div className="space-y-2">
          <h3 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">Enjoying the Experience?</h3>
          <p className="text-slate-400 font-medium uppercase tracking-[0.2em] text-[10px]">Leave your feedback or share your story</p>
        </div>
        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { id: 'EXPERIENCE', label: 'Review' },
              { id: 'IMPROVEMENT', label: 'Suggestions' },
              { id: 'STORY', label: 'Story' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFeedbackType(cat.id as FeedbackType)}
                className={`px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all ${
                  feedbackType === cat.id ? 'bg-rose-600 text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <textarea 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what you think..."
            className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-white placeholder:text-white/20 focus:outline-none focus:border-rose-500/50 transition-all min-h-[120px] resize-none font-medium text-sm"
          />
          <button 
            onClick={handleSendEmail} 
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-4 px-12 rounded-2xl transition-all active:scale-95 text-lg flex items-center justify-center gap-3 mx-auto shadow-lg"
          >
            <span>Send via Email</span>
          </button>
        </div>
        <div className="absolute -bottom-6 -right-6 text-8xl font-bold text-white/[0.03] select-none pointer-events-none uppercase">
          Feedback
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};