import React from 'react';
import { useTranslation } from 'react-i18next';

interface FooterProps {
  onMenuScan: () => void;
  onStreetScan: () => void;
  onSurvivalOpen: () => void;
  onPricing: () => void;
  onPrivacy: () => void;
  onTos: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onMenuScan, 
  onStreetScan, 
  onSurvivalOpen,
  onPricing, 
  onPrivacy, 
  onTos 
}) => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-900 overflow-hidden">
      <div className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold tracking-tighter text-white">
              {t('home.pageTitle')}
            </h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs">
              {t('common.yourChinaTravelMate')} - {t('home.understandMenus')}
            </p>
          </div>

          {/* Tools Column */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">{t('common.menuScanner')}</h4>
            <nav className="flex flex-col gap-3">
              {/* 🆕 新增：How to Use 链接 */}
              <button 
                onClick={() => window.location.href = '/intro.html'} 
                className="text-left text-sm font-semibold text-slate-300 hover:text-rose-500 transition-colors"
              >
                {t('common.howToUse') || 'How to Use'}
              </button>
              
              <button onClick={onMenuScan} className="text-left text-sm font-semibold text-slate-300 hover:text-rose-500 transition-colors">
                {t('common.menuScanner')}
              </button>
              <button onClick={onStreetScan} className="text-left text-sm font-semibold text-slate-300 hover:text-rose-500 transition-colors">
                {t('common.storefrontExplorer')}
              </button>
              <button onClick={onSurvivalOpen} className="text-left text-sm font-semibold text-slate-300 hover:text-rose-500 transition-colors">
                {t('common.essentialPhrases')}
              </button>
              <button onClick={onPricing} className="text-left text-sm font-semibold text-slate-300 hover:text-rose-500 transition-colors">
                {t('common.premiumPlans')}
              </button>
            </nav>
          </div>

          {/* Legal Column */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Legal</h4>
            <nav className="flex flex-col gap-3">
              <button onClick={onPrivacy} className="text-left text-sm font-semibold text-slate-300 hover:text-rose-500 transition-colors">{t('common.privacyPolicy')}</button>
              <button onClick={onTos} className="text-left text-sm font-semibold text-slate-300 hover:text-rose-500 transition-colors">{t('common.termsOfService')}</button>
              <a href="mailto:info@readchinesemenu.com" className="text-left text-sm font-semibold text-slate-300 hover:text-rose-500 transition-colors">{t('common.contactUs')}</a>
            </nav>
          </div>

          {/* Contact Column */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">{t('common.stayConnected')}</h4>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">{t('common.officialInquiries')}</p>
              <a href="mailto:info@readchinesemenu.com" className="text-sm text-slate-400 hover:text-rose-500 transition-colors">info@readchinesemenu.com</a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-6xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em]">
            © {currentYear} {t('home.pageTitle')}. {t('common.allRightsReserved')}
          </p>
          <div className="flex gap-6">
             <span className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.4em]">{t('common.madeForExplorers')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};