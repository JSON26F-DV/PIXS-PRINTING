import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart,
  Package,
  Zap,
  ChevronRight,
  ChevronLeft,
  Layers,
  Banknote,
  ArrowUpDown,
  Activity,
  RotateCcw,
  ArrowRight,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

import { useAuth } from '../../context/AuthContext'
import { useDiscovery } from '../../context/DiscoveryContext'
import { useCategories } from '../../hooks/useCategories'
import { useProducts } from '../../hooks/useProducts'
import { useScreenplates } from '../../hooks/useScreenplates'
import { useSoldCounts } from '../../hooks/useSoldCounts'
import { useDebounce } from '../../hooks/useDebounce'
import { SearchBar } from './SearchBar'
import { STORAGE_KEYS } from '../../constants/storageKeys'
import Footer from '../../components/Footer/Footer'

import CategoryCard from '../../components/CategoryCard/CategoryCard'
import ProductCard from '../../components/ProductCard/ProductCard'
import FilterDropdown from '../../components/FilterDropdown/FilterDropdown'
import LoginModal from '../../components/LoginModal/LoginModal'

// --- Interfaces ---
// Reusing central types from product.types.ts

interface IFilters {
  category: string
  price: string
  sort: string
  status: string
  screenplate_id: string | null
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


const HERO_IMAGES = [
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
] as const

const communityLogos: ILogo[] = [
  { name: 'Brew & Co.', type: 'Café', logo: 'https://images.unsplash.com/photo-1542181961-9590d0c79ca9?auto=format&fit=crop&q=80&w=200&h=200' },
  { name: 'Aesthetic Studios', type: 'Creative Agency', logo: 'https://images.unsplash.com/photo-1560159906-8d14d23253b7?auto=format&fit=crop&q=80&w=200&h=200' },
  { name: 'Urban Threads', type: 'Clothing Brand', logo: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=200&h=200' },
  { name: 'Lokal Market', type: 'Retail', logo: 'https://images.unsplash.com/photo-153452203293-494d7ddbf7e0?auto=format&fit=crop&q=80&w=200&h=200' },
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
                 <img 
                   src={brand.logo} 
                   alt={brand.name} 
                   loading="lazy"
                   onError={(e) => {
                     (e.target as HTMLImageElement).src = '/assets/fallback-logo.png'
                   }}
                   className="pixs-partner-logo w-full h-full object-cover" 
                 />
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
  const { openDiscovery } = useDiscovery()
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pixs_favorites')
      return saved ? (JSON.parse(saved) as string[]) : []
    } catch {
      localStorage.removeItem('pixs_favorites')
      return []
    }
  })

  const checkAuthAndRun = useCallback((action: () => void) => {
    if (!user.isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    action();
  }, [user.isLoggedIn]);

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
  const { categories, isLoading: catLoading, error: catError } = useCategories()
  const { screenplates, isLoading: plateLoading } = useScreenplates()
  const { soldMap, isLoading: soldLoading } = useSoldCounts()

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 350)
  
  const [filters, setFilters] = useState<IFilters>({
    category: 'All',
    price: 'All Prices',
    sort: 'Price: Low-High',
    status: 'All Status',
    screenplate_id: null,
  })

  // Meta Filters
  const [showMostSold, setShowMostSold] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (user?.isLoggedIn) {
      const checkDeleted = async () => {
        try {
          const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            }
          })
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem(STORAGE_KEYS.TOKEN)
            window.location.href = '/login'
          }
        } catch {
            // ignore
        }
      }
      checkDeleted()
    }
  }, [user?.isLoggedIn])
  
  // ─── Responsive Matrix ──────────────────────────────────────────────────
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  
  useEffect(() => {
    let rafId: number
    const handleResize = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        setWindowWidth(window.innerWidth)
        setCurrentPage(1)
      })
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  const itemsPerPage = windowWidth < 768 ? 10 : 20
  const marketplaceRef = useRef<HTMLDivElement>(null)

  let price_min, price_max;
  if (filters.price === 'Under ₱100') { price_max = 100; }
  else if (filters.price === '₱100-₱500') { price_min = 100; price_max = 500; }
  else if (filters.price === '₱500-₱1k') { price_min = 500; price_max = 1000; }
  else if (filters.price === '₱1k+') { price_min = 1000; }

  const safeSearch = debouncedSearch.replace(/[^a-zA-Z0-9\s\-_.]/g, '').trim();
  const { products, totalPages, isLoading: prodLoading, error: prodError } = useProducts({
    category: filters.category,
    search: (safeSearch.length >= 3 || safeSearch === '') ? safeSearch : '',
    price_min,
    price_max,
    sort: filters.sort,
    status: filters.status,
    screenplate_id: filters.screenplate_id,
    most_sold: showMostSold,
    page: currentPage,
    per_page: itemsPerPage
  })

  const quickCategories = (categories ?? []).slice(0, 4)

  const categoriesOptions = [
    'All',
    ...(categories ?? []).map((c) => c.label),
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
    { label: 'All Plates', value: null },
    ...(screenplates ?? []).map((p) => ({ label: p.plate_name, value: p.id })),
  ]

  const paginatedProducts = products;

  const handleCategoryChange = useCallback((v: string | null) => {
    if (v) setFilters(prev => ({ ...prev, category: v }))
    setCurrentPage(1)
  }, [])

  const handlePriceChange = useCallback((v: string | null) => {
    if (v) setFilters(prev => ({ ...prev, price: v }))
    setCurrentPage(1)
  }, [])

  const handleSortChange = useCallback((v: string | null) => {
    if (v) setFilters(prev => ({ ...prev, sort: v }))
    setCurrentPage(1)
  }, [])

  const handleStatusChange = useCallback((v: string | null) => {
    if (v) setFilters(prev => ({ ...prev, status: v }))
    setCurrentPage(1)
  }, [])

  const handlePlateChange = useCallback((val: string | null) => {
    setFilters(prev => ({ ...prev, screenplate_id: val }))
    setCurrentPage(1)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev: number) => (prev + 1) % HERO_IMAGES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      category: 'All',
      price: 'All Prices',
      sort: 'Price: Low-High',
      status: 'All Status',
      screenplate_id: null,
    })
    setSearchQuery('')
    setShowMostSold(false)
    setShowFavoritesOnly(false)
    setCurrentPage(1)
  }, [])

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

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
       const updated = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
       try {
         localStorage.setItem('pixs_favorites', JSON.stringify(updated))
       } catch {
         console.warn('[Favorites] Could not persist to localStorage')
       }
       return updated
    })
  }, [])

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
                backgroundImage: `url(${HERO_IMAGES[currentHeroIndex].url})`,
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
              {HERO_IMAGES[currentHeroIndex].title.split(' ').map((word, i) => (
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
          {HERO_IMAGES.map((_, i) => (
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
          {catLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse aspect-[4/3] bg-slate-100 rounded-[44px]"></div>
            ))
          ) : catError ? (
            <div className="col-span-2 md:col-span-3 lg:col-span-4 py-20 text-center rounded-[44px] border border-dashed border-red-100 bg-red-50">
               <p className="text-[10px] font-bold tracking-widest text-red-400 uppercase">Failed to load categories</p>
               <button onClick={() => window.location.reload()} className="mt-4 text-[10px] font-black underline uppercase">Retry</button>
            </div>
          ) : (
            quickCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                onClick={() => checkAuthAndRun(() => openDiscovery(cat.id))}
              />
            ))
          )}

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
            <SearchBar 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              onFocus={() => {
                 if (!user.isLoggedIn) {
                    setIsLoginModalOpen(true);
                    (document.activeElement as HTMLElement)?.blur();
                 }
              }}
              placeholder="Identify node sequence (e.g. SKU_902)..."
            />

            {/* Multi-Dropdown Grid */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <FilterDropdown
                label="Classification"
                icon={Layers}
                value={filters.category}
                options={categoriesOptions}
                onChange={handleCategoryChange}
              />
              <FilterDropdown
                label="Rate Range"
                icon={Banknote}
                value={filters.price}
                options={priceRanges}
                onChange={handlePriceChange}
              />
              <FilterDropdown
                label="Sort Protocol"
                icon={ArrowUpDown}
                value={filters.sort}
                options={sortOptions}
                onChange={handleSortChange}
              />
              <FilterDropdown
                label="Active Status"
                icon={Activity}
                value={filters.status}
                options={statusOptions}
                onChange={handleStatusChange}
              />
              <FilterDropdown
                label="Owned Plate"
                icon={Layers}
                value={filters.screenplate_id}
                options={plateOptions}
                onChange={handlePlateChange}
              />
            </div>
          </div>
        </div>

        {/* Output Matrix */}
        <div className="HomepageOutputMatrix space-y-16">
          {prodLoading || plateLoading || catLoading || soldLoading ? (
            <div className="ProductGridContainer grid grid-cols-2 gap-4 md:gap-12 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-pulse flex flex-col gap-4">
                  <div className="bg-slate-200 w-full aspect-square rounded-[36px]"></div>
                  <div className="bg-slate-200 h-6 w-3/4 rounded-full"></div>
                  <div className="bg-slate-200 h-4 w-1/2 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : prodError ? (
            <div className="space-y-8 rounded-[64px] border border-dashed border-red-200 bg-red-50 py-40 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
                <X size={48} className="text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 uppercase italic">Connection Error</h3>
                <p className="text-[10px] font-bold tracking-[6px] text-slate-400 uppercase">{prodError}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="rounded-[24px] bg-slate-900 px-10 py-5 text-[10px] font-black tracking-[3px] text-white uppercase shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                Retry Connection
              </button>
            </div>
          ) : paginatedProducts.length > 0 ? (
            <div
              className="ProductGridContainer grid grid-cols-2 gap-4 md:gap-12 lg:grid-cols-4 xl:grid-cols-5"
            >
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  soldCount={soldMap[product.id] || 0}
                  isFav={favorites.includes(product.id)}
                  onFavClick={(e) => {
                    e.stopPropagation();
                    checkAuthAndRun(() => toggleFavorite(product.id));
                  }}
                  onClick={() => {
                    checkAuthAndRun(() => {
                        const plateParam = filters.screenplate_id 
                          ? `?plate=${encodeURIComponent(filters.screenplate_id)}` 
                          : '';
                        navigate(`/product/${encodeURIComponent(product.id)}${plateParam}`);
                    });
                  }}
                />
              ))}
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

      {/* 5. PIXS Community Section — only shown to guests */}
      {!user.isLoggedIn && <PixsCommunitySection isLoggedIn={user.isLoggedIn} />}

      {/* 6. Professional Footer Identity */}
      <Footer />

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  )
}

export default Homepage
