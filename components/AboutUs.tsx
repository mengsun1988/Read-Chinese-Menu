
import React from 'react';

export const AboutUs: React.FC = () => {
  return (
    <section className="bg-white rounded-[2.5rem] p-12 md:p-20 shadow-xl border border-slate-50 text-center relative overflow-hidden group">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-rose-600 rounded-full"></div>
      
      <div className="relative z-10 space-y-8">
        <div className="inline-block px-4 py-1 border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Our Mission
        </div>
        
        <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
          Bridging the <span className="text-rose-600">Language of Flavor</span>
        </h3>
        
        <div className="max-w-2xl mx-auto space-y-6">
          <p className="text-slate-600 text-lg md:text-xl font-medium leading-relaxed italic">
            "The best flavors in the world are often hidden behind a language barrier. We built this tool to help international travelers explore the rich tapestry of Chinese food culture with confidence, curiosity, and safety."
          </p>
          
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider leading-relaxed">
            We are a team of foodies and travelers dedicated to helping global explorers enjoy authentic Chinese cuisine without the stress of translation.
          </p>
        </div>
        
        <div className="flex justify-center items-center gap-10 pt-6">
           <div className="text-center">
             <div className="text-2xl font-black text-slate-900">12k+</div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dishes Decoded</div>
           </div>
           <div className="h-10 w-px bg-slate-100"></div>
           <div className="text-center">
             <div className="text-2xl font-black text-slate-900">50+</div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Regions Covered</div>
           </div>
        </div>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute -bottom-10 -right-10 text-9xl font-black text-slate-50 chinese-font select-none pointer-events-none group-hover:text-rose-50 transition-colors">
        食
      </div>
    </section>
  );
};
