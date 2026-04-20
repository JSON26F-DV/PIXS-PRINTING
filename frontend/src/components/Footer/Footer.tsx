import React from 'react'
import { Link } from 'react-router-dom'
import {
  Phone,
  Mail,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react'
import { FiFacebook, FiInstagram, FiTwitter, FiLinkedin } from 'react-icons/fi'

const Footer: React.FC = () => {
  return (
    <footer className="Footer border-t border-slate-100 bg-slate-50 pt-16 pb-8 w-screen">
      <div className="FooterContainer mx-auto max-w-[1440px] px-6">
        <div className="FooterTop FooterGrid mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* 1. Brand Section */}
          <div className="FooterBrandSection space-y-6">
            <Link
              to="/"
              className="group flex w-fit cursor-pointer items-center gap-2"
            >
              <div className="bg-pixs-mint shadow-pixs-mint/20 flex h-10 w-10 items-center justify-center rounded-2xl text-2xl font-black text-slate-900 shadow-lg transition-transform group-hover:scale-110">
                P
              </div>
              <h2 className="text-xl font-black tracking-tighter text-slate-900 italic">
                PIXS <span className="text-slate-400">SHOP</span>
              </h2>
            </Link>

            <p className="FooterDescription max-w-[320px] text-sm leading-relaxed text-slate-500">
              PIXS Printing Shop is a premium printing solutions provider
              specializing in customized cups, eco bags, and branding materials
              for growing businesses.
            </p>

            <div className="FooterContactInfo space-y-3">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-900 italic">
                <Phone size={16} className="text-pixs-mint" />
                <span>+63 917 123 4567</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-slate-900 italic">
                <Mail size={16} className="text-pixs-mint" />
                <span>support@pixs.com</span>
              </div>
            </div>

            <div className="FooterSocialIcons flex items-center gap-4">
              <a
                href="#"
                className="hover:text-pixs-mint flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 shadow-sm transition-all hover:bg-slate-900"
              >
                <FiFacebook size={18} />
              </a>
              <a
                href="#"
                className="hover:text-pixs-mint flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 shadow-sm transition-all hover:bg-slate-900"
              >
                <FiInstagram size={18} />
              </a>
              <a
                href="#"
                className="hover:text-pixs-mint flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 shadow-sm transition-all hover:bg-slate-900"
              >
                <FiLinkedin size={18} />
              </a>
              <a
                href="#"
                className="hover:text-pixs-mint flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 shadow-sm transition-all hover:bg-slate-900"
              >
                <FiTwitter size={18} />
              </a>
            </div>
          </div>

          {/* 2. Explore Links Section */}
          <div className="FooterLinksSection space-y-6">
            <h3 className="text-[10px] font-black tracking-[4px] text-slate-900 uppercase italic opacity-50">
              Explore Node
            </h3>
            <div className="flex flex-col gap-3">
              <Link
                to="/"
                className="FooterLink text-sm font-bold text-slate-500 italic transition-colors hover:text-slate-900"
              >
                Home
              </Link>
              <Link
                to="/products"
                className="FooterLink text-sm font-bold text-slate-500 italic transition-colors hover:text-slate-900"
              >
                Products
              </Link>
              <Link
                to="/screenplate"
                className="FooterLink text-sm font-bold text-slate-500 italic transition-colors hover:text-slate-900"
              >
                Screenplate
              </Link>
              <Link
                to="/store"
                className="FooterLink text-sm font-bold text-slate-500 italic transition-colors hover:text-slate-900"
              >
                Store
              </Link>
              <Link
                to="/deals"
                className="FooterLink text-sm font-bold text-slate-500 italic transition-colors hover:text-slate-900"
              >
                Deals
              </Link>
              <Link
                to="/merchants"
                className="FooterLink text-sm font-bold text-slate-500 italic transition-colors hover:text-slate-900"
              >
                Partner Merchants
              </Link>
            </div>
          </div>

          {/* 3. Support Section */}
          <div className="FooterSupportSection space-y-6">
            <h3 className="text-[10px] font-black tracking-[4px] text-slate-900 uppercase italic opacity-50">
              Support Terminal
            </h3>
            <div className="flex flex-col gap-3">
              <Link
                to="/help"
                className="FooterLink text-sm font-bold text-slate-500 italic transition-colors hover:text-slate-900"
              >
                Help & Support
              </Link>
              <Link
                to="/contact"
                className="FooterLink text-sm font-bold text-slate-500 italic transition-colors hover:text-slate-900"
              >
                Contact Us
              </Link>
              <Link
                to="/settings?section=policies#privacy"
                className="FooterLink text-sm font-bold text-slate-500 italic transition-colors hover:text-slate-900"
              >
                Privacy Policy
              </Link>
              <Link
                to="/settings?section=policies#terms"
                className="FooterLink text-sm font-bold text-slate-500 italic transition-colors hover:text-slate-900"
              >
                Terms & Conditions
              </Link>
              <Link
                to="/settings?section=policies#return"
                className="FooterLink text-sm font-bold text-slate-500 italic transition-colors hover:text-slate-900"
              >
                Return & Refund Policy
              </Link>
              <Link
                to="/careers"
                className="FooterLink text-sm font-bold text-slate-500 italic transition-colors hover:text-slate-900"
              >
                Careers
              </Link>
            </div>
          </div>

          {/* 4. QR and Badges Section */}
          <div className="FooterQRSection space-y-6">
            <h3 className="text-[10px] font-black tracking-[4px] text-slate-900 uppercase italic opacity-50">
              Identity Node
            </h3>

            <div className="space-y-4">
              <p className="text-[10px] font-black tracking-widest text-slate-900 uppercase italic">
                Scan to Access PIXS
              </p>
              <div className="FooterQRCodePlaceholder group flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
                <div className="group-hover:bg-pixs-mint/10 group-hover:border-pixs-mint/30 flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-300 transition-all">
                  <ExternalLink size={24} />
                </div>
              </div>
            </div>

            <div className="FooterSecurityBadges space-y-4 pt-2">
              <p className="text-[10px] font-black tracking-widest text-slate-900 uppercase italic">
                Verification Node
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-sm">
                  <ShieldCheck size={14} className="text-pixs-mint" />
                  <span className="text-[9px] font-black tracking-tighter text-slate-900 uppercase">
                    DTI REGISTERED
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-sm">
                  <CreditCard size={14} className="text-pixs-mint" />
                  <span className="text-[9px] font-black tracking-tighter text-slate-900 uppercase">
                    PCI COMPLIANCE
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-sm">
                  <ShoppingBag size={14} className="text-pixs-mint" />
                  <span className="text-[9px] font-black tracking-tighter text-slate-900 uppercase">
                    SECURE PAYMENT
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="FooterBottom flex flex-col items-center justify-between gap-4 border-t border-slate-200/50 pt-8 md:flex-row">
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            © 2026 PIXS Printing Shop. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/settings?section=policies#privacy"
              className="text-[10px] font-bold tracking-widest text-slate-400 uppercase italic transition-colors hover:text-slate-900"
            >
              Privacy
            </Link>
            <Link
              to="/settings?section=policies#terms"
              className="text-[10px] font-bold tracking-widest text-slate-400 uppercase italic transition-colors hover:text-slate-900"
            >
              Terms
            </Link>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase italic">
              PHILIPPINES
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
