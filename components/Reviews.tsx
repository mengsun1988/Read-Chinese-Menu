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
    const typeLabel = feedbackType === 'EXPERIENCE' ? 'Website Experience' : feedbackType === 'IMPROVEMENT' ? 'Suggestions for Improvement' : 'Travel Food Story';
    const subject = encodeURIComponent(`[${typeLabel}] Read Chinese Menu Feedback`);
    const body = encodeURIComponent(comment);
    window.location.href = `mailto:feedback@readchinesemenu.com?subject=${subject}&body=${body}`;
  };

  return (
    <section className="space-y-16">
      <div className="space-y-10">
        <div className="flex items-center gap-6">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight shrink-0 uppercase">Gourmet Feed</h3>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((rev, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:border-rose-100 transition-colors group">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                  {rev.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{rev.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rev.role}</p>
                </div>
              </div>
              
              <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6 italic">
                "{rev.text}"
              </p>
              
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className={`text-xs ${j < rev.rating ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leave a Comment Section */}
      <div className="bg-slate-900 p-10 md:p-16 rounded-[3rem] text-center space-y-8 shadow-2xl border border-white/5">
        <div className="space-y-2">
          <h3 className="text-3xl font-black text-white tracking-tight">Enjoying the Experience?</h3>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Leave your feedback or share your story</p>
        </div>

        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { id: 'EXPERIENCE', label: 'Website Review' },
              { id: 'IMPROVEMENT', label: 'Suggestions' },
              { id: 'STORY', label: 'Travel Story' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFeedbackType(cat.id as FeedbackType)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  feedbackType === cat.id 
                    ? 'bg-rose-600 text-white shadow-lg' 
                    : 'bg-white/10 text-white/50 hover:bg-white/20'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <textarea 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              feedbackType === 'EXPERIENCE' ? "How's the app working for you?" :
              feedbackType === 'IMPROVEMENT' ? "What features would you like to see?" :
              "Tell us about a hidden gem you found in China!"
            }
            className="w-full bg-white/10 border border-white/10 rounded-[2rem] p-6 text-white placeholder:text-white/20 focus:outline-none focus:border-rose-500 transition-all min-h-[120px] resize-none font-medium"
          />
          
          <button 
            onClick={handleSendEmail}
            className="bg-rose-600 hover:bg-rose-700 text-white font-black py-4 px-12 rounded-2xl transition-all active:scale-95 shadow-xl text-lg flex items-center justify-center gap-3 mx-auto"
          >
            <span>Send via Email</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.896 28.896 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.289Z" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};