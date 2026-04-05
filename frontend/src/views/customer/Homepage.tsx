import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Heart,
  Plus,
  Package,
  Printer,
  Cog,
  Zap,
  ChevronRight,
  Search,
  ChevronLeft,
  Layers,
  Banknote,
  ArrowUpDown,
  Activity,
  ChevronDown,
  RotateCcw,
  ArrowRight,
  X,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import { useAuth } from '../../context/AuthContext'
import productsData from '../../data/products.json'
import categoriesData from '../../data/categories.json'
import screenplateData from '../../data/screenplate.json'
import orderData from '../../data/order.json'
import { useDiscovery } from '../../context/DiscoveryContext'
import Footer from '../../components/Footer/Footer'
import type { IProduct, IScreenPlate } from '../../types/product.types'

import { FaFacebookF } from 'react-icons/fa';

// --- Interfaces ---
// Reusing central types from product.types.ts

interface ICategory {
  id: string
  label: string
  count: number
  image: string
}

interface IFilters {
  category: string
  price: string
  sort: string
  status: string
  screenplate: string
}

interface ILogo {
  name: string
  type: string
  logo: string
}

interface IFeaturedBusiness {
  id: number
  name: string
  category: string
  testimonial: string
  image: string
}

// --- Helper Components ---
const FilterDropdown: React.FC<{
  label: string
  icon: React.ElementType
  value: string
  options: string[]
  onChange: (val: string) => void
}> = ({ label, icon: Icon, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActive =
    value !== 'All' &&
    value !== 'All Prices' &&
    value !== 'All Status' &&
    value !== 'Price: Low-High'

  return (
    <div ref={dropdownRef} className="relative min-w-[140px] flex-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'MarketplaceDropdownButton flex w-full items-center justify-between rounded-2xl border px-5 py-3.5 text-[10px] font-black tracking-widest uppercase transition-all',
          isActive
            ? 'border-pixs-mint text-pixs-mint shadow-pixs-mint/5 bg-white shadow-lg'
            : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200',
        )}
      >
        <div className="flex items-center gap-2.5">
          <Icon
            size={14}
            className={clsx(isActive ? 'text-pixs-mint' : 'text-slate-300')}
          />
          <span className="truncate">
            {value === 'All' || value.includes('All') ? label : value}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={clsx(
            'transition-transform duration-300',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="MarketplaceDropdownMenu custom-scrollbar absolute top-full right-0 left-0 z-[100] mt-2 max-h-64 overflow-y-auto rounded-[24px] border border-slate-100 bg-white p-2 shadow-2xl"
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt)
                  setIsOpen(false)
                }}
                className={clsx(
                  'MarketplaceDropdownItem w-full rounded-xl px-4 py-3 text-left text-[10px] font-black tracking-widest uppercase transition-colors',
                  value === opt
                    ? 'bg-pixs-mint text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50',
                )}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const LoginModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [agreed, setAgreed] = useState(false);
  const { login } = useAuth();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        key="login-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl relative overflow-hidden flex flex-col items-center text-center"
        >
          {/* Background Decor */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-pixs-mint/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-900"
          >
            <X size={20} />
          </button>

          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-slate-200">
            <ShieldCheck className="text-pixs-mint" size={32} />
          </div>

          <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Production Portal</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Identify your terminal credentials</p>

          <div className="w-full space-y-4 mb-8">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  console.log(credentialResponse);
                  login({ id: 'CUST-SOC-001', name: 'Social User', role: 'customer' });
                  onClose();
                }}
                onError={() => console.log('Login Failed')}
              />
            </div>

            <FacebookLogin
              appId="YOUR_FACEBOOK_APP_ID"
              callback={(response) => {
                console.log(response);
                login({ id: 'CUST-SOC-002', name: 'Facebook User', role: 'customer' });
                onClose();
              }}
              render={(renderProps) => (
                <button 
                  onClick={renderProps.onClick}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-[#1877F2] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                >
                  <FaFacebookF size={16} fill="white" /> Sign in with Facebook
                </button>
              )}
            />

            <Link to="/login" className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/20">
              <Mail size={16} /> Credential Login
            </Link>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded border-slate-200 text-pixs-mint focus:ring-pixs-mint"
              />
              <span className="text-[9px] font-bold text-slate-500 uppercase text-left leading-tight">
                I agree to the <span className="text-slate-900 underline underline-offset-2">Terms of Service</span> and industrial data protocols.
              </span>
            </label>

            <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-pixs-mint transition-colors self-center">
              Forgot Access Credentials?
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const communityLogos: ILogo[] = [
  { name: 'Brew & Co.', type: 'Café', logo: 'https://images.unsplash.com/photo-1542181961-9590d0c79ca9?auto=format&fit=crop&q=80&w=200&h=200' },
  { name: 'Aesthetic Studios', type: 'Creative Agency', logo: 'https://images.unsplash.com/photo-1560159906-8d14d23253b7?auto=format&fit=crop&q=80&w=200&h=200' },
  { name: 'Urban Threads', type: 'Clothing Brand', logo: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=200&h=200' },
  { name: 'Lokal Market', type: 'Retail', logo: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&q=80&w=200&h=200' },
  { name: 'NextGen Tech', type: 'Startup', logo: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=200&h=200' },
  { name: 'Daily Grind', type: 'Roastery', logo: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=200&h=200' },
];

const featuredBusinesses: IFeaturedBusiness[] = [
  {
    id: 1,
    name: 'Macha Milk Tea House',
    category: 'Milk Tea Franchise',
    testimonial: '"PIXS has been consistently delivering premium cup prints that perfectly match our brand\'s aesthetic."',
    image: 'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 2,
    name: 'Loom & Thread',
    category: 'Local Fashion Brand',
    testimonial: '"We needed industrial-grade packaging that feels luxurious. PIXS executed our vision flawlessly with zero delays."',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 3,
    name: 'Roast Coffee Co.',
    category: 'Independent Café',
    testimonial: '"From coffee pouches to carrier bags, the print durability is unmatched. A true partner for growing cafés."',
    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800',
  }
];

const PixsCommunitySection: React.FC<{ isLoggedIn: boolean }> = ({ isLoggedIn }) => {
  return (
    <section id="pixs-community-section" className="pixs-community-wrapper px-6 md:px-16 py-24 md:py-32 bg-slate-50 relative overflow-hidden rounded-[40px] md:rounded-[80px] mx-4 md:mx-0 my-20">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-200/50 via-slate-50 to-slate-50 pointer-events-none" />
      <div className="absolute -left-40 bottom-20 w-96 h-96 bg-pixs-mint/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-20 md:space-y-32">
        
        {/* 1. Headline Block */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="pixs-community-header flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-16"
        >
          <div className="space-y-6 max-w-2xl">
            <h2 className="pixs-community-title text-5xl md:text-7xl font-black tracking-tighter text-slate-900 uppercase italic leading-[0.85]">
              Meet the <br/>
              <span className="text-pixs-mint underline decoration-pixs-mint/30 decoration-4 underline-offset-[12px]">PIXS Community</span>
            </h2>
            <p className="pixs-community-subtitle text-sm md:text-lg font-bold tracking-widest text-slate-500 uppercase">
              Brands, cafés, startups, and local businesses that trust PIXS Printing
            </p>
          </div>
          <button className="pixs-community-cta group flex items-center justify-center gap-3 bg-white border-2 border-slate-200 px-8 py-5 rounded-full text-xs font-black tracking-widest text-slate-900 uppercase hover:border-pixs-mint hover:bg-pixs-mint transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200/50 w-full md:w-max shrink-0">
            Explore Partner Stories
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* 2. Partner Logo Wall */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6"
        >
          {communityLogos.map((brand, idx) => (
            <div key={idx} className="pixs-partner-card group flex flex-col items-center justify-center p-6 md:p-8 bg-white border border-slate-100 rounded-[28px] hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2 cursor-pointer relative overflow-hidden">
               <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden mb-4 border border-slate-50 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
                 <img src={brand.logo} alt={brand.name} className="pixs-partner-logo w-full h-full object-cover" />
               </div>
               <span className="text-[10px] md:text-xs font-black text-slate-900 uppercase tracking-tight text-center">{brand.name}</span>
               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">{brand.type}</span>
            </div>
          ))}
        </motion.div>

        {/* 3. Featured Business Cards */}
        <div className="pixs-featured-grid grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
          {featuredBusinesses.map((biz, idx) => (
            <motion.div 
              key={biz.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: idx * 0.15 }}
              className={clsx(
                "pixs-feature-card group relative bg-white rounded-[40px] md:rounded-[48px] overflow-hidden border border-slate-100/50 shadow-xl shadow-slate-200/40 transition-transform duration-500",
                idx === 1 ? 'md:translate-y-8 hover:-translate-y-2 md:hover:translate-y-5' : 'hover:-translate-y-3'
              )}
            >
               <div className="pixs-feature-image relative h-48 md:h-64 overflow-hidden bg-slate-100">
                  <img src={biz.image} alt={biz.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="pixs-feature-category inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[8px] md:text-[9px] font-black text-white tracking-widest uppercase mb-2 border border-white/30">
                      {biz.category}
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tight">{biz.name}</h3>
                  </div>
               </div>
               <div className="pixs-feature-content p-8 md:p-10 space-y-6">
                 <p className="pixs-feature-testimonial text-sm text-slate-500 font-bold italic tracking-wide leading-relaxed relative before:content-['\\201C'] before:absolute before:-top-4 before:-left-2 before:text-4xl before:text-slate-200 before:font-serif">
                   {biz.testimonial.replace(/^"|"$/g, '')}
                 </p>
                 <button className="pixs-feature-link flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-widest hover:text-pixs-mint transition-colors group/btn">
                   View Case Study <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                 </button>
               </div>
            </motion.div>
          ))}
        </div>

        {/* 4. Industrial CTA Hub (Conditional) */}
        {!isLoggedIn && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="pixs-growth-wrapper bg-slate-900 rounded-[40px] md:rounded-[64px] p-12 md:p-20 text-center relative overflow-hidden flex flex-col items-center justify-center border border-slate-800"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pixs-mint/10 via-transparent to-transparent opacity-80" />
            
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h3 className="pixs-growth-title text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-[0.9]">
                Let's grow your brand <br className="hidden md:block"/>
                <span className="text-pixs-mint">through print.</span>
              </h3>
              <p className="pixs-growth-description text-sm md:text-base font-bold text-slate-400 uppercase tracking-widest max-w-xl mx-auto">
                Join hundreds of businesses that scale their physical presence with our industrial-grade output nodes. 
              </p>
              <div className="pixs-growth-buttons flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 pt-6">
                <button className="w-full sm:w-auto bg-pixs-mint px-10 py-5 rounded-[24px] text-xs font-black text-slate-900 uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-pixs-mint/20">
                  Start Printing With PIXS
                </button>
                <button className="w-full sm:w-auto bg-transparent border-2 border-slate-700 hover:border-white px-10 py-5 rounded-[24px] text-xs font-black text-white uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all">
                  Request Quotation
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}

const Homepage : React.FC = () => {
  const { user } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0)
  const [favorites, setFavorites] = useState<string[]>(() => {
    // Initializing from terminal storage
    const saved = localStorage.getItem('pixs_favorites')
    return saved ? JSON.parse(saved) : []
  })
  const { openDiscovery } = useDiscovery()

  const checkAuthAndRun = (action: () => void) => {
    if (!user.isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    action();
  };

  // ─── Protocol Reset Protocol ───────────────────────────────────────────
  useEffect(() => {
    // Cleanup any existing configuration drafts to ensure a fresh journey
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('pixs_draft_')) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  // ─── Data Nodes Discovery ───────────────────────────────────────────────
  const soldMap = useMemo(() => {
    const map: Record<string, number> = {};
    (orderData as { products: { productId: string; quantity: number }[] }[]).forEach(order => {
      order.products?.forEach(p => {
        if (p.productId) {
          map[p.productId] = (map[p.productId] || 0) + (p.quantity || 0);
        }
      });
    });
    return map;
  }, []);

  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<IFilters>({
    category: 'All',
    price: 'All Prices',
    sort: 'Price: Low-High',
    status: 'All Status',
    screenplate: 'All Plates',
  })

  // Meta Filters
  const [showMostSold, setShowMostSold] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  
  // ─── Responsive Matrix ──────────────────────────────────────────────────
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      setCurrentPage(1)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const itemsPerPage = windowWidth < 768 ? 10 : 20
  const marketplaceRef = useRef<HTMLDivElement>(null)

  const heroImages = [
    {
      url: 'https://images.unsplash.com/photo-1550572017-eddf77227ae1?auto=format&fit=crop&q=80',
      title: 'Professional Printing for Every Surface',
      subtitle: 'From cylindrical cups to flat boxes, we print it all.',
    },
    {
      url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80',
      title: 'Global Milktea Packaging Node',
      subtitle: 'Bulk orders starting at 500pcs with premium ink quality.',
    },
  ]

  const quickCategories = (categoriesData as ICategory[]).slice(0, 4)

  const categories = [
    'All',
    ...(categoriesData as ICategory[]).map((c) => c.label),
  ]
  const priceRanges = [
    'All Prices',
    'Under ₱100',
    '₱100-₱500',
    '₱500-₱1k',
    '₱1k+',
  ]
  const sortOptions = ['A to Z', 'Z to A', 'Price: Low-High', 'Price: High-Low']
  const statusOptions = ['All Status', 'In Stock', 'Low Stock', 'Out of Stock']
  const plateOptions = [
    'All Plates',
    ...(screenplateData as IScreenPlate[]).map((p) => p.plate_name),
  ]

  // Logic Engine: Chained Filtering & Sorting
  const filteredProducts = useMemo(() => {
    return (productsData as IProduct[])
      .filter((p) => {
        // 1. Category
        const matchCategory =
          filters.category === 'All' || p.category.includes(filters.category)

        // 2. Search
        const matchSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.id.toLowerCase().includes(searchQuery.toLowerCase())

        // 3. Price
        let matchPrice = true
        if (filters.price === 'Under ₱100') matchPrice = p.base_price < 100
        else if (filters.price === '₱100-₱500')
          matchPrice = p.base_price >= 100 && p.base_price <= 500
        else if (filters.price === '₱500-₱1k')
          matchPrice = p.base_price >= 500 && p.base_price <= 1000
        else if (filters.price === '₱1k+') matchPrice = p.base_price > 1000

        // 4. Status
        let matchStatus = true
        if (filters.status === 'In Stock') matchStatus = p.current_stock > 50
        else if (filters.status === 'Low Stock')
          matchStatus = p.current_stock > 0 && p.current_stock <= 50
        else if (filters.status === 'Out of Stock')
          matchStatus = p.current_stock === 0

        // 5. Screenplate Compatibility Logic
        let matchPlate = true
        if (filters.screenplate !== 'All Plates') {
          const selectedPlate = (screenplateData as IScreenPlate[]).find(
            (sp) => sp.plate_name === filters.screenplate,
          )
          matchPlate = !!selectedPlate?.compatibility.some(
            (cp) => cp.product_id === p.id,
          )
        }

        // 6. Meta Filters
        let matchMeta = true
        if (showFavoritesOnly) matchMeta = favorites.includes(p.id)
        if (showMostSold && matchMeta) {
          const soldCount = soldMap[p.id] || 0
          matchMeta = soldCount > 100 // Updated industrial threshold
        }

        return (
          matchCategory &&
          matchSearch &&
          matchPrice &&
          matchStatus &&
          matchPlate &&
          matchMeta
        )
      })
      .sort((a, b) => {
        if (showMostSold) {
           const soldA = soldMap[a.id] || 0
           const soldB = soldMap[b.id] || 0
           return soldB - soldA
        }
        if (filters.sort === 'A to Z') return a.name.localeCompare(b.name)
        if (filters.sort === 'Z to A') return b.name.localeCompare(a.name)
        if (filters.sort === 'Price: Low-High')
          return a.base_price - b.base_price
        if (filters.sort === 'Price: High-Low')
          return b.base_price - a.base_price
        return 0
      })
  }, [searchQuery, filters, favorites, showMostSold, showFavoritesOnly, soldMap])

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(start, start + itemsPerPage)
  }, [filteredProducts, currentPage, itemsPerPage])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [heroImages.length])

  const resetFilters = () => {
    setFilters({
      category: 'All',
      price: 'All Prices',
      sort: 'Price: Low-High',
      status: 'All Status',
      screenplate: 'All Plates',
    })
    setSearchQuery('')
    setShowMostSold(false)
    setShowFavoritesOnly(false)
    setCurrentPage(1)
  }

  const handlePageChange = (newPage: number) => {
    checkAuthAndRun(() => {
      if (newPage < 1 || newPage > totalPages) return
      setCurrentPage(newPage)
      
      // Smooth scroll to marketplace node top
      if (marketplaceRef.current) {
        const topOffset = marketplaceRef.current.getBoundingClientRect().top + window.scrollY - 100
        window.scrollTo({ top: topOffset, behavior: 'smooth' })
      }
    });
  }

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
       const updated = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
       // Commit to terminal storage
       localStorage.setItem('pixs_favorites', JSON.stringify(updated))
       return updated
    })
  }

  return (
    <div className="animate-in fade-in space-y-24 pb-20 duration-1000">
      {/* 1. Dynamic Hero Carousel */}
      <section className="relative h-[660px] w-full overflow-hidden rounded-[64px] bg-slate-900 shadow-2xl md:h-[740px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentHeroIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${heroImages[currentHeroIndex].url})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/10 to-slate-900/80" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 z-20 flex flex-col justify-end p-16 md:p-28">
          <motion.div
            key={currentHeroIndex + 'text'}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-4xl"
          >
            <div className="mb-10 flex items-center gap-6">
              <span className="bg-pixs-mint/20 border-pixs-mint/50 text-pixs-mint rounded-full border px-6 py-2.5 text-[10px] font-black tracking-[5px] uppercase backdrop-blur-xl">
                Active Requisition Protocol
              </span>
              <div className="bg-pixs-mint/40 h-0.5 w-24" />
            </div>
            <h1 className="mb-12 text-7xl leading-[0.8] font-black tracking-tighter text-white italic md:text-9xl">
              {heroImages[currentHeroIndex].title.split(' ').map((word, i) => (
                <span
                  key={i}
                  className={
                    word === 'Printing' || word === 'Machinery'
                      ? 'text-pixs-mint'
                      : ''
                  }
                >
                  {word}{' '}
                </span>
              ))}
            </h1>
            <div className="flex flex-col items-center gap-10 md:flex-row">
              <button
                onClick={() => checkAuthAndRun(() => openDiscovery())}
                className="bg-pixs-mint shadow-pixs-mint/40 w-full rounded-[36px] px-14 py-7 text-xs font-black tracking-widest text-slate-900 uppercase shadow-2xl transition-all hover:scale-105 active:scale-95 md:w-auto"
              >
                Initialize Output Node
              </button>
              <div className="flex h-12 items-center gap-4 border-l border-slate-700 pl-8">
                <div className="bg-pixs-mint h-2 w-2 animate-pulse rounded-full shadow-[0_0_10px_#75EEA5]" />
                <p className="flex h-full items-center text-[10px] leading-none font-black tracking-[4px] text-slate-400 uppercase italic">
                  Deployment Readiness: STABLE
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Hero Indicators */}
        <div className="absolute top-1/2 right-16 z-30 flex -translate-y-1/2 flex-col gap-6">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentHeroIndex(i)}
              className={clsx(
                'w-2 rounded-full transition-all duration-700',
                currentHeroIndex === i
                  ? 'bg-pixs-mint shadow-pixs-mint/60 h-16 shadow-xl'
                  : 'h-6 bg-white/20 hover:bg-white/60',
              )}
            />
          ))}
        </div>
      </section>

      {/* 2. Quick Category Row */}
      <section className="px-10 sm:px-16">
        <div className="mb-12 flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-[11px] leading-none font-black tracking-[6px] text-slate-900 uppercase italic">
              Flash Cluster Feed
            </h3>
            <p className="mt-2 text-[9px] leading-none font-bold tracking-widest text-slate-400 uppercase">
              Instant-Link Production Nodes
            </p>
          </div>
          <div className="mx-12 hidden h-px flex-1 bg-slate-100 md:block" />
          <button
            onClick={() => checkAuthAndRun(() => openDiscovery())}
            className="text-pixs-mint flex items-center gap-2 text-xs font-black tracking-widest uppercase hover:underline"
          >
            Full Map <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
          {quickCategories.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => checkAuthAndRun(() => openDiscovery(cat.id))}
              whileHover={{ y: -8, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group relative aspect-[4/3] overflow-hidden rounded-[44px] border border-slate-100 bg-slate-100 shadow-2xl"
            >
              <div className="absolute inset-0">
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-125 group-hover:rotate-3"
                />
                <div className="group-hover:from-pixs-mint/80 absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent transition-all duration-700" />
              </div>
              <div className="absolute inset-0 flex flex-col items-start justify-end p-10 text-left">
                <span className="mt-2 text-xl leading-tight font-black tracking-tighter text-white uppercase italic drop-shadow-2xl">
                  {cat.label}
                </span>
              </div>
            </motion.button>
          ))}

          <motion.button
            onClick={() => checkAuthAndRun(() => openDiscovery())}
            whileHover={{ y: -8, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group hover:bg-pixs-mint relative flex aspect-[4/3] flex-col items-center justify-center gap-4 overflow-hidden rounded-[44px] border-2 border-slate-800 bg-slate-900 text-center shadow-2xl transition-colors"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 group-hover:bg-slate-900/10">
              <ChevronRight
                className="text-white transition-colors group-hover:text-slate-900"
                size={32}
              />
            </div>
            <span className="text-lg font-black text-white uppercase italic group-hover:text-slate-900">
              More
            </span>
          </motion.button>
        </div>
      </section>

   
      <section
        id="marketplace"
        ref={marketplaceRef}
        className="scroll-mt-24 space-y-12 px-6 md:px-16"
      >
        <div className="flex flex-col gap-10">
          <div className="HomepageMarketplaceCommandCenter flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="space-y-4">
              <h2 className="MarketplaceLabel text-5xl leading-[0.8] font-black tracking-tighter text-slate-900 uppercase italic md:text-7xl">
                Marketplace Scan
              </h2>
              <p className="text-[10px] font-black tracking-[6px] text-slate-400 uppercase italic">
                Automated Product Cluster Logic
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-6">
              <button 
                onClick={() => {
                  setShowMostSold(!showMostSold)
                  setCurrentPage(1)
                }}
                className={clsx(
                   "flex items-center gap-2 text-[10px] font-black tracking-widest uppercase transition-all px-4 py-2 rounded-xl",
                   showMostSold ? "bg-pixs-mint text-slate-900 shadow-lg shadow-pixs-mint/20" : "text-slate-400 hover:text-slate-900 bg-white border border-slate-100"
                )}
              >
                <Zap size={14} className={showMostSold ? "fill-slate-900" : ""} /> Most Sold
              </button>

              <button 
                onClick={() => {
                  setShowFavoritesOnly(!showFavoritesOnly)
                  setCurrentPage(1)
                }}
                className={clsx(
                   "flex items-center gap-2 text-[10px] font-black tracking-widest uppercase transition-all px-4 py-2 rounded-xl",
                   showFavoritesOnly ? "bg-rose-500 text-white shadow-lg shadow-rose-200" : "text-slate-400 hover:text-slate-900 bg-white border border-slate-100"
                )}
              >
                <Heart size={14} className={showFavoritesOnly ? "fill-white" : ""} /> Favorites
              </button>

              <div className="h-8 w-px bg-slate-100 hidden sm:block" />

              <button
                onClick={resetFilters}
                className="hover:text-pixs-mint flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase transition-colors"
              >
                <RotateCcw size={14} /> Reset System
              </button>
            </div>
          </div>

          {/* Command Node (Sticky) */}
          <div className="sticky top-24 z-40 space-y-4">
            {/* Search Bar */}
            <div className="group relative w-full">
              <Search
                className="group-focus-within:text-pixs-mint absolute top-1/2 left-6 -translate-y-1/2 text-slate-300 transition-colors"
                size={20}
              />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => {
                   if (!user.isLoggedIn) {
                      setIsLoginModalOpen(true);
                      (document.activeElement as HTMLElement)?.blur();
                   }
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Identify node sequence (e.g. SKU_902)..."
                className="focus:border-pixs-mint w-full rounded-3xl border border-slate-100 bg-white py-5 pr-12 pl-16 font-mono text-sm font-black text-slate-900 italic shadow-xl shadow-slate-200/20 transition-all focus:outline-none"
              />
            </div>

            {/* Multi-Dropdown Grid */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <FilterDropdown
                label="Classification"
                icon={Layers}
                value={filters.category}
                options={categories}
                onChange={(v) => {
                  setFilters({ ...filters, category: v })
                  setCurrentPage(1)
                }}
              />
              <FilterDropdown
                label="Rate Range"
                icon={Banknote}
                value={filters.price}
                options={priceRanges}
                onChange={(v) => {
                  setFilters({ ...filters, price: v })
                  setCurrentPage(1)
                }}
              />
              <FilterDropdown
                label="Sort Protocol"
                icon={ArrowUpDown}
                value={filters.sort}
                options={sortOptions}
                onChange={(v) => {
                  setFilters({ ...filters, sort: v })
                  setCurrentPage(1)
                }}
              />
              <FilterDropdown
                label="Active Status"
                icon={Activity}
                value={filters.status}
                options={statusOptions}
                onChange={(v) => {
                  setFilters({ ...filters, status: v })
                  setCurrentPage(1)
                }}
              />
              <FilterDropdown
                label="Owned Plate"
                icon={Layers}
                value={filters.screenplate}
                options={plateOptions}
                onChange={(val) => {
                  setFilters({ ...filters, screenplate: val })
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>
        </div>

        {/* Output Matrix */}
        <div className="HomepageOutputMatrix space-y-16">
          {paginatedProducts.length > 0 ? (
            <div
              className="ProductGridContainer grid grid-cols-2 gap-4 md:gap-12 lg:grid-cols-4 xl:grid-cols-5"
            >
              {paginatedProducts.map((product) => {
                const soldCount = soldMap[product.id] || 0
                return (
                <div
                  key={product.id}
                  onClick={() => {
                    checkAuthAndRun(() => {
                        const plateParam = filters.screenplate !== 'All Plates' ? `?plate=${encodeURIComponent(filters.screenplate)}` : '';
                        navigate(`/product/${product.id}${plateParam}`);
                    });
                  }}
                  className="HomepageProductCard ProductCardWrapper group relative cursor-pointer rounded-[32px] border border-slate-100 bg-white p-2 transition-all md:rounded-[44px] md:p-2.5 hover:-translate-y-3"
                >
                  <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[24px] border border-slate-50 bg-slate-50 shadow-inner transition-colors duration-500 group-hover:bg-white md:rounded-[36px]">
                    <img 
                      src={product.main_image} 
                      alt={product.name}
                      className="ProductCardImage h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        checkAuthAndRun(() => toggleFavorite(product.id));
                      }}
                      className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-xl border border-white bg-white/90 shadow-lg backdrop-blur-xl transition-all md:top-6 md:right-6 md:h-12 md:w-12 md:rounded-[22px]"
                    >
                      <Heart
                        size={20}
                        className={clsx(
                          favorites.includes(product.id)
                            ? 'fill-rose-500 text-rose-500'
                            : 'text-slate-200',
                        )}
                      />
                    </button>

                    <div
                      className={clsx(
                        'absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg border border-white/10 px-2 py-1 text-[8px] font-black tracking-widest uppercase shadow-2xl md:bottom-6 md:left-6 md:gap-2.5 md:rounded-xl md:px-4 md:py-2 md:text-[9px]',
                        product.current_stock > 50
                          ? 'bg-slate-900 text-white'
                          : 'bg-rose-500 text-white',
                      )}
                    >
                      <div
                        className={clsx(
                          'h-1.5 w-1.5 animate-pulse rounded-full md:h-2 md:w-2',
                          product.current_stock > 50
                            ? 'bg-pixs-mint'
                            : 'bg-white',
                        )}
                      />
                      {product.current_stock.toLocaleString()}{' '}
                      <span className="hidden md:inline">Units Available</span>
                    </div>
                  </div>

                  <div className="ProductCardContent p-3 md:p-6 pb-2 md:pb-4">
                    <div className="flex items-center justify-between mb-2">
                       <h4 className="ProductCardName group-hover:text-pixs-mint truncate text-[11px] leading-tight font-black tracking-tight text-slate-900 uppercase italic transition-colors md:text-lg flex-1">
                         {product.name}
                       </h4>
                       <span className="text-[8px] font-black bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full md:text-[9px]">
                         {soldCount.toLocaleString()}+ sold
                       </span>
                    </div>
                    
                    <p className="ProductCardShortDescription mb-4 line-clamp-2 text-[8px] font-bold tracking-widest text-slate-300 uppercase italic opacity-60 md:text-[9px]">
                      {product.short_description}
                    </p>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                      <div className="flex flex-col">
                        {user.isLoggedIn ? (
                          <>
                            <span className="text-[9px] font-black text-rose-500 tracking-tighter md:text-sm">
                              Min: ₱{((product.base_price || 0) * (product.min_order || 1)).toLocaleString()}
                            </span>
                            <span className="font-mono text-[10px] leading-none font-black tracking-tighter text-slate-900 italic md:text-lg">
                              ₱{product.base_price.toLocaleString()}/pc
                            </span>
                          </>
                        ) : (
                          <div className="py-2 bg-slate-50 px-3 rounded-lg border border-slate-100 flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-slate-200 animate-pulse" />
                             <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Locked Rate</span>
                          </div>
                        )}
                      </div>
                      <button className="hover:bg-pixs-mint hover:border-pixs-mint flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-900 shadow-lg transition-all group-hover:rotate-12 active:scale-95 md:h-12 md:w-12 md:rounded-2xl">
                        <Plus size={18} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          ) : (
            <div className="space-y-8 rounded-[64px] border border-dashed border-slate-100 bg-white py-40 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-50">
                <Package size={48} className="text-slate-100" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 uppercase italic">
                  Null Node Cluster
                </h3>
                <p className="text-[10px] font-bold tracking-[6px] text-slate-400 uppercase">
                  No elements match current requirement sequence
                </p>
              </div>
              <button
                onClick={resetFilters}
                className="rounded-[24px] bg-slate-900 px-10 py-5 text-[10px] font-black tracking-[3px] text-white uppercase shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                Clear Active Protocol
              </button>
            </div>
          )}

          {/* Pagination Node */}
          {totalPages > 1 && (
            <div className="HomepagePagination flex items-center justify-center gap-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="PaginationArrow hover:bg-pixs-mint flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 transition-all hover:text-slate-900 disabled:opacity-20"
              >
                <ChevronLeft size={24} />
              </button>
              
              <div className="HomepagePaginationWrapper flex gap-3">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={clsx(
                      'PaginationNumber flex h-12 w-12 items-center justify-center rounded-2xl text-[10px] font-black transition-all',
                      currentPage === i + 1
                        ? 'PaginationActive bg-slate-900 text-white'
                        : 'border border-slate-100 bg-white text-slate-400',
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="PaginationArrow hover:bg-pixs-mint flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 transition-all hover:text-slate-900 disabled:opacity-20"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. Industrial CTA Hub */}
      <section className="px-10 pb-20 sm:px-16">
        <div className="group relative overflow-hidden rounded-[80px] bg-slate-900 p-20 shadow-[0_60px_100px_-30px_rgba(0,0,0,0.4)] md:p-32">
          <div className="bg-pixs-mint/5 group-hover:bg-pixs-mint/15 absolute top-0 right-0 -mt-96 -mr-96 h-[800px] w-[800px] rounded-full blur-[200px] transition-colors duration-1500" />
          <div className="relative z-10 flex flex-col items-center gap-24 xl:flex-row xl:gap-32">
            <div className="flex-1 space-y-12">
              <div className="flex items-center gap-4">
                <Zap className="text-pixs-mint fill-pixs-mint" size={20} />
                <span className="text-pixs-mint text-xs font-black tracking-[8px] uppercase">
                  Growth Protocol{' '}
                </span>
              </div>
              <h2 className="text-6xl leading-[0.8] font-black tracking-tighter text-white uppercase italic md:text-8xl">
                Heavy
                <br />
                Production
                <br />
                <span className="text-pixs-mint decoration-pixs-mint/20 underline decoration-4 underline-offset-[20px]">
                  Nodes.
                </span>
              </h2>
              <p className="max-w-2xl text-base leading-relaxed font-bold tracking-[5px] text-slate-400 uppercase italic opacity-80 md:text-xl">
                Deploy high-velocity industrial machinery into your existing
                output terminal with zero downtime.
              </p>
              <div className="flex flex-col gap-8 pt-8 text-center sm:flex-row sm:text-left">
                <button
                  onClick={() => openDiscovery('Machine')}
                  className="rounded-[32px] bg-white px-16 py-7 text-sm font-black tracking-widest text-slate-900 uppercase shadow-2xl transition-all hover:scale-105 active:scale-95"
                >
                  Browse Machinery
                </button>
                <button className="rounded-[32px] border-2 border-white/10 px-16 py-7 text-sm font-black tracking-widest text-white uppercase italic transition-all hover:border-white/30 hover:bg-white/5">
                  Systems Support
                </button>
              </div>
            </div>
            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[64px] border border-white/5 bg-slate-800 shadow-inner transition-transform duration-1000 group-hover:scale-105 xl:w-2/5">
              <div className="from-pixs-mint/15 absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] via-transparent to-transparent opacity-60" />
              <Cog className="text-pixs-mint/10 animate-spin-slow absolute -right-24 -bottom-24 h-80 w-80" />
              <Printer
                size={220}
                className="group-hover:text-pixs-mint text-white/5 opacity-20 transition-all duration-1000"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. PIXS Community Section — only shown to guests */}
      {!user.isLoggedIn && <PixsCommunitySection isLoggedIn={user.isLoggedIn} />}

      {/* 6. Professional Footer Identity */}
      <Footer />

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  )
}

export default Homepage
