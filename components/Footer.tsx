import React from 'react';

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
  const currentYear = new Date().getFullYear();

  return (
    /* 外层容器负责全屏深色背景 */
    <footer className="w-full bg-slate-900 overflow-hidden">
      
      <div className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          
          {/* Brand Column - 已修正 Mission 文本大小和重叠问题 */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold tracking-tighter text-white">
              Read <span className="text-rose-500">Chinese Menu</span>
            </h3>
            <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-[240px]">
              Bridging cultures through flavors. Our mission is to make authentic Chinese dining accessible to everyone, everywhere.
            </p>
          </div>

          {/* Tools Column */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Core Tools</h4>
            <nav className="flex flex-col gap-3">
              <button 
                onClick={onMenuScan} 
                className="text-left text-sm font-semibold text-slate-300 hover:text-rose-500 transition-colors"
              >
                Menu Scanner
              </button>
              <button 
                onClick={onStreetScan} 
                className="text-left text-sm font-semibold text-slate-300 hover:text-rose-500 transition-colors"
              >
                Storefront Explorer
              </button>
              <button 
                onClick={onSurvivalOpen} 
                className="text-left text-sm font-semibold text-slate-300 hover:text-rose-500 transition-colors"
              >
                Essential Phrases
              </button>
              <button 
                onClick={onPricing} 
                className="text-left text-sm font-semibold text-slate-300 hover:text-rose-500 transition-colors"
              >
                Premium Plans
              </button>
            </nav>
          </div>

          {/* Legal Column */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Legal & Support</h4>
            <nav className="flex flex-col gap-3">
              <button onClick={onPrivacy} className="text-left text-sm font-semibold text-slate-300 hover:text-rose-500 transition-colors">Privacy Policy</button>
              <button onClick={onTos} className="text-left text-sm font-semibold text-slate-300 hover:text-rose-500 transition-colors">Terms of Service</button>
              <a href="mailto:info@readchinesemenu.com" className="text-left text-sm font-semibold text-slate-300 hover:text-rose-500 transition-colors">Contact Us</a>
            </nav>
          </div>

          {/* Contact Column */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Get in Touch</h4>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Official Inquiries</p>
              <a href="mailto:info@readchinesemenu.com" className="text-sm text-slate-400 hover:text-rose-500 transition-colors">info@readchinesemenu.com</a>
            </div>
            <p className="text-[10px] text-slate-500 font-medium italic">Based in Global Flavors HQ.</p>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="max-w-6xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em]">
            © {currentYear} Read Chinese Menu. All Rights Reserved.
          </p>
          <div className="flex gap-6">
             <span className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.4em]">Made for Explorers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};