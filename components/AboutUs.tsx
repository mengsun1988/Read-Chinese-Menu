import React from 'react';
import { useTranslation } from 'react-i18next';

export const AboutUs: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-white rounded-[2.5rem] p-10 md:p-14 shadow-xl border border-slate-50 text-center relative overflow-hidden group">
      {/* 顶部装饰条 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-rose-600 rounded-full"></div>
      
      <div className="relative z-10 space-y-6">
        <div className="inline-block px-3 py-0.5 border border-slate-100 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
          {t('home.ourVision')}
        </div>
        
        <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-tight">
          {t('home.moreThanReading')} <span className="text-rose-600">{t('home.pageTitle')}</span>
        </h3>
        
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="space-y-4">
            {/* 尝试调用 visionQuote，如果没加这个 Key，则回退显示 refundBridge */}
            <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed italic opacity-90">
              "{t('home.visionQuote')}"
            </p>
            
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] leading-relaxed max-w-lg mx-auto border-t border-slate-50 pt-4">
              {t('home.visionFooter')}
            </p>
          </div>
        </div>
        
        {/* 统计数据 */}
        <div className="flex justify-center items-center gap-8 pt-4">
            <div className="text-center">
              <div className="text-xl font-black text-slate-900 leading-none">12k+</div>
              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {t('home.dishesDecoded')}
              </div>
            </div>
            <div className="h-6 w-px bg-slate-100"></div>
            <div className="text-center">
              <div className="text-xl font-black text-slate-900 leading-none">50+</div>
              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {t('home.regionsCovered')}
              </div>
            </div>
        </div>
      </div>
      
      {/* 装饰水印 */}
      <div className="absolute -bottom-6 -right-6 text-7xl font-bold text-slate-50 select-none pointer-events-none group-hover:text-rose-50 transition-colors">
        食
      </div>
    </section>
  );
};