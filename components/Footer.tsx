import React from 'react';
import { WordCloudMarquee } from './WordCloudMarquee';

interface FooterProps {
  onMenuScan: () => void;
  onStreetScan: () => void;
  onPricing: () => void;
  onPrivacy: () => void;
  onTos: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onMenuScan, 
  onStreetScan, 
  onPricing, 
  onPrivacy, 
  onTos 
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white mt-12 overflow-hidden">
      <WordCloudMarquee onItemClick={(d) => window.open(`https://www.google.com/search?q=${encodeURIComponent(d.dish_name_en! + " Chinese food")}`, '_blank')} />
      
      <div className="bg-[#fcfbf9] border-t border-slate-100 pt-16 pb-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold tracking-tighter text-slate-900">
              Read <span className="text-rose-600">Chinese Menu</span>
            </h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs">
              Bridging cultures through flavors. Our mission is to make authentic Chinese dining accessible to everyone, everywhere.
            </p>
            <div className="flex gap-4">
               {/* Social placeholders if needed */}
            </div>
          </div>

          {/* Tools Column */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Core Tools</h4>
            <nav className="flex flex-col gap-3">
              <button onClick={onMenuScan} className="text-left text-sm font-semibold text-slate-600 hover:text-rose-600 transition-colors">Menu Scanner</button>
              <button onClick={onStreetScan} className="text-left text-sm font-semibold text-slate-600 hover:text-rose-600 transition-colors">Storefront Guide</button>
              <button onClick={onPricing} className="text-left text-sm font-semibold text-slate-600 hover:text-rose-600 transition-colors">Premium Plans</button>
            </nav>
          </div>

          {/* Legal Column */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Legal & Support</h4>
            <nav className="flex flex-col gap-3">
              <button onClick={onPrivacy} className="text-left text-sm font-semibold text-slate-600 hover:text-rose-600 transition-colors">Privacy Policy</button>
              <button onClick={onTos} className="text-left text-sm font-semibold text-slate-600 hover:text-rose-600 transition-colors">Terms of Service</button>
              <a href="mailto:info@readchinesemenu.com" className="text-left text-sm font-semibold text-slate-600 hover:text-rose-600 transition-colors">Contact Us</a>
            </nav>
          </div>

          {/* Contact Column */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Get in Touch</h4>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">Official Inquiries</p>
              <a href="mailto:info@readchinesemenu.com" className="text-sm text-slate-500 hover:text-rose-600 transition-colors">info@readchinesemenu.com</a>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Based in Global Flavors HQ.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">
            © {currentYear} Read Chinese Menu. All Rights Reserved.
          </p>
          <div className="flex gap-6">
             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">Made for Explorers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
