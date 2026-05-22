import React, { useEffect, useState, useLayoutEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, PackageCheck } from 'lucide-react'

import { clsx } from 'clsx'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import gsap from 'gsap'
import toast from 'react-hot-toast'

// Core Technical Implementation Dependencies
import type { IProduct, IScreenPlate } from '../../types/product.types'
import { getProductById, getCustomerScreenplates } from '../../api/products.api'
import { addToCart, buyNowCart } from '../../api/cart.api'
import { useProductDetail } from './hooks/useProductDetail'
import { getStockStatus } from './utils/priceCalculator'

// Local Component Nodes
import ImageGallery from './components/ImageGallery'
import VariantSelector from './components/VariantSelector'
import QuantityPicker from './components/QuantityPicker'
import ColorPicker from './components/ColorPicker'
import PlateSelector from './components/PlateSelector'
import ProductInfoCard from './components/ProductInfoCard'
import PriceCalculatorUI from './components/PriceCalculatorUI'
import ProductReviews from './components/ProductReviews'
import FullscreenGalleryModal from '../../components/common/FullscreenGalleryModal'
import StockAlertModal from '../../components/Transactions/StockAlertModal'

// ─── Loading State UI Protocol ────────────────────────────────────────────────
const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={clsx('animate-pulse rounded-[44px] bg-slate-100', className)}
  />
)

// ─── Product Detail Inner Configuration (Data Hydrated) ───────────────────────
const ProductDetailInner: React.FC<{
  product: IProduct
  compatiblePlates: IScreenPlate[]
  preselectedPlateName?: string | null
}> = ({ product, compatiblePlates, preselectedPlateName }) => {
  const navigate = useNavigate()


  const mainImageUrl = product.main_image 
    ? `/images/products/${product.main_image}` 
    : ''
  const normalizedGallery = (product.gallery || []).map(
    (img) => `/images/gallery/${img}`
  )

  // Logic Engine Integration
  const { state, actions, computed } = useProductDetail({
    product,
    compatiblePlates,
    preselectedPlateName,
  })

  const stockStatus = getStockStatus(
    computed.stockForVariant,
    product.min_threshold ?? 5,
  )

  // Gallery Modal State Protocol
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)

  // Stock Alert State
  const [isStockAlertOpen, setIsStockAlertOpen] = useState(false)
  const [stockAlertItems, setStockAlertItems] = useState<{ name: string; requested: number; available: number }[]>([])

  // Automatic Top-0 Scroll Protocol
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [product.id])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.stagger-item', {
        opacity: 0,
        y: 40,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power4.out',
        clearProps: 'all',
      })
    })
    return () => ctx.revert()
  }, [])

  const handleAddToCart = async () => {
    const variant = computed.selectedVariant
    if (!variant) {
      toast.error('Please select a product variant.')
      return
    }

    // Cart ID Format: {product_id}__{variant_id}__{color_id_joined}__{screenplate_id}
    const colorIdPart =
      computed.selectedColors
        .map((c) => c.id)
        .sort()
        .join('-') || 'no-color'
    const compositeId = `${product.id}__${variant.variant_id}__${colorIdPart}__${computed.selectedPlate?.id ?? 'no-plate'}`

    try {
      await addToCart({
        id: compositeId,
        product_id: product.id,
        variant_id: variant.variant_id,
        screenplate_id: computed.selectedPlate?.id || null,
        quantity: state.quantity,
        unit_price: variant.price,
        plate_price: computed.selectedVariant && computed.selectedPlate
          ? (() => {
              const cp = computed.selectedPlate.compatibility.find(
                (c: { product_id: string }) => c.product_id === product.id
              );
              return cp?.print_price_per_unit?.[computed.selectedVariant.variant_id] ?? 
                     cp?.print_price_per_unit?.['ALL'] ?? 0;
            })()
          : 0,
        total_cart_price: computed.priceBreakdown.total,
        colors: computed.selectedColors.map((c, index) => ({
          color_id: c.id,
          id: c.id,
          channel_label:
            index === 0 ? 'Primary' : index === 1 ? 'Secondary' : 'Accent',
          channel_order: index,
        })),
        temp: false,
      })

      if ('vibrate' in navigator) {
        navigator.vibrate([80, 30, 80])
      }

      toast.custom(
        (t) => (
          <div
            className={clsx(
              'flex items-center gap-3 rounded-full bg-slate-900 px-6 py-4 text-white shadow-2xl transition-all duration-300',
              t.visible ? 'animate-[bounce_0.5s_ease-out]' : 'opacity-0 scale-95'
            )}
            style={{ animationFillMode: 'forwards' }}
          >
            <span className="text-xl">🛒✅</span>
            <span className="text-[10px] font-black tracking-widest uppercase">
              Added to cart!
            </span>
          </div>
        ),
        { duration: 2500 }
      )
    } catch (error) {
      console.error('Failed to add to cart:', error)
      toast.error('Failed to add product to cart.')
    }
  }

  const handleBuyNow = async () => {
    const variant = computed.selectedVariant
    if (!variant) {
      toast.error('Please select a product variant.')
      return
    }

    // Protocol: Check stock availability against requested quantity
    if (state.quantity > computed.stockForVariant) {
      setStockAlertItems([{
        name: product.name,
        requested: state.quantity,
        available: computed.stockForVariant,
      }])
      setIsStockAlertOpen(true)
      return
    }

    const colorIdPart =
      computed.selectedColors
        .map((c) => c.id)
        .sort()
        .join('-') || 'no-color'
    const compositeId = `${product.id}__${variant.variant_id}__${colorIdPart}__${computed.selectedPlate?.id ?? 'no-plate'}`

    try {
      await buyNowCart({
        id: compositeId,
        product_id: product.id,
        variant_id: variant.variant_id,
        screenplate_id: computed.selectedPlate?.id || null,
        quantity: state.quantity,
        unit_price: variant.price,
        plate_price: computed.selectedVariant && computed.selectedPlate
          ? (() => {
              const cp = computed.selectedPlate.compatibility.find(
                (c: { product_id: string }) => c.product_id === product.id
              );
              return cp?.print_price_per_unit?.[computed.selectedVariant.variant_id] ?? 
                     cp?.print_price_per_unit?.['ALL'] ?? 0;
            })()
          : 0,
        total_cart_price: computed.priceBreakdown.total,
        colors: computed.selectedColors.map((c, index) => ({
          color_id: c.id,
          id: c.id,
          channel_label:
            index === 0 ? 'Primary' : index === 1 ? 'Secondary' : 'Accent',
          channel_order: index,
        })),
        temp: true,
      })

      if ('vibrate' in navigator) navigator.vibrate([100])
      navigate('/transactions')
    } catch (e) {
      console.error('Failed to quick-checkout product:', e)
      toast.error('Failed to initialize quick checkout.')
    }
  }

  return (
    <div className="min-h-screen bg-white pb-15">
      <ToastContainer position="bottom-right" theme="dark" hideProgressBar />

      {/* Persistent Breadcrumb Architecture */}
      <div className="fixed top-0 lg:top-20 w-screen z-30 border-b border-slate-50 bg-white/60 px-6 py-5 backdrop-blur-3xl md:px-16">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase transition-all hover:text-slate-900 active:scale-95"
            >
              <ArrowLeft
                size={16}
                className="transition-transform group-hover:-translate-x-1"
              />{' '}
              <span className="hidden md:inline">Back to Homepage</span>
            </button>
            <div className="mx-2 h-4 w-px bg-slate-100" />
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
              {product.category_label}
            </span>
          </div>
          <button
            onClick={handleBuyNow}
            disabled={!computed.canAddToCart}
            className={clsx(
              'group relative flex items-center justify-center gap-4 overflow-hidden rounded-full px-6 py-2 transition-all duration-500 active:scale-[0.98]',
              computed.canAddToCart
                ? 'bg-slate-900 text-white shadow-xl hover:scale-[1.01]'
                : 'cursor-not-allowed bg-slate-100 text-slate-300 opacity-60 grayscale',
            )}
          >
            <span className="text-[10px] font-black tracking-tighter uppercase italic">
              {computed.canAddToCart ? (
                <>
                  <span className="hidden md:inline">BUY NOW</span>
                  <PackageCheck size={14} strokeWidth={3} className="md:hidden" />
                </>
              ) : computed.isOutOfStock ? (
                'OUT OF STOCK'
              ) : (
                'Selection Incomplete'
              )}
            </span>
            <PackageCheck size={14} strokeWidth={3} className="hidden md:block" />
          </button>
        </div>
      </div>

      {/* Master Content Logic Area */}
      <div className="mx-auto max-w-[1400px] px-6 pt-5 md:px-12 mt-15 lg:mt-40">
        <div className="grid grid-cols-1 items-start gap-20 lg:grid-cols-2 xl:gap-32">
          {/* ── Left Projection Space: Image Gallery ──────────────────────────── */}
          <div className="stagger-item lg:sticky top-56 lg:top-0">
            <ImageGallery
              mainImage={mainImageUrl}
              gallery={normalizedGallery}
              productName={product.name}
              onImageClick={(idx) => {
                setGalleryIndex(idx)
                setIsGalleryOpen(true)
              }}
            />
          </div>

          {/* ── Right Control Space: Order Configuration ──────────────────────── */}
          <div className="space-y-12">
            {/* Semantic Identity Identification */}
            <div className="stagger-item">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-[9px] font-black tracking-widest text-white uppercase">
                  SKU · {product.id}
                </span>
                <div
                  className={clsx(
                    'flex items-center gap-1.5',
                    stockStatus.color,
                  )}
                >
                  <div
                    className={clsx(
                      'h-1.5 w-1.5 animate-pulse rounded-full',
                      stockStatus.dot,
                    )}
                  />
                  <span className="text-[9px] font-black tracking-widest uppercase">
                    {stockStatus.label}
                  </span>
                </div>
              </div>
              <h1 className="mb-6 text-5xl leading-none font-black tracking-tighter text-slate-900 uppercase italic md:text-7xl">
                {product.name}
              </h1>
              <p className="pr-10 text-base leading-relaxed font-bold text-slate-500">
                {product.long_description}
              </p>

              {/* Detailed Product Specifications */}
              <ProductInfoCard
                product={product}
                selectedVariant={computed.selectedVariant}
              />
            </div>

            {/* Matrix Divider Protocol */}
            <div className="stagger-item h-px bg-slate-50" />

            {/* Selection Node: Variant Identification */}
            <div className="stagger-item">
              <VariantSelector
                variants={product.variants}
                selectedVariantId={state.selectedVariantId}
                onSelect={actions.setSelectedVariantId}
                minThreshold={product.min_threshold ?? 5}
                minOrder={product.min_order}
                variantCompatibilityMap={state.variantCompatibilityMap}
              />
            </div>

            {/* Selection Node: Master Color Inventory (Condition Protocol) */}
            {product.is_need_color && (
              <div className="stagger-item">
                <ColorPicker
                  colors={state.colors}
                  selectedColorIds={state.selectedColorIds}
                  maxChannels={computed.selectedPlate?.channels || 1}
                  onSelect={actions.handleColorChange}
                />
              </div>
            )}

            {/* Selection Node: Operational Quantity Unit Picker (with Quick Select) */}
            <div className="stagger-item">
              <QuantityPicker
                quantity={state.quantity}
                minOrder={product.min_order}
                maxStock={computed.stockForVariant}
                onChange={actions.setQuantity}
              />
            </div>

            {/* Selection Node: Screen Plate Logic Allocation (Filtered Inventory) */}
            {product.is_need_screenplate && (
              <>
                <div className="stagger-item">
                  <PlateSelector
                    selectablePlates={state.selectablePlates}
                    selectedPlateId={state.selectedPlateId}
                    onPlateChange={actions.handlePlateChange}
                    isRequired={product.is_need_screenplate}
                    productId={product.id}
                    selectedVariantSize={computed.selectedVariant?.size}
                    incompatiblePlateIds={state.incompatiblePlateIds}
                  />
                </div>
              </>
            )}

            {/* Dynamic Finalization Logic: Price Calculation UI (Inclusive Protocol) */}
            <div className="stagger-item border-t-4 border-slate-50 pt-8">
              <PriceCalculatorUI
                breakdown={computed.priceBreakdown}
                canAddToCart={computed.canAddToCart}
                isOutOfStock={computed.isOutOfStock}
                minOrder={product.min_order}
                isQuantityTooLow={computed.isQuantityTooLow}
                hasRequiredPlate={computed.hasRequiredPlate}
                isNeedScreenplate={product.is_need_screenplate}
                hasRequiredColor={computed.hasRequiredColor}
                isNeedColor={product.is_need_color}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                quantity={state.quantity}
                isStockInsufficient={computed.isStockInsufficient}
              />
            </div>

            {/* Detailed Technical Nodes Table */}
            <div className="stagger-item pt-12">
              <ProductReviews reviews={product.reviews} />
            </div>
          </div>
        </div>
      </div>

      {/* Stock Alert Modal */}
      <StockAlertModal
        isOpen={isStockAlertOpen}
        items={stockAlertItems}
        onClose={() => setIsStockAlertOpen(false)}
      />

      {/* Cinematic Fullscreen Viewing Hub */}
      <FullscreenGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={[mainImageUrl, ...normalizedGallery].filter(Boolean)}
        initialIndex={galleryIndex}
        productName={product.name}
      />
    </div>
  )
}

// ─── Component Entry Hook (Lifecycle Logic) ──────────────────────────────────
const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [product, setProduct] = useState<IProduct | null>(null)
  const [plates, setPlates] = useState<IScreenPlate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    let isMounted = true

    Promise.all([getProductById(id), getCustomerScreenplates()])
      .then(([prodRes, plsRes]) => {
        if (!isMounted) return
        if (!prodRes || prodRes.status === 'error') {
          setNotFound(true)
        } else {
          // Protocol: Automatic redirection if product is strictly out of stock
          if (prodRes.data.is_in_stock === false || prodRes.data.is_in_stock === 0) {
            navigate('/')
            return
          }
          setProduct(prodRes.data)
          const allPlates: IScreenPlate[] = plsRes.data || []
          const filtered = allPlates.filter((p) =>
            p.compatibility?.some((cp) => cp.product_id === prodRes.data.id),
          )
          setPlates(filtered)
        }
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Fetch error:', err)
        if (isMounted) setNotFound(true)
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [id, navigate])

  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const plateName = searchParams.get('plate')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pt-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-24 px-6 md:px-16 lg:grid-cols-2">
          <Skeleton className="aspect-[3/4]" />
          <div className="space-y-8">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-6 bg-slate-50 p-8 text-center italic">
        <h1 className="text-7xl font-black tracking-tighter text-slate-200 uppercase">
          NOT FOUND
        </h1>
        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
          The requested product could not be found or is unavailable.
        </p>
        <button
          onClick={() => window.history.back()}
          className="rounded-2xl bg-slate-900 px-10 py-4 text-[10px] font-black tracking-widest text-white uppercase"
        >
          Return To Market
        </button>
      </div>
    )
  }

  return (
    <ProductDetailInner
      key={product.id}
      product={product}
      compatiblePlates={plates}
      preselectedPlateName={plateName}
    />
  )
}

export default ProductDetailPage
