import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  Zap,
  ChevronRight,
  Search,
  ChevronLeft,
  Layers,
  Banknote,
  ArrowUpDown,
  Activity,
  RotateCcw,
  Heart,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import axios from 'axios';
import { trackWindowScroll } from 'react-lazy-load-image-component';
import type { ScrollPosition } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { Skeleton } from 'boneyard-js/react'

// --- Components ---
import FilterDropdown from '../../components/Homepage/FilterDropdown'
import LoginModal from '../../components/Homepage/LoginModal'
import CategoryCard from '../../components/Homepage/CategoryCard'
import ProductCard from '../../components/Homepage/ProductCard'
import PixsCommunitySection from '../../components/Homepage/PixsCommunitySection'

import { useAuth } from '../../context/AuthContext'
import { useDiscovery } from '../../context/DiscoveryContext'
import Footer from '../../components/Footer/Footer'
import type { IProduct, IScreenPlate, ICategory, IFilters } from '../../types/product.types'


const HomepageView = ({ scrollPosition }: { scrollPosition: ScrollPosition }) => {
  const { user } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // ─── API State Nodes ───────────────────────────────────────────────────
  const [products, setProducts] = useState<IProduct[]>([])
  const [categoriesList, setCategoriesList] = useState<ICategory[]>([])
  const [screenplates, setScreenplates] = useState<IScreenPlate[]>([])
  const [soldMap, setSoldMap] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0)
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('pixs_favorites')
    return saved ? JSON.parse(saved) : []
  })
  const { openDiscovery } = useDiscovery()

  const checkAuthAndRun = useCallback((action: () => void) => {
    if (!user.isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    action();
  }, [user.isLoggedIn]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setIsLoading(true)
        setHasError(false)
        const [catRes, prodRes, plateRes, statRes] = await Promise.all([
          axios.get('/api/home/categories'),
          axios.get('/api/home/products'),
          axios.get('/api/home/screenplates'),
          axios.get('/api/home/stats')
        ])

        if (catRes.data.status === 'success') setCategoriesList(catRes.data.data)
        if (prodRes.data.status === 'success') setProducts(prodRes.data.data)
        if (plateRes.data.status === 'success') setScreenplates(plateRes.data.data)
        if (statRes.data.status === 'success') setSoldMap(statRes.data.data)
      } catch {
        setHasError(true)
      } finally {
        setTimeout(() => setIsLoading(false), 800) // Small delay for smooth transition
      }
    }

    fetchHomeData()
  }, [])

  useEffect(() => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('pixs_draft_')) {
        localStorage.removeItem(key);
      }
    });
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

  const quickCategories = categoriesList.slice(0, 4)
  const categories = ['All', ...categoriesList.map((c) => c.label)]
  const priceRanges = ['All Prices', 'Under ₱100', '₱100-₱500', '₱500-₱1k', '₱1k+']
  const sortOptions = ['A to Z', 'Z to A', 'Price: Low-High', 'Price: High-Low']
  const statusOptions = ['All Status', 'In Stock', 'Low Stock', 'Out of Stock']
  const plateOptions = ['All Plates', ...screenplates.map((p) => p.plate_name)]

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchCategory = filters.category === 'All' || p.category.includes(filters.category)
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase())
        let matchPrice = true
        if (filters.price === 'Under ₱100') matchPrice = (p.base_price || 0) < 100
        else if (filters.price === '₱100-₱500') matchPrice = (p.base_price || 0) >= 100 && (p.base_price || 0) <= 500
        else if (filters.price === '₱500-₱1k') matchPrice = (p.base_price || 0) >= 500 && (p.base_price || 0) <= 1000
        else if (filters.price === '₱1k+') matchPrice = (p.base_price || 0) > 1000

        let matchStatus = true
        if (filters.status === 'In Stock') matchStatus = (p.current_stock || 0) > 50
        else if (filters.status === 'Low Stock') matchStatus = (p.current_stock || 0) > 0 && (p.current_stock || 0) <= 50
        else if (filters.status === 'Out of Stock') matchStatus = (p.current_stock || 0) === 0

        let matchMeta = true
        if (showFavoritesOnly) matchMeta = favorites.includes(p.id)
        if (showMostSold && matchMeta) {
          const soldCount = soldMap[p.id] || 0
          matchMeta = soldCount > 100 
        }

        return matchCategory && matchSearch && matchPrice && matchStatus && matchMeta
      })
      .sort((a, b) => {
        if (showMostSold) {
           const soldA = soldMap[a.id] || 0
           const soldB = soldMap[b.id] || 0
           return soldB - soldA
        }
        if (filters.sort === 'A to Z') return a.name.localeCompare(b.name)
        if (filters.sort === 'Z to A') return b.name.localeCompare(a.name)
        if (filters.sort === 'Price: Low-High') return (a.base_price || 0) - (b.base_price || 0)
        if (filters.sort === 'Price: High-Low') return (b.base_price || 0) - (a.base_price || 0)
        return 0
      })
  }, [products, searchQuery, filters, favorites, showMostSold, showFavoritesOnly, soldMap])

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

  const resetFilters = useCallback(() => {
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
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    checkAuthAndRun(() => {
      if (newPage < 1 || newPage > totalPages) return
      setCurrentPage(newPage)
      if (marketplaceRef.current) {
        const topOffset = marketplaceRef.current.getBoundingClientRect().top + window.scrollY - 100
        window.scrollTo({ top: topOffset, behavior: 'smooth' })
      }
    });
  }, [checkAuthAndRun, totalPages]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
       const updated = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
       localStorage.setItem('pixs_favorites', JSON.stringify(updated))
       return updated
    })
  }, []);

  return (
    <div className="animate-in fade-in space-y-24 pb-20 duration-1000">
      <Skeleton name="homepage-hero" loading={isLoading}>
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
                style={{ backgroundImage: `url(${heroImages[currentHeroIndex].url})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/10 to-slate-900/80" />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-0 z-20 flex flex-col justify-end p-16 md:p-28">
            <div className="max-w-4xl">
              <div className="mb-10 flex items-center gap-6">
                <span className="bg-pixs-mint/20 border-pixs-mint/50 text-pixs-mint rounded-full border px-6 py-2.5 text-[10px] font-black tracking-[5px] uppercase backdrop-blur-xl">
                  Active Requisition Protocol
                </span>
                <div className="bg-pixs-mint/40 h-0.5 w-24" />
              </div>
              <h1 className="mb-12 text-7xl leading-[0.8] font-black tracking-tighter text-white italic md:text-9xl">
                {heroImages[currentHeroIndex].title.split(' ').map((word, i) => (
                  <span key={i} className={word === 'Printing' ? 'text-pixs-mint' : ''}>{word} </span>
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
            </div>
          </div>
        </section>
      </Skeleton>

      <section className="px-10 sm:px-16">
        <div className="mb-12 flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-[11px] leading-none font-black tracking-[6px] text-slate-900 uppercase italic">Flash Cluster Feed</h3>
            <p className="mt-2 text-[9px] leading-none font-bold tracking-widest text-slate-400 uppercase">Instant-Link Production Nodes</p>
          </div>
          <div className="mx-12 hidden h-px flex-1 bg-slate-100 md:block" />
          <button onClick={() => checkAuthAndRun(() => openDiscovery())} className="text-pixs-mint flex items-center gap-2 text-xs font-black tracking-widest uppercase hover:underline">
            Full Map <ChevronRight size={14} />
          </button>
        </div>
        <Skeleton name="homepage-categories" loading={isLoading}>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
            {quickCategories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} onClick={(id) => checkAuthAndRun(() => openDiscovery(id))} scrollPosition={scrollPosition} />
            ))}
            <motion.button
              onClick={() => checkAuthAndRun(() => openDiscovery())}
              whileHover={{ y: -8, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group hover:bg-pixs-mint relative flex aspect-[4/3] flex-col items-center justify-center gap-4 overflow-hidden rounded-[44px] border-2 border-slate-800 bg-slate-900 text-center shadow-2xl transition-colors"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 group-hover:bg-slate-900/10">
                <ChevronRight className="text-white transition-colors group-hover:text-slate-900" size={32} />
              </div>
              <span className="text-lg font-black text-white uppercase italic group-hover:text-slate-900">More</span>
            </motion.button>
          </div>
        </Skeleton>
      </section>

      <section id="marketplace" ref={marketplaceRef} className="scroll-mt-24 space-y-12 px-6 md:px-16">
        <div className="flex flex-col gap-10">
          <div className="HomepageMarketplaceCommandCenter flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="space-y-4">
              <h2 className="MarketplaceLabel text-5xl leading-[0.8] font-black tracking-tighter text-slate-900 uppercase italic md:text-7xl">Marketplace Scan</h2>
              <p className="text-[10px] font-black tracking-[6px] text-slate-400 uppercase italic">Automated Product Cluster Logic</p>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <button onClick={() => { setShowMostSold(!showMostSold); setCurrentPage(1); }} className={clsx("flex items-center gap-2 text-[10px] font-black tracking-widest uppercase transition-all px-4 py-2 rounded-xl", showMostSold ? "bg-pixs-mint text-slate-900 shadow-lg shadow-pixs-mint/20" : "text-slate-400 hover:text-slate-900 bg-white border border-slate-100")}>
                <Zap size={14} className={showMostSold ? "fill-slate-900" : ""} /> Most Sold
              </button>
              <button onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setCurrentPage(1); }} className={clsx("flex items-center gap-2 text-[10px] font-black tracking-widest uppercase transition-all px-4 py-2 rounded-xl", showFavoritesOnly ? "bg-rose-500 text-white shadow-lg shadow-rose-200" : "text-slate-400 hover:text-slate-900 bg-white border border-slate-100")}>
                <Heart size={14} className={showFavoritesOnly ? "fill-white" : ""} /> Favorites
              </button>
              <div className="h-8 w-px bg-slate-100 hidden sm:block" />
              <button onClick={resetFilters} className="hover:text-pixs-mint flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase transition-colors">
                <RotateCcw size={14} /> Reset System
              </button>
            </div>
          </div>

          <div className="sticky top-24 z-40 space-y-4">
            <div className="group relative w-full">
              <Search className="group-focus-within:text-pixs-mint absolute top-1/2 left-6 -translate-y-1/2 text-slate-300 transition-colors" size={20} />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => { if (!user.isLoggedIn) { setIsLoginModalOpen(true); (document.activeElement as HTMLElement)?.blur(); } }}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Identify node sequence (e.g. SKU_902)..."
                className="focus:border-pixs-mint w-full rounded-3xl border border-slate-100 bg-white py-5 pr-12 pl-16 font-mono text-sm font-black text-slate-900 italic shadow-xl shadow-slate-200/20 transition-all focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <FilterDropdown label="Classification" icon={Layers} value={filters.category} options={categories} onChange={(v) => { setFilters({ ...filters, category: v }); setCurrentPage(1); }} />
              <FilterDropdown label="Rate Range" icon={Banknote} value={filters.price} options={priceRanges} onChange={(v) => { setFilters({ ...filters, price: v }); setCurrentPage(1); }} />
              <FilterDropdown label="Sort Protocol" icon={ArrowUpDown} value={filters.sort} options={sortOptions} onChange={(v) => { setFilters({ ...filters, sort: v }); setCurrentPage(1); }} />
              <FilterDropdown label="Active Status" icon={Activity} value={filters.status} options={statusOptions} onChange={(v) => { setFilters({ ...filters, status: v }); setCurrentPage(1); }} />
              <FilterDropdown label="Owned Plate" icon={Layers} value={filters.screenplate} options={plateOptions} onChange={(val) => { setFilters({ ...filters, screenplate: val }); setCurrentPage(1); }} />
            </div>
          </div>
        </div>

        <div className="HomepageOutputMatrix space-y-16">
          {hasError ? (
            <div className="space-y-8 rounded-[64px] border border-rose-100 bg-rose-50/50 py-20 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-rose-100"><Package size={48} className="text-rose-300" /></div>
              <h3 className="text-2xl font-black text-rose-500 uppercase italic">Something went wrong</h3>
              <button onClick={() => window.location.reload()} className="rounded-[24px] bg-rose-500 px-10 py-5 text-[10px] font-black tracking-[3px] text-white shadow-2xl transition-all hover:scale-105 hover:bg-rose-600">Retry Connection</button>
            </div>
          ) : (
            <Skeleton name="homepage-products" loading={isLoading}>
              {paginatedProducts.length > 0 ? (
                <div className="ProductGridContainer grid grid-cols-2 gap-4 md:gap-12 lg:grid-cols-4 xl:grid-cols-5">
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      soldCount={soldMap[product.id] || 0}
                      isFavorite={favorites.includes(product.id)}
                      isLoggedIn={user.isLoggedIn}
                      onToggleFavorite={(id) => checkAuthAndRun(() => toggleFavorite(id))}
                      onClick={(id) => checkAuthAndRun(() => navigate(`/product/${id}${filters.screenplate !== 'All Plates' ? `?plate=${encodeURIComponent(filters.screenplate)}` : ''}`))}
                      scrollPosition={scrollPosition}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-8 rounded-[64px] border border-dashed border-slate-100 bg-white py-40 text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-50"><Package size={48} className="text-slate-100" /></div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase italic">Null Node Cluster</h3>
                  <button onClick={resetFilters} className="rounded-[24px] bg-slate-900 px-10 py-5 text-[10px] font-black tracking-[3px] text-white uppercase shadow-2xl hover:scale-105">Clear Active Protocol</button>
                </div>
              )}
            </Skeleton>
          )}

          {totalPages > 1 && (
            <div className="HomepagePagination flex items-center justify-center gap-6">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="PaginationArrow hover:bg-pixs-mint flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 disabled:opacity-20"><ChevronLeft size={24} /></button>
              <div className="HomepagePaginationWrapper flex gap-3">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => handlePageChange(i + 1)} className={clsx('PaginationNumber flex h-12 w-12 items-center justify-center rounded-2xl text-[10px] font-black transition-all', currentPage === i + 1 ? 'PaginationActive bg-slate-900 text-white' : 'border border-slate-100 bg-white text-slate-400')}>{i + 1}</button>
                ))}
              </div>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="PaginationArrow hover:bg-pixs-mint flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 disabled:opacity-20"><ChevronRight size={24} /></button>
            </div>
          )}
        </div>
      </section>

      {!user.isLoggedIn && <PixsCommunitySection isLoggedIn={user.isLoggedIn} />}
      <Footer />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  )
}

const Homepage = trackWindowScroll(HomepageView);
export default Homepage;
