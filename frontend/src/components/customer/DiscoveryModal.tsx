import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Search, ArrowLeft, Heart, Plus, X, RotateCcw } from 'lucide-react'
import { clsx } from 'clsx'
import ProductImage from '../ProductImage/ProductImage'
import CategoryImage from '../CategoryImage/CategoryImage'
import gsap from 'gsap'
import { Link } from 'react-router-dom'
import { useDiscoveryCategories } from '../../hooks/useDiscoveryCategories'
import { useDiscoverySearch } from '../../hooks/useDiscoverySearch'
import { useDebounce } from '../../hooks/useDebounce'

// --- Interfaces ---
// ICategory and IProduct are imported from product.types.ts

const DiscoveryModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  initialCategory?: string | null
}> = ({ isOpen, onClose, initialCategory }) => {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [shouldRender, setShouldRender] = useState(isOpen)

  const modalRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const {
    categories,
    isLoading: catLoading,
    error: catError,
  } = useDiscoveryCategories(isOpen)
  const debouncedQuery = useDebounce(query, 350)
  const {
    results: filteredResults,
    isLoading: searchLoading,
    error: searchError,
  } = useDiscoverySearch({
    query: debouncedQuery,
    categoryId: selectedCategory,
  })

  // 1. Strict Scroll Lock Persistence
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => setShouldRender(true), 0)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // 2. Initial Setup logic
  useEffect(() => {
    // Wrap state updates in timeout if open or initialCategory change
    // to avoid "cascading renders" warning and ensure children exist for GSAP
    if (initialCategory) {
      setTimeout(() => {
        setSelectedCategory(initialCategory)
        setQuery('') // Essential: Clear query to show ALL products in category per request
      }, 0)
    } else if (isOpen) {
      setTimeout(() => {
        setSelectedCategory(null)
        setQuery('')
      }, 0)
    }
  }, [initialCategory, isOpen, categories])

  // 3. GSAP Precision Motion
  useLayoutEffect(() => {
    if (!shouldRender || !modalRef.current) return
    if (catLoading) return // Wait for data before animating children

    if (isOpen) {
      const tl = gsap.timeline()
      tl.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: 'power2.out' },
      )
      tl.fromTo(
        modalRef.current,
        { yPercent: 100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'expo.out',
          force3D: true,
        },
        '-=0.3',
      )

      if (gridRef.current && gridRef.current.children.length > 0) {
        tl.fromTo(
          gridRef.current.children,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.08,
            ease: 'power4.out',
          },
          '-=0.5',
        )
      }
    }
  }, [isOpen, shouldRender, catLoading])

  const handleClose = () => {
    if (!modalRef.current) return

    const tl = gsap.timeline({
      onComplete: () => {
        setShouldRender(false)
        onClose()
      },
    })

    tl.to(modalRef.current, {
      yPercent: 100,
      opacity: 0,
      duration: 0.5,
      ease: 'power4.in',
      force3D: true,
    })
    tl.to(overlayRef.current, { opacity: 0, duration: 0.3 }, '-=0.2')
  }

  if (!shouldRender) return null

  return (
    <div className="fixed inset-0 z-[9999] flex h-screen w-screen flex-col justify-end overflow-hidden">
      {/* Search Modal Backdrop Backdrop */}
      <div
        ref={overlayRef}
        onClick={handleClose}
        className="pointer-events-auto absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
      />

      {/* Modal Container: Scroll Lock Active View */}
      <div
        ref={modalRef}
        className="relative z-20 flex h-[92vh] w-full flex-col overflow-hidden rounded-t-[52px] bg-white shadow-2xl"
      >
        {/* Persistent Search Header */}
        <div className="sticky top-0 z-50 flex items-center gap-4 border-b border-slate-50 bg-white/80 p-6 backdrop-blur-md">
          <button
            onClick={handleClose}
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
              onChange={(e) => {
                setQuery(e.target.value)
              }}
              placeholder={
                selectedCategory
                  ? `Search in ${categories.find((c) => c.id === selectedCategory)?.label}...`
                  : 'SKU Code / Keyword Search Protocol'
              }
              className="focus:border-pixs-mint w-full rounded-2xl border border-slate-50 bg-slate-50 py-5 pr-14 pl-16 text-sm font-black text-slate-900 italic shadow-inner transition-all focus:bg-white focus:outline-none"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('')
                  setSelectedCategory(null)
                }}
                className="absolute top-1/2 right-6 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Discovery Hub - 2 COLUMN STRICT MODALITY */}
        <div className="custom-scrollbar flex-1 space-y-12 overflow-y-auto overscroll-contain p-6 pb-24 md:p-12">
          {!query && !selectedCategory && (
            <section className="w-full">
              <h3 className="mb-10 px-2 text-[10px] font-black tracking-[5px] text-slate-400 uppercase italic">
                Product Classification Matrix
              </h3>
              {catLoading && (
                <div className="grid w-full grid-cols-2 gap-4 md:gap-8">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square w-full animate-pulse rounded-[32px] bg-slate-100 md:rounded-[48px] lg:aspect-[21/9] lg:h-64"
                    />
                  ))}
                </div>
              )}

              {catError && !catLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-4 rounded-full bg-red-50 p-6">
                    <X className="text-red-400" size={32} />
                  </div>
                  <p className="mb-6 text-sm font-bold text-slate-500">
                    {catError}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-[10px] font-black tracking-widest text-white uppercase transition-all hover:bg-slate-800"
                  >
                    <RotateCcw size={14} /> Retry Matrix
                  </button>
                </div>
              )}

              {!catLoading && !catError && (
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

          {/* Results Projection */}
          {(query || selectedCategory) && (
            <section className="animate-in slide-in-from-bottom-8 space-y-8 duration-700">
              <div className="flex items-end justify-between border-b border-slate-50 pb-8">
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
                {searchError && (
                  <div className="flex items-center gap-4">
                    <p className="text-[10px] font-bold tracking-widest text-red-400 uppercase">
                      {searchError}
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="rounded-xl bg-red-50 p-3 text-red-500 transition-all hover:bg-red-100"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => {
                    setQuery('')
                    setSelectedCategory(null)
                  }}
                  className="hover:bg-pixs-mint rounded-xl bg-slate-900 px-6 py-3 text-[10px] font-black tracking-widest text-white uppercase transition-all"
                >
                  Reset Protocol
                </button>
              </div>

              {searchLoading && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-10 lg:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-[32px] bg-slate-100 md:rounded-[44px]"
                      style={{ aspectRatio: '1 / 1.4' }}
                    />
                  ))}
                </div>
              )}

              {!searchLoading && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-10 lg:grid-cols-4">
                  {filteredResults.map((product) => {
                    const isOutOfStock = !product.is_in_stock

                    const cardContent = (
                      <div className="group flex flex-col rounded-[32px] border border-slate-100 bg-white p-2 transition-all hover:shadow-2xl hover:shadow-slate-200/50 md:rounded-[44px]">
                        <div className="relative mb-4 aspect-square overflow-hidden rounded-[24px] border border-slate-50 bg-slate-50 shadow-inner transition-colors group-hover:bg-white md:rounded-[36px]">
                          <div
                            className={clsx(
                              'h-full w-full transition-all duration-700',
                              isOutOfStock && 'opacity-50 grayscale',
                            )}
                          >
                            <ProductImage
                              src={product.main_image}
                              alt={product.name}
                              skeletonClassName="rounded-[24px] md:rounded-[36px]"
                            />
                          </div>

                          {isOutOfStock && (
                            <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/10 backdrop-blur-[2px]">
                              <div className="rounded-2xl bg-slate-900 px-4 py-2 shadow-2xl">
                                <span className="text-[8px] font-black tracking-[3px] text-white uppercase italic">
                                  Sold Out
                                </span>
                              </div>
                            </div>
                          )}

                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                            className={clsx(
                              'absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-50 bg-white text-slate-200 shadow-sm backdrop-blur-md transition-all hover:text-rose-500 active:scale-90',
                              isOutOfStock && 'opacity-50 grayscale',
                            )}
                          >
                            <Heart size={18} />
                          </button>
                        </div>
                        <div className="flex flex-1 flex-col px-4 pb-4">
                          <span
                            className={clsx(
                              'mb-2 block text-[8px] font-black tracking-[2px] uppercase italic',
                              isOutOfStock
                                ? 'text-slate-300'
                                : 'text-slate-400',
                            )}
                          >
                            {product.category_label}
                          </span>
                          <h4
                            className={clsx(
                              'mb-4 truncate text-xs leading-tight font-black tracking-tighter uppercase italic transition-colors md:text-sm',
                              isOutOfStock
                                ? 'text-slate-400'
                                : 'group-hover:text-pixs-mint text-slate-900',
                            )}
                          >
                            {product.name}
                          </h4>
                          <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4">
                            <span
                              className={clsx(
                                'font-mono text-sm font-black tracking-tighter italic md:text-xl',
                                isOutOfStock
                                  ? 'text-slate-300'
                                  : 'text-slate-900',
                              )}
                            >
                              ₱{product.base_price.toLocaleString()}
                            </span>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                              className={clsx(
                                'flex h-10 w-10 items-center justify-center rounded-2xl shadow-md transition-all md:h-12 md:w-12',
                                isOutOfStock
                                  ? 'bg-slate-50 text-slate-200'
                                  : 'hover:bg-pixs-mint bg-slate-900 text-white group-hover:rotate-12 hover:text-slate-900 active:scale-95',
                              )}
                            >
                              <Plus size={20} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )

                    if (isOutOfStock) {
                      return (
                        <div
                          key={product.id}
                          className="cursor-not-allowed opacity-70"
                        >
                          {cardContent}
                        </div>
                      )
                    }

                    return (
                      <Link
                        key={product.id}
                        to={`/product/${encodeURIComponent(product.id)}`}
                        onClick={handleClose}
                      >
                        {cardContent}
                      </Link>
                    )
                  })}
                </div>
              )}

              {filteredResults.length === 0 && (
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

        {/* Persistent Category Bar at Bottom */}
        <div className="sticky bottom-0 z-50 border-t border-slate-50 bg-white/90 p-4 backdrop-blur-md">
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

export default DiscoveryModal
