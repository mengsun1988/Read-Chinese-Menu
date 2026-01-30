import React from 'react';
import { useTranslation } from 'react-i18next';

export const AboutUs: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-white rounded-[3rem] p-10 md:p-16 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100/50 text-center relative overflow-hidden group mx-auto max-w-xl lg:max-w-4xl">
      {/* 顶部装饰条 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-rose-600/80 rounded-full"></div>
      
      <div className="relative z-10 space-y-8">
        {/* 顶部小标签 */}
        <div className="inline-block px-4 py-1 bg-slate-50 border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
          {t('home.ourVision')}
        </div>
        
        {/* 标题区：Logo 英文硬编码 */}
        <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-tight px-2">
          {t('home.moreThanReading')} <br className="md:hidden" />
          <span className="text-rose-600 inline-block mt-1 md:mt-0">Read Chinese Menu</span>
        </h3>
        
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-6">
            {/* 引用语 */}
            <p className="text-slate-600 text-sm md:text-lg font-medium leading-relaxed italic opacity-90 px-4 md:px-0">
              "{t('home.visionQuote')}"
            </p>
            
            {/* 底部寄语 */}
            <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] leading-loose max-w-lg mx-auto border-t border-slate-50 pt-6">
              {t('home.visionFooter')}
            </p>
          </div>
        </div>
        
        {/* 统计数据 */}
        <div className="flex justify-center items-center gap-12 pt-6">
            <div className="text-center group/stat">
              <div className="text-2xl md:text-3xl font-black text-slate-900 leading-none group-hover/stat:text-rose-600 transition-colors">12k+</div>
              <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mt-2">
                {t('home.dishesDecoded')}
              </div>
            </div>
            
            <div className="h-8 w-px bg-slate-100 rotate-12"></div>
            
            <div className="text-center group/stat">
              <div className="text-2xl md:text-3xl font-black text-slate-900 leading-none group-hover/stat:text-rose-600 transition-colors">50+</div>
              <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mt-2">
                {t('home.regionsCovered')}
              </div>
            </div>
        </div>
      </div>
      
      {/* 装饰水印 - 保持原位 */}
      <div className="absolute -bottom-4 -right-4 text-8xl font-black text-slate-50/50 select-none pointer-events-none group-hover:text-rose-50/80 transition-all duration-700 group-hover:scale-110 group-hover:-rotate-12">
        食
      </div>
    </section>
  );
};