import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useLayoutEffect,
} from 'react'
import { Search, ArrowLeft, Heart, Plus, Package, X } from 'lucide-react'
import gsap from 'gsap'
import { Link } from 'react-router-dom'
import productsData from '../../data/products.json'
import categoriesData from '../../data/categories.json'

// --- Interfaces ---
interface IProduct {
  id: string
  name: string
  category: string
  base_price: number
  current_stock: number
}

interface ICategory {
  id: string
  label: string
  count: number
  image: string
}

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

  const categories = categoriesData as ICategory[]

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
    if (initialCategory) {
      setTimeout(() => {
        setSelectedCategory(initialCategory)
        setQuery(initialCategory)
      }, 0)
    } else if (isOpen) {
      setTimeout(() => {
        setSelectedCategory(null)
        setQuery('')
      }, 0)
    }
  }, [initialCategory, isOpen])

  // 3. GSAP Precision Motion
  useLayoutEffect(() => {
    if (!shouldRender || !modalRef.current) return

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

      if (gridRef.current) {
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
  }, [isOpen, shouldRender])

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

  const filteredResults = useMemo(() => {
    if (!query && !selectedCategory) return []
    return (productsData as IProduct[]).filter((p) => {
      const matchQuery =
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.id.toLowerCase().includes(query.toLowerCase())
      const matchCategory =
        !selectedCategory || p.category.includes(selectedCategory)
      return matchQuery && matchCategory
    })
  }, [query, selectedCategory])

  if (!shouldRender) return null

  return (
    <div className="fixed inset-0 z-[100] flex h-screen w-screen flex-col justify-end overflow-hidden">
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
                setSelectedCategory(null)
              }}
              placeholder="SKU Code / Keyword Search Protocol"
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
        <div className="custom-scrollbar flex-1 space-y-12 overflow-y-auto p-6 pb-24 md:p-12">
          {!query && !selectedCategory && (
            <section className="w-full">
              <h3 className="mb-10 px-2 text-[10px] font-black tracking-[5px] text-slate-400 uppercase italic">
                Product Classification Matrix
              </h3>
              <div
                ref={gridRef}
                className="grid w-full grid-cols-2 gap-4 md:gap-8"
              >
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id)
                      setQuery(cat.label)
                    }}
                    className="group hover:shadow-pixs-mint/20 relative aspect-square w-full overflow-hidden rounded-[32px] border border-slate-100 bg-slate-100 shadow-xl transition-all duration-500 hover:shadow-2xl md:rounded-[48px] lg:aspect-[21/9] lg:h-64"
                  >
                    <img
                      src={cat.image}
                      alt={cat.label}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
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
            </section>
          )}

          {/* Results Projection */}
          {(query || selectedCategory) && (
            <section className="animate-in slide-in-from-bottom-8 space-y-8 duration-700">
              <div className="flex items-end justify-between border-b border-slate-50 pb-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Projection Active
                  </p>
                  <h2 className="text-3xl leading-none font-black tracking-tighter text-slate-900 uppercase italic">
                    Units Identified: {filteredResults.length}
                  </h2>
                </div>
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

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-10 lg:grid-cols-4">
                {filteredResults.map((product) => (
                  <div
                    key={product.id}
                    className="group flex flex-col rounded-[32px] border border-slate-100 bg-white p-2 transition-all hover:shadow-2xl hover:shadow-slate-200/50 md:rounded-[44px]"
                  >
                    <div className="relative mb-4 aspect-square overflow-hidden rounded-[24px] border border-slate-50 bg-slate-50 shadow-inner transition-colors group-hover:bg-white md:rounded-[36px]">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="group-hover:text-pixs-mint/10 h-12 w-12 text-slate-100 transition-colors" />
                      </div>
                      <button className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-50 bg-white text-slate-200 shadow-sm backdrop-blur-md transition-all hover:text-rose-500 active:scale-90">
                        <Heart size={18} />
                      </button>
                    </div>
                    <div className="flex flex-1 flex-col px-4 pb-4">
                      <span className="mb-2 block text-[8px] font-black tracking-[2px] text-slate-400 uppercase italic">
                        {product.category}
                      </span>
                      <Link to={`/product/${product.id}`} onClick={onClose}>
                        <h4 className="group-hover:text-pixs-mint mb-4 truncate text-xs leading-tight font-black tracking-tighter text-slate-900 uppercase italic transition-colors md:text-sm">
                          {product.name}
                        </h4>
                      </Link>
                      <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4">
                        <span className="font-mono text-sm font-black tracking-tighter text-slate-900 italic md:text-xl">
                          ₱{product.base_price.toLocaleString()}
                        </span>
                        <button className="hover:bg-pixs-mint flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md transition-all group-hover:rotate-12 hover:text-slate-900 active:scale-95 md:h-12 md:w-12">
                          <Plus size={20} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

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
      </div>
    </div>
  )
}

export default DiscoveryModal
