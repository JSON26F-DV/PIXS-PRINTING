import React, { useState, useEffect, useRef } from 'react'
import { Search, ArrowLeft, X, RotateCcw } from 'lucide-react'
import CategoryImage from '../../components/CategoryImage/CategoryImage'
import gsap from 'gsap'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDiscoveryCategories } from '../../hooks/useDiscoveryCategories'
import { useDiscoverySearch } from '../../hooks/useDiscoverySearch'
import { useDebounce } from '../../hooks/useDebounce'
import ProductCard from '../../components/ProductCard/ProductCard'
import { useHomepageFavorites } from '../../hooks/useHomepageFavorites'
import { useSoldCounts } from '../../hooks/useSoldCounts'
import type { IProduct } from '../../types/product.types'

const DiscoveryPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Try to get initial category from location state
  const initialCategory = location.state?.categoryId || null

  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory)
  const gridRef = useRef<HTMLDivElement>(null)

  const {
    categories,
    isLoading: catLoading,
    error: catError,
  } = useDiscoveryCategories(true) // Always active since it's a page
  
  const debouncedQuery = useDebounce(query, 350)
  const {
    results: filteredResults,
    isLoading: searchLoading,
    error: searchError,
  } = useDiscoverySearch({
    query: debouncedQuery,
    categoryId: selectedCategory,
  })

  // Favorites logic
  const { favoriteIds, toggleFavorite } = useHomepageFavorites()
  const { soldMap } = useSoldCounts()

  // Animation on mount
  useEffect(() => {
    if (!catLoading && gridRef.current && gridRef.current.children.length > 0) {
      gsap.fromTo(
        gridRef.current.children,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.05,
          ease: 'power3.out',
        }
      )
    }
  }, [catLoading, selectedCategory, query])

  const handleReset = () => {
    setQuery('')
    setSelectedCategory(null)
  }

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-white mb-20! pb-20!">
      {/* Search Header */}
      <div className="sticky top-0 z-50 flex items-center gap-4 border-b border-slate-50 bg-white/80 p-4 backdrop-blur-md md:p-6">
        <button
          onClick={handleBack}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 active:scale-90"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="group relative flex-1">
          <Search
            className="group-focus-within:text-pixs-mint absolute top-1/2 left-6 -translate-y-1/2 text-slate-300 transition-colors"
            size={20}
          />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              selectedCategory
                ? `Search in ${categories.find((c) => c.id === selectedCategory)?.label}...`
                : 'SKU Code / Keyword Search Protocol'
            }
            className="focus:border-pixs-mint w-full rounded-2xl border border-slate-50 bg-slate-50 py-4 pr-14 pl-16 text-sm font-black text-slate-900 italic shadow-inner transition-all focus:bg-white focus:outline-none md:py-5"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-6 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="custom-scrollbar mx-auto max-w-7xl space-y-12 p-4 pb-32 md:p-12">
        {!query && !selectedCategory && (
          <section className="w-full">
            <h3 className="mb-10 px-2 text-[10px] font-black tracking-[5px] text-slate-400 uppercase italic">
              Product Classification Matrix
            </h3>
            
            {catLoading ? (
              <div className="grid w-full grid-cols-2 gap-4 md:gap-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square w-full animate-pulse rounded-[32px] bg-slate-100 md:rounded-[48px] lg:aspect-[21/9] lg:h-64"
                  />
                ))}
              </div>
            ) : catError ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 rounded-full bg-red-50 p-6">
                  <X className="text-red-400" size={32} />
                </div>
                <p className="mb-6 text-sm font-bold text-slate-500">{catError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-[10px] font-black tracking-widest text-white uppercase transition-all hover:bg-slate-800"
                >
                  <RotateCcw size={14} /> Retry Matrix
                </button>
              </div>
            ) : (
              <div
                ref={gridRef}
                className="grid w-full grid-cols-2 gap-4 md:gap-8"
              >
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id)
                      setQuery('')
                    }}
                    className="group hover:shadow-pixs-mint/20 relative aspect-square w-full overflow-hidden rounded-[32px] border border-slate-100 bg-slate-100 shadow-xl transition-all duration-500 hover:shadow-2xl md:rounded-[48px] lg:aspect-[21/9] lg:h-64"
                  >
                    <CategoryImage src={cat.image} alt={cat.label} />
                    <div className="group-hover:via-pixs-mint/40 absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent transition-all duration-700" />

                    <div className="absolute inset-0 flex flex-col items-start justify-end p-8 text-left">
                      <span className="mb-2 text-base leading-none font-black tracking-tighter text-white uppercase italic drop-shadow-2xl md:text-3xl">
                        {cat.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="bg-pixs-mint h-1.5 w-1.5 animate-pulse rounded-full shadow-[0_0_8px_#75EEA5]" />
                        <span className="text-[9px] font-bold tracking-widest text-white/50 uppercase transition-colors group-hover:text-white">
                          Cluster: Ready
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Results */}
        {(query || selectedCategory) && (
          <section className="animate-in slide-in-from-bottom-8 space-y-8 duration-700">
            <div className="flex flex-col gap-4 border-b border-slate-50 pb-8 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Projection Active{' '}
                  {selectedCategory &&
                    `· ${categories.find((c) => c.id === selectedCategory)?.label}`}
                </p>
                <h2 className="text-3xl leading-none font-black tracking-tighter text-slate-900 uppercase italic">
                  Units Identified: {filteredResults.length}
                </h2>
              </div>
              <div className="flex items-center gap-4">
                {searchError && (
                  <p className="text-[10px] font-bold tracking-widest text-red-400 uppercase">
                    {searchError}
                  </p>
                )}
                <button
                  onClick={handleReset}
                  className="hover:bg-pixs-mint w-full rounded-xl bg-slate-900 px-6 py-3 text-[10px] font-black tracking-widest text-white uppercase transition-all md:w-auto"
                >
                  Reset Protocol
                </button>
              </div>
            </div>

            {searchLoading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-10 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square animate-pulse rounded-[32px] bg-slate-100 md:rounded-[44px]"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-10 lg:grid-cols-4">
                {filteredResults.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product as unknown as IProduct}
                    soldCount={soldMap[product.id] ?? 0}
                    isFav={favoriteIds.includes(product.id)}
                    onFavClick={() => toggleFavorite(product.id)}
                    onClick={() => navigate(`/product/${encodeURIComponent(product.id)}`)}
                  />
                ))}
              </div>
            )}

            {filteredResults.length === 0 && !searchLoading && (
              <div className="space-y-4 py-32 text-center text-slate-200">
                <Search size={64} className="mx-auto opacity-20" />
                <p className="text-[10px] font-black tracking-[8px] uppercase">
                  Null Sequence Found
                </p>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Floating Category Bar */}
      <div className="fixed bottom-0 z-50 w-full border-t border-slate-50 bg-white/90 p-4 backdrop-blur-md">
        <div className="mx-auto max-w-7xl">
          <div className="custom-scrollbar no-scrollbar flex items-center gap-4 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id)
                  setQuery('')
                }}
                className={`rounded-xl border px-6 py-3 text-[10px] font-black tracking-widest whitespace-nowrap uppercase transition-all active:scale-95 ${
                  selectedCategory === cat.id
                    ? 'border-pixs-mint bg-pixs-mint text-slate-900'
                    : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiscoveryPage
