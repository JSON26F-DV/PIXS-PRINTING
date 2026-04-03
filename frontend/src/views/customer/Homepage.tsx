import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import productsData from '../../data/products.json'
import categoriesData from '../../data/categories.json'
import screenplateData from '../../data/screenplate.json'
import orderData from '../../data/order.json'
import { useDiscovery } from '../../context/DiscoveryContext'
import Footer from '../../components/Footer/Footer'
import type { IProduct, IScreenPlate } from '../../types/product.types'

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

// Using central IScreenPlate from product.types.ts

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

const Storefront: React.FC = () => {
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0)
  const [favorites, setFavorites] = useState<string[]>(() => {
    // Initializing from terminal storage
    const saved = localStorage.getItem('pixs_favorites')
    return saved ? JSON.parse(saved) : []
  })
  const { openDiscovery } = useDiscovery()

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
    (orderData as { items: { productId: string; quantity: number }[] }[]).forEach(order => {
      order.items?.forEach(p => {
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
    if (newPage < 1 || newPage > totalPages) return
    setCurrentPage(newPage)
    
    // Smooth scroll to marketplace node top
    if (marketplaceRef.current) {
      const topOffset = marketplaceRef.current.getBoundingClientRect().top + window.scrollY - 100
      window.scrollTo({ top: topOffset, behavior: 'smooth' })
    }
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
                onClick={() => openDiscovery()}
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
            onClick={() => openDiscovery()}
            className="text-pixs-mint flex items-center gap-2 text-xs font-black tracking-widest uppercase hover:underline"
          >
            Full Map <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
          {quickCategories.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => openDiscovery(cat.id)}
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
            onClick={() => openDiscovery()}
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

      {/* 3. Marketplace Command Center (Dropdown Refactor) */}
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
                    const plateParam = filters.screenplate !== 'All Plates' ? `?plate=${encodeURIComponent(filters.screenplate)}` : '';
                    navigate(`/product/${product.id}${plateParam}`);
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
                        toggleFavorite(product.id);
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
                        <span className="text-[9px] font-black text-rose-500 tracking-tighter md:text-sm">
                          Min: ₱{((product.base_price || 0) * (product.min_order || 1)).toLocaleString()}
                        </span>
                        <span className="font-mono text-[10px] leading-none font-black tracking-tighter text-slate-900 italic md:text-lg">
                          ₱{product.base_price.toLocaleString()}/pc
                        </span>
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

      {/* 5. Professional Footer Identity */}
      <Footer />
    </div>
  )
}

export default Storefront
