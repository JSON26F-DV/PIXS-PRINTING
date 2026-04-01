import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  ShieldCheck, 
  CreditCard, 
  ShoppingBag,
  ExternalLink 
} from 'lucide-react';
import { 
  FiFacebook, 
  FiInstagram, 
  FiTwitter, 
  FiLinkedin 
} from 'react-icons/fi';

const Footer: React.FC = () => {
  return (
    <footer className="Footer bg-slate-50 border-t border-slate-100 pt-16 pb-8">
      <div className="FooterContainer max-w-[1440px] mx-auto px-6">
        
        <div className="FooterTop FooterGrid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* 1. Brand Section */}
          <div className="FooterBrandSection space-y-6">
            <Link to="/" className="flex items-center gap-2 group cursor-pointer w-fit">
              <div className="w-10 h-10 bg-pixs-mint flex items-center justify-center text-slate-900 font-black text-2xl rounded-2xl group-hover:scale-110 transition-transform shadow-lg shadow-pixs-mint/20">
                P
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tighter italic">PIXS <span className="text-slate-400">SHOP</span></h2>
            </Link>
            
            <p className="FooterDescription text-sm text-slate-500 leading-relaxed max-w-[320px]">
              PIXS Printing Shop is a premium printing solutions provider specializing in customized cups, eco bags, and branding materials for growing businesses.
            </p>

            <div className="FooterContactInfo space-y-3">
              <div className="flex items-center gap-3 text-slate-900 font-bold text-sm italic">
                <Phone size={16} className="text-pixs-mint" />
                <span>+63 917 123 4567</span>
              </div>
              <div className="flex items-center gap-3 text-slate-900 font-bold text-sm italic">
                <Mail size={16} className="text-pixs-mint" />
                <span>support@pixs.com</span>
              </div>
            </div>

            <div className="FooterSocialIcons flex items-center gap-4">
              <a href="#" className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-pixs-mint transition-all shadow-sm">
                <FiFacebook size={18} />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-pixs-mint transition-all shadow-sm">
                <FiInstagram size={18} />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-pixs-mint transition-all shadow-sm">
                <FiLinkedin size={18} />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-pixs-mint transition-all shadow-sm">
                <FiTwitter size={18} />
              </a>
            </div>
          </div>

          {/* 2. Explore Links Section */}
          <div className="FooterLinksSection space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[4px] text-slate-900 italic opacity-50">Explore Node</h3>
            <div className="flex flex-col gap-3">
              <Link to="/" className="FooterLink text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors italic">Home</Link>
              <Link to="/products" className="FooterLink text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors italic">Products</Link>
              <Link to="/screenplate" className="FooterLink text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors italic">Screenplate</Link>
              <Link to="/store" className="FooterLink text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors italic">Store</Link>
              <Link to="/deals" className="FooterLink text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors italic">Deals</Link>
              <Link to="/merchants" className="FooterLink text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors italic">Partner Merchants</Link>
            </div>
          </div>

          {/* 3. Support Section */}
          <div className="FooterSupportSection space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[4px] text-slate-900 italic opacity-50">Support Terminal</h3>
            <div className="flex flex-col gap-3">
              <Link to="/help" className="FooterLink text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors italic">Help & Support</Link>
              <Link to="/contact" className="FooterLink text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors italic">Contact Us</Link>
              <Link to="/settings?section=policies#privacy" className="FooterLink text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors italic">Privacy Policy</Link>
              <Link to="/settings?section=policies#terms" className="FooterLink text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors italic">Terms & Conditions</Link>
              <Link to="/settings?section=policies#return" className="FooterLink text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors italic">Return & Refund Policy</Link>
              <Link to="/careers" className="FooterLink text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors italic">Careers</Link>
            </div>
          </div>

          {/* 4. QR and Badges Section */}
          <div className="FooterQRSection space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[4px] text-slate-900 italic opacity-50">Identity Node</h3>
            
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">Scan to Access PIXS</p>
              <div className="FooterQRCodePlaceholder w-32 h-32 bg-white border border-slate-100 rounded-2xl p-2 shadow-sm flex items-center justify-center group cursor-pointer overflow-hidden">
                <div className="w-full h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-pixs-mint/10 group-hover:border-pixs-mint/30 transition-all">
                  <ExternalLink size={24} />
                </div>
              </div>
            </div>

            <div className="FooterSecurityBadges space-y-4 pt-2">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">Verification Node</p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
                   <ShieldCheck size={14} className="text-pixs-mint" />
                   <span className="text-[9px] font-black uppercase tracking-tighter text-slate-900">DTI REGISTERED</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
                   <CreditCard size={14} className="text-pixs-mint" />
                   <span className="text-[9px] font-black uppercase tracking-tighter text-slate-900">PCI COMPLIANCE</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
                   <ShoppingBag size={14} className="text-pixs-mint" />
                   <span className="text-[9px] font-black uppercase tracking-tighter text-slate-900">SECURE PAYMENT</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer Bottom */}
        <div className="FooterBottom border-t border-slate-200/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            © 2026 PIXS Printing Shop. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/settings?section=policies#privacy" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest italic">Privacy</Link>
            <Link to="/settings?section=policies#terms" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest italic">Terms</Link>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">PHILIPPINES</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
