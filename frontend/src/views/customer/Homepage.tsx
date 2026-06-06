import React, { useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { m, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Activity,
  Printer,
  Heart,
  Package,
  Star,
  ShoppingBag,
  Home,
  Search,
  User,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { useCategories } from '../../hooks/useCategories'
import { useProducts } from '../../hooks/useProducts'
import { useSoldCounts } from '../../hooks/useSoldCounts'
import { useHomepageFavorites } from '../../hooks/useHomepageFavorites'
import { useCustomerScreenplates } from '../../hooks/useCustomerScreenplates'
// import { useDiscovery } from '../../context/DiscoveryContext'
import { useDebounce } from '../../hooks/useDebounce'

import hero1 from '../../assets/hero/hero-1.jpg'
import hero2 from '../../assets/hero/hero-2.jpg'
import hero3 from '../../assets/hero/hero-3.jpg'

// Components
import HeroCarousel from '../../components/HeroCarousel/HeroCarousel'
import QuickCategoryRow from '../../components/QuickCategoryRow/QuickCategoryRow'
import ProductGrid from '../../components/VirtualizedProductGrid/ProductGrid'
import Pagination from '../../components/Pagination/Pagination'
import Footer from '../../components/Footer/Footer'
import FilterDropdown from '../../components/FilterDropdown/FilterDropdown'



// Types
import type {
  HomepageProductFilters,
  HomepagePriceSort,
} from '../../types/homepage.types'

// ── Module-level constants ──────────────────────────────────────────────────

const HERO_SLIDES = [
  {
    src: hero1,
    title: 'Industrial Print.',
    sub: 'Custom cup printing for brands that demand precision.',
  },
  {
    src: hero2,
    title: 'Every Surface.',
    sub: 'From milktea cups to packaging — built for volume.',
  },
  {
    src: hero3,
    title: 'Your Logo. Our Craft.',
    sub: 'Screenplate printing with same-day turnaround.',
  },
] as const

const SORT_OPTIONS = [
  { label: 'Price: Low to High', value: 'LOW_TO_HIGH' },
  { label: 'Price: High to Low', value: 'HIGH_TO_LOW' },
  { label: 'Most Sold', value: 'MOST_SOLD' },
  { label: 'Highest Rating', value: 'HIGHEST_RATING' },
  { label: 'A to Z', value: 'A_TO_Z' },
  { label: 'Z to A', value: 'Z_TO_A' },
] as const

const STATUS_OPTIONS = [
  { label: 'All Status', value: 'ALL' },
  { label: 'In Stock', value: 'IN_STOCK' },
  { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
] as const

// ── Component ───────────────────────────────────────────────────────────────

const Homepage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  // const { openDiscovery } = useDiscovery()
  const productGridRef = useRef<HTMLDivElement>(null)

  // Screen size detection for itemsPerPage and Filter layout
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1280)
  const [showFilters, setShowFilters] = useState(false)

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1280)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auth guard wrapper
  const checkAuthAndRun = useCallback(
    (action: () => void) => {
      if (!user?.isLoggedIn) {
        navigate('/login')
        return
      }
      action()
    },
    [user?.isLoggedIn, navigate],
  )

  // Search state (Used by debounced hook but UI search bar is removed as per request)
  // We keep it in case Navbar search is connected here via some global state later,
  // but for now we just keep it for useProducts requirement.
  const [rawSearch] = useState('')
  const debouncedSearch = useDebounce(rawSearch, 350)

  // Filters state
  const [filters, setFilters] = useState<HomepageProductFilters>({
    priceSort: 'LOW_TO_HIGH',
    category: 'ALL',
    availability: 'ALL',
    favoritesOnly: false,
    screenplateId: 'ALL',
    minRating: 'ALL',
    soldFilter: 'ALL',
  })

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = isMobile ? 20 : 100


  // Data fetching
  const { categories, isLoading: catLoading } = useCategories()
  const { screenplates } = useCustomerScreenplates()
  const { favoriteIds, toggleFavorite } = useHomepageFavorites()
  const { soldMap } = useSoldCounts()

  const categoryLabel = useMemo(() => {
    if (filters.category === 'ALL') return undefined
    return categories.find((c) => c.id === filters.category)?.label
  }, [filters.category, categories])

  const sortValue = useMemo(() => {
    const opt = SORT_OPTIONS.find((o) => o.value === filters.priceSort)
    return opt ? opt.label : 'Price: Low to High'
  }, [filters.priceSort])

  const {
    products,
    totalPages,
    isLoading: prodLoading,
  } = useProducts({
    search: debouncedSearch,
    category: categoryLabel,
    sort: sortValue,
    most_sold:
      filters.priceSort === 'MOST_SOLD' || filters.soldFilter === 'MOST_SOLD',
    min_rating: filters.minRating === 'ALL' ? undefined : filters.minRating,
    status: filters.availability === 'IN_STOCK' ? 'In Stock' : filters.availability === 'OUT_OF_STOCK' ? 'Out of Stock' : undefined,
    screenplate_id:
      filters.screenplateId === 'ALL' ? undefined : filters.screenplateId,
    page: currentPage,
    per_page: itemsPerPage,
  })

  const filteredProducts = useMemo(() => {
    let result = [...products]
    if (filters.favoritesOnly) {
      result = result.filter((p) => favoriteIds.includes(p.id))
    }
    return result
  }, [products, filters.favoritesOnly, favoriteIds])

  // Derived data
  const quickCategories = useMemo(() => categories.slice(0, 4), [categories])

  // Handlers
  const handleCategoryChange = useCallback(
    (label: string | null) => {
      if (!label || label === 'All') {
        setFilters((prev) => ({ ...prev, category: 'ALL' }))
        setCurrentPage(1)
        return
      }
      const cat = categories.find((c) => c.label === label)
      setFilters((prev) => ({ ...prev, category: cat ? cat.id : 'ALL' }))
      setCurrentPage(1)
    },
    [categories],
  )

  const handleCategoryIdSelect = useCallback(
    (id: string) => {
      navigate('/discovery', { state: { categoryId: id } })
    },
    [navigate],
  )

  const handleSortChange = useCallback((val: string | null) => {
    const opt = SORT_OPTIONS.find((o) => o.label === val)
    if (opt) {
      setFilters((prev) => ({
        ...prev,
        priceSort: opt.value as HomepagePriceSort,
      }))
      setCurrentPage(1)
    }
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    productGridRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [])

  const handleProductClick = useCallback(
    (id: string) => {
      checkAuthAndRun(() => navigate(`/product/${encodeURIComponent(id)}`))
    },
    [checkAuthAndRun, navigate],
  )

  const handleToggleFavorite = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      toggleFavorite(id)
    },
    [toggleFavorite],
  )

  return (
    <div className="flex min-h-screen flex-col items-center bg-white mt-0 md:mt-20 pb-20 md:pb-0">
      {/* Hero Section - Matching OrderPage Spaciousness */}
      <section
        className="relative w-full overflow-hidden pb-10"
        aria-label="Featured Services"
      >
        {/* Decorative Blurred Circle from OrderPage */}
        <div className="bg-pixs-mint/10 absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full blur-[100px]" />

        <div className="relative mx-auto max-w-[1873px] px-6 pt-32 pb-6 md:px-16 md:pt-8">
          <div className="w-full overflow-hidden rounded-[30px] shadow-2xl md:rounded-[64px]">
            <HeroCarousel
              slides={HERO_SLIDES}
              onCTA={() => {
                const el = document.getElementById('marketplace')
                if (el)
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            />
          </div>
        </div>
      </section>

      {/* Categories Row (Production Line) */}
      <section
        className="mx-auto w-full max-w-[1873px] px-4 md:px-16"
        aria-label="Product Categories"
      >
        <div className="mb-6 flex items-end justify-between md:mb-12">
          <div>
            <h3 className="mb-2 text-2xl leading-none font-black tracking-tighter text-slate-900 uppercase italic md:mb-4 md:text-6xl">
              Production Line
            </h3>
            <p className="text-[10px] font-bold tracking-[3px] text-slate-400 uppercase md:text-sm md:tracking-[4px]">
              Select your substrate matrix
            </p>
          </div>
        </div>
        <QuickCategoryRow
          categories={quickCategories}
          isLoading={catLoading}
          onCategoryClick={handleCategoryIdSelect}
          onMoreClick={() => navigate('/discovery')}
        />
      </section>

      {/* Product Marketplace Section */}
      <div className="relative w-full">
        <div className="fuzzy-overlay pointer-events-none absolute inset-0 opacity-[0.03]" />

        <section
          id="marketplace"
          ref={productGridRef}
          className="relative bg-slate-50/50 px-4 py-12 md:px-16 md:py-32"
          aria-label="Product Marketplace"
        >
          <div className="mx-auto max-w-[1873px]">
            <div className="mb-12 flex flex-col gap-6 md:mb-20 md:gap-10">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                  <h2 className="mb-2 text-3xl leading-none font-black tracking-tighter text-slate-900 uppercase italic md:mb-4 md:text-8xl">
                    The{' '}
                    <span className="text-slate-400 opacity-50">
                      Marketplace
                    </span>
                  </h2>
                  <p className="text-[10px] font-bold tracking-[3px] text-slate-400 uppercase md:text-sm md:tracking-[4px]">
                    Access the industrial registry
                  </p>
                </div>
              </div>

              {/* Filter Toggle Button (Mobile/Tablet Only) */}
              <div className="xl:hidden">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-3.5 text-[10px] font-black tracking-widest text-white uppercase shadow-xl shadow-slate-200 transition-all active:scale-95"
                >
                  <Activity
                    size={14}
                    className={
                      showFilters
                        ? 'rotate-180 transition-transform'
                        : 'transition-transform'
                    }
                  />
                  <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
                </button>
              </div>

              {/* Filter Bar */}
              <AnimatePresence>
                {(showFilters || !isMobile) && (
                  <m.div
                    initial={isMobile ? { height: 0, opacity: 0 } : false}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="sticky top-[80px] z-[100] -mx-4 flex flex-col items-center justify-between gap-6 bg-slate-50/80 px-8 py-2 backdrop-blur-sm xl:flex-row xl:bg-transparent"
                  >
                    <div className="flex w-full flex-wrap items-center gap-3 xl:w-auto">
                      {/* Category Filter Dropdown */}
                      <FilterDropdown
                        label="Divisions"
                        icon={Package}
                        options={['All', ...categories.map((c) => c.label)]}
                        value={
                          categories.find((c) => c.id === filters.category)
                            ?.label || 'All'
                        }
                        onChange={handleCategoryChange}
                      />

                      {/* Rating Filter Dropdown */}
                      <FilterDropdown
                        label="Ratings"
                        icon={Star}
                        options={['All', 'Perfect 5.0', '4.5 & up', '4.0 & up']}
                        value={
                          filters.minRating === 5
                            ? 'Perfect 5.0'
                            : filters.minRating === 4.5
                              ? '4.5 & up'
                              : filters.minRating === 4
                                ? '4.0 & up'
                                : 'All'
                        }
                        onChange={(label) => {
                          setFilters((prev) => ({
                            ...prev,
                            minRating:
                              label === 'Perfect 5.0'
                                ? 5
                                : label === '4.5 & up'
                                  ? 4.5
                                  : label === '4.0 & up'
                                    ? 4
                                    : 'ALL',
                          }))
                          setCurrentPage(1)
                        }}
                      />

                      {/* Sold Filter Dropdown */}
                      <FilterDropdown
                        label="Sales"
                        icon={ShoppingBag}
                        options={['All', 'Most Sold']}
                        value={
                          filters.soldFilter === 'MOST_SOLD'
                            ? 'Most Sold'
                            : 'All'
                        }
                        onChange={(label) => {
                          setFilters((prev) => ({
                            ...prev,
                            soldFilter:
                              label === 'Most Sold' ? 'MOST_SOLD' : 'ALL',
                          }))
                          setCurrentPage(1)
                        }}
                      />

                      {/* Favorite Toggle Filter */}
                      <button
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            favoritesOnly: !prev.favoritesOnly,
                          }))
                          setCurrentPage(1)
                        }}
                        className={`flex items-center gap-2.5 rounded-2xl border px-5 py-3.5 text-[10px] font-black tracking-widest uppercase transition-all ${
                          filters.favoritesOnly
                            ? 'border-rose-500 bg-rose-50 text-rose-500 shadow-xl shadow-rose-200/50'
                            : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        <Heart
                          size={14}
                          className={
                            filters.favoritesOnly ? 'fill-rose-500' : ''
                          }
                        />
                        <span>Favorites</span>
                      </button>
                    </div>

                    <div className="flex w-full flex-wrap items-center justify-start gap-3 xl:w-auto xl:justify-end">
                      <FilterDropdown
                        label="Sort"
                        icon={TrendingUp}
                        options={SORT_OPTIONS.map((o) => o.label)}
                        value={
                          SORT_OPTIONS.find(
                            (o) => o.value === filters.priceSort,
                          )?.label || 'Price: Low to High'
                        }
                        onChange={handleSortChange}
                      />
                      <FilterDropdown
                        label="Stock"
                        icon={Activity}
                        options={STATUS_OPTIONS.map((o) => o.label)}
                        value={
                          STATUS_OPTIONS.find(
                            (o) => o.value === filters.availability,
                          )?.label || 'All Status'
                        }
                        onChange={(label) => {
                          setFilters((prev) => ({
                            ...prev,
                            availability:
                              STATUS_OPTIONS.find(
                                (o) => o.label === (label as string),
                              )?.value || 'ALL',
                          }))
                          setCurrentPage(1)
                        }}
                      />
                      <FilterDropdown
                        label="Press"
                        icon={Printer}
                        options={[
                          'All',
                          ...screenplates.map((s) => s.plate_name),
                        ]}
                        value={
                          screenplates.find(
                            (s) => s.id === filters.screenplateId,
                          )?.plate_name || 'All'
                        }
                        onChange={(label) => {
                          setFilters((prev) => ({
                            ...prev,
                            screenplateId:
                              screenplates.find((s) => s.plate_name === label)
                                ?.id || 'ALL',
                          }))
                          setCurrentPage(1)
                        }}
                      />
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              <m.div
                key={`${filters.category}-${filters.priceSort}-${debouncedSearch}-${currentPage}-${itemsPerPage}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <ProductGrid
                  products={filteredProducts}
                  isLoading={prodLoading}
                  soldMap={soldMap}
                  favorites={favoriteIds}
                  onFavClick={handleToggleFavorite}
                  onProductClick={handleProductClick}
                />

                <div className="mt-20">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onChange={handlePageChange}
                  />
                </div>
              </m.div>
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 md:hidden z-50">
        <div className="flex justify-around items-center">
          <button className="flex flex-col items-center gap-1 p-2 active:scale-95 transition-transform">
            <Home size={20} className="text-emerald-500" />
            <span className="text-[9px] font-bold text-emerald-500">Home</span>
          </button>
          <button onClick={() => navigate('/discovery')} className="flex flex-col items-center gap-1 p-2 active:scale-95 transition-transform">
            <Search size={20} className="text-slate-400" />
            <span className="text-[9px] font-bold text-slate-400">Discover</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 active:scale-95 transition-transform">
            <ShoppingBag size={20} className="text-slate-400" />
            <span className="text-[9px] font-bold text-slate-400">Orders</span>
          </button>
          <button onClick={() => navigate('/account')} className="flex flex-col items-center gap-1 p-2 active:scale-95 transition-transform">
            <User size={20} className="text-slate-400" />
            <span className="text-[9px] font-bold text-slate-400">Account</span>
          </button>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Homepage
