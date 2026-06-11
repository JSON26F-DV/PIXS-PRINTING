import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  FiUploadCloud,
  FiSearch,
  FiX,
  FiCheckCircle,
  FiInfo,
  FiAlertTriangle,
  FiPackage,
  FiLayers,
  FiAlignCenter,
  FiImage,
  FiMessageSquare,
  FiShield,
  FiClock,
  FiAlertCircle,
} from 'react-icons/fi'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getProducts } from '../../api/products.api'
import { createScreenplateRequest } from '../../api/screenplate.api'
import type { IProduct, IProductVariant } from '../../types/product.types'
import BoxFallback from '../../components/common/BoxFallback'
import axiosInstance from '../../lib/axiosInstance.ts'
import { useNotificationStore } from '../../store/useNotificationStore'

// ─── Image Upload Alert Modal ─────────────────────────────────────────────────

interface ImageUploadAlertProps {
  open: boolean
  onClose: () => void
  message: string
}

const ImageUploadAlert: React.FC<ImageUploadAlertProps> = ({ open, onClose, message }) => {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative flex w-full max-w-sm flex-col rounded-[28px] border border-slate-100 bg-white shadow-2xl">
        <div className="px-8 pt-8 pb-6">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-rose-100">
            <FiAlertTriangle className="text-rose-600" size={24} />
          </div>
          <p className="text-center text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
            Invalid File
          </p>
          <h2 className="mt-1 text-center text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
            Upload Failed
          </h2>
          <p className="mt-3 text-center text-sm font-medium text-slate-600">
            {message}
          </p>
          <div className="mt-6 rounded-[14px] bg-slate-50 p-4">
            <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
              Allowed Formats
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {['JPG', 'JPEG', 'PNG', 'WebP'].map((fmt) => (
                <span key={fmt} className="rounded-lg bg-slate-200 px-3 py-1 text-[10px] font-black tracking-widest text-slate-700 uppercase">
                  {fmt}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[10px] font-black tracking-widest text-slate-500 uppercase">
              Max Size
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">3 MB</p>
          </div>
        </div>
        <div className="border-t border-slate-100 px-8 py-6">
          <button type="button"
            onClick={onClose}
            className="w-full rounded-[14px] border-2 border-slate-900 bg-slate-900 py-3.5 text-[10px] font-black tracking-[3px] text-white uppercase italic shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Review Modal ────────────────────────────────────────────────────────────

interface ReviewModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isSubmitting: boolean
  data: {
    product: IProduct | null
    variant: IProductVariant | null
    colorCount: number
    alignment: string
    referenceImage: string | null
    comment: string
    total: number
    baseFee: number
  }
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  open,
  onClose,
  onConfirm,
  isSubmitting,
  data,
}) => {
  if (!open) return null

  const rows = [
    {
      icon: <FiPackage className="shrink-0 text-slate-400" />,
      label: 'Product',
      value: data.product?.name ?? '—',
    },
    {
      icon: <FiLayers className="shrink-0 text-slate-400" />,
      label: 'Variant / Size',
      value: data.variant?.size ?? '—',
    },
    {
      icon: <FiLayers className="shrink-0 text-slate-400" />,
      label: 'Color Separation',
      value: data.colorCount ? `${data.colorCount} Color${data.colorCount > 1 ? 's' : ''}` : '—',
    },
    {
      icon: <FiAlignCenter className="shrink-0 text-slate-400" />,
      label: 'Print Alignment',
      value: data.alignment || '—',
    },
    {
      icon: <FiImage className="shrink-0 text-slate-400" />,
      label: 'Brand Reference',
      value: data.referenceImage ? 'Uploaded' : 'None',
    },
    {
      icon: <FiMessageSquare className="shrink-0 text-slate-400" />,
      label: 'Instructions',
      value: data.comment.trim() || 'None',
    },
  ]

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Modal Card */}
      <div className="relative flex w-full max-w-md flex-col rounded-[28px] border border-slate-100 bg-white shadow-2xl">
        {/* Close */}
        <button type="button"
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <FiX size={16} />
        </button>

        {/* Header */}
        <div className="border-b border-slate-100 px-8 pt-8 pb-6">
          <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
            Order Review
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
            Confirm Setup
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Please review your screenplate request before locking it in.
          </p>
        </div>

        {/* Receipt Rows */}
        <div className="flex flex-col divide-y divide-slate-50 px-8 py-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start gap-3 py-3">
              <div className="mt-0.5">{row.icon}</div>
              <div className="flex flex-1 items-start justify-between gap-4">
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase whitespace-nowrap">
                  {row.label}
                </span>
                <span className="text-right text-xs font-bold text-slate-700 break-words max-w-[180px]">
                  {row.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Summary */}
        <div className="mx-8 mb-6 rounded-[18px] bg-slate-50 p-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold">
              {data.colorCount ? `${data.colorCount} Color Setup Fee` : 'Setup Fee'}
            </span>
            <span className="font-mono font-black italic">
              ₱{data.baseFee.toLocaleString()}
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between border-t border-slate-200 pt-4">
            <span className="text-sm font-black tracking-widest text-slate-900 uppercase">
              Total Setup
            </span>
            <span className="text-3xl font-black tracking-tighter text-slate-900 italic">
              ₱{data.total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Info note */}
        <div className="mx-8 mb-6 flex items-start gap-2 rounded-[14px] border border-amber-100 bg-amber-50 p-3">
          <FiAlertCircle className="mt-0.5 shrink-0 text-amber-500" size={14} />
          <p className="text-[10px] leading-relaxed text-amber-700">
            Payment will be collected by admin upon order confirmation. This locks your screenplate slot.
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center justify-center gap-4 px-8 pb-4 text-[9px] font-black tracking-widest text-slate-400 uppercase">
          <span className="flex items-center gap-1">
            <FiShield size={10} /> Secure
          </span>
          <span className="flex items-center gap-1">
            <FiClock size={10} /> 5–7 Day ETA
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-slate-100 px-8 py-6">
          <button type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-[14px] border-2 border-slate-200 py-3.5 text-[10px] font-black tracking-[3px] text-slate-600 uppercase transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            Go Back
          </button>
          <button type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 rounded-[14px] border-2 border-slate-900 bg-slate-900 py-3.5 text-[10px] font-black tracking-[3px] text-white uppercase italic shadow-xl transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Locking...' : 'Pay & Lock'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ScreenplatePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null)
  const [colorCount, setColorCount] = useState<number>(0)
  const [alignment, setAlignment] = useState<string>('')
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [comment, setComment] = useState<string>('')
  const [searchParams] = useSearchParams()

  const [productsData, setProductsData] = useState<IProduct[]>([])

  // Modal state
  const [reviewOpen, setReviewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadAlertOpen, setUploadAlertOpen] = useState(false)
  const [uploadAlertMessage, setUploadAlertMessage] = useState('')
  const { fetchNotifications } = useNotificationStore()

  const dropdownRef = useRef<HTMLDivElement>(null)
  const leftPanelRef = useRef<HTMLDivElement>(null)
  const dropdownScrollRef = useRef<HTMLDivElement>(null)
  // Ref mirror of dropdownOpen — readable inside event handlers without
  // causing listener reattachment on every state change (no lag/bugging).
  const dropdownOpenRef = useRef(false)

  // Keep the ref in sync with state
  useEffect(() => {
    dropdownOpenRef.current = dropdownOpen
  }, [dropdownOpen])

  // Mount once — handlers read dropdownOpenRef.current, never stale
  useEffect(() => {
    const leftEl = leftPanelRef.current
    const dropEl = dropdownScrollRef.current

    const leftHandler = (e: WheelEvent) => {
      e.stopPropagation()
      if (dropdownOpenRef.current) return   // blocked while dropdown is open
      leftEl!.scrollTop += e.deltaY
    }

    const dropHandler = (e: WheelEvent) => {
      e.stopPropagation()
      dropEl!.scrollTop += e.deltaY
    }

    leftEl?.addEventListener('wheel', leftHandler, { passive: false })
    dropEl?.addEventListener('wheel', dropHandler, { passive: false })

    return () => {
      leftEl?.removeEventListener('wheel', leftHandler)
      dropEl?.removeEventListener('wheel', dropHandler)
    }
  }, []) // ← empty: mount once, no reattach

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch Products Protocol
  useEffect(() => {
    let isMounted = true
    getProducts().then((res) => {
      if (!isMounted) return
      const products = res.data || res
      setProductsData(Array.isArray(products) ? products : [])

      const productId = searchParams.get('product_id')
      const variantSize = searchParams.get('variant')

      const foundProduct = (Array.isArray(products) ? products : []).find(
        (p: IProduct) => p.id === productId,
      )
      if (foundProduct) {
        const variant = foundProduct.variants?.find((v: IProductVariant) => v.size === variantSize)
        if (variant) {
          setSelectedProduct(foundProduct)
          setSelectedVariant(variant)
          setSearchQuery(`${foundProduct.name} - ${variant.size}`)
        }
      }
    })
    return () => {
      isMounted = false
    }
  }, [searchParams])

  const isIncompatibleMode = searchParams.get('mode') === 'incompatible'

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    return productsData.filter((p) => {
      if (!p.is_need_screenplate) return false

      const catLabel = p.category_label?.toLowerCase() || ''
      const catId = p.category_id?.toLowerCase() || ''
      
      if (
        catLabel === 'lid' || catLabel === 'accessories' ||
        catId === 'lid' || catId === 'accessories'
      ) {
        return false
      }

      const q = searchQuery.toLowerCase()
      const matchName = p.name.toLowerCase().includes(q)
      const matchVariant = p.variants?.some((v: IProductVariant) =>
        v.is_need_screenplate !== false && v.size.toLowerCase().includes(q),
      )
      return matchName || matchVariant
    }).map(p => ({
      ...p,
      variants: p.variants?.filter(v => v.is_need_screenplate !== false)
    })).filter(p => p.variants && p.variants.length > 0)
  }, [searchQuery, productsData])

  const colorPricing = useMemo(() => {
    const saved = localStorage.getItem('screenplate_color_pricing')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed[1] && parsed[2] && parsed[3]) {
          return parsed
        }
      } catch {
        // Fallback to default pricing
      }
    }
    return { 1: 700, 2: 1400, 3: 2100 }
  }, [])

  const currentSetupFee = colorCount ? (colorPricing[colorCount] ?? 0) : 0
  const calculatedTotal = currentSetupFee
  const isValid = selectedProduct && selectedVariant && colorCount > 0 && alignment

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const maxSize = 3 * 1024 * 1024 // 3MB

    if (!allowedTypes.includes(file.type)) {
      setUploadAlertMessage('Only JPG, JPEG, PNG, and WebP files are allowed.')
      setUploadAlertOpen(true)
      e.target.value = ''
      return
    }

    if (file.size > maxSize) {
      setUploadAlertMessage('File size exceeds the 3 MB limit. Please choose a smaller file.')
      setUploadAlertOpen(true)
      e.target.value = ''
      return
    }

    toast.success('Brand reference image uploaded')

    const reader = new FileReader()
    reader.onloadend = () => {
      setReferenceImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSelectVariant = (product: IProduct, variant: IProductVariant) => {
    setSelectedProduct(product)
    setSelectedVariant(variant)
    setSearchQuery(`${product.name} - ${variant.size}`)
    setDropdownOpen(false)
  }

  // Step 1: open modal for review
  const handlePayClick = useCallback(() => {
    if (!isValid) {
      if ('vibrate' in navigator) {
        navigator.vibrate([200])
      }
      toast.custom(
        (t) => (
          <div
            className={`flex flex-wrap items-center gap-3 rounded-full bg-rose-600 px-6 py-4 text-white shadow-2xl transition-all duration-300 ${t.visible ? 'animate-[bounce_0.5s_ease-out]' : 'opacity-0 scale-95'}`}
            style={{ animationFillMode: 'forwards' }}
          >
            <span className="text-xl">⚠️</span>
            <span className="text-[10px] font-black tracking-widest uppercase">
              Please complete fields
            </span>
          </div>
        ),
        { duration: 3000 }
      )
      return
    }
    setReviewOpen(true)
  }, [isValid])

  useEffect(() => {
    const handlePayEvent = () => {
      handlePayClick()
    }
    window.addEventListener('pixs-screenplate-pay', handlePayEvent)
    return () => {
      window.removeEventListener('pixs-screenplate-pay', handlePayEvent)
    }
  }, [isValid, handlePayClick])

  // Step 2: actual submission from modal
  const handleConfirmSubmit = async () => {
    if (!isValid) return
    setIsSubmitting(true)
    try {
      const payload = {
        product_id: selectedProduct!.id,
        variant_id: selectedVariant!.variant_id,
        color_count: colorCount,
        alignment: alignment,
        reference_image: referenceImage,
        comment: comment,
        calculated_total: calculatedTotal,
      }

      const res = await createScreenplateRequest(payload)
      const requestId = res?.data?.id || 'SPR-NEW'

      setReviewOpen(false)

      // Construct message for admin
      const messageBody = `Review Screenplate Request: ${requestId}`;

      const formData = new FormData();
      formData.append('message', messageBody);
      formData.append('receiver_id', '1'); // Admin
      formData.append('receiver_type', 'employee');
      formData.append('screenplate_request_id', requestId);

      await Promise.all([
        axiosInstance.post('/api/messages/send', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).catch(msgErr => console.error('Failed to send screenplate message to admin:', msgErr)),
        axiosInstance.post('/api/notifications', {
          title: 'Screenplate Requested',
          message: `Your setup request for ${selectedProduct!.name} has been processed.`,
          type: 'success'
        }).then(() => fetchNotifications()),
      ])

      if ('vibrate' in navigator) {
        navigator.vibrate([80, 30, 80])
      }
      toast.custom(
        (t) => (
          <div
            className={`flex items-center gap-3 rounded-full bg-slate-900 px-6 py-4 text-white shadow-2xl transition-all duration-300 ${t.visible ? 'animate-[bounce_0.5s_ease-out]' : 'opacity-0 scale-95'}`}
            style={{ animationFillMode: 'forwards' }}
          >
            <span className="text-xl">✨✅</span>
            <span className="text-[10px] font-black tracking-widest uppercase">
              Setup request locked!
            </span>
          </div>
        ),
        { duration: 3500 }
      )
    } catch (error) {
      console.error('Failed to submit screenplate request:', error)
      
      try {
        await axiosInstance.post('/api/notifications', {
          title: 'Request Failed',
          message: `Could not process your screenplate request for ${selectedProduct?.name}. Please try again.`,
          type: 'error'
        })
        await fetchNotifications()
      } catch (postError) {
        console.error('Failed to register notification', postError)
      }

      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200])
      }
      toast.custom(
        (t) => (
          <div
            className={`flex items-center gap-3 rounded-full bg-rose-600 px-6 py-4 text-white shadow-2xl transition-all duration-300 ${t.visible ? 'animate-[bounce_0.5s_ease-out]' : 'opacity-0 scale-95'}`}
            style={{ animationFillMode: 'forwards' }}
          >
            <span className="text-xl">⚠️❌</span>
            <span className="text-[10px] font-black tracking-widest uppercase">
              Failed to complete request
            </span>
          </div>
        ),
        { duration: 4000 }
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="ScreenplatePage relative flex min-h-[calc(100vh-6rem)] flex-col items-center overflow-hidden bg-slate-50 mt-0 lg:mt-15">
      {/* Image Upload Alert */}
      <ImageUploadAlert
        open={uploadAlertOpen}
        onClose={() => setUploadAlertOpen(false)}
        message={uploadAlertMessage}
      />

      {/* Review Modal */}
      <ReviewModal
        open={reviewOpen}
        onClose={() => !isSubmitting && setReviewOpen(false)}
        onConfirm={handleConfirmSubmit}
        isSubmitting={isSubmitting}
        data={{
          product: selectedProduct,
          variant: selectedVariant,
          colorCount,
          alignment,
          referenceImage,
          comment,
          total: calculatedTotal,
          baseFee: colorCount ? (colorPricing[colorCount] ?? 0) : 0,
        }}
      />

      {/* Canvas Background */}
      <div className="ScreenplateCanvas pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <div className="text-6xl font-black tracking-tighter text-slate-200 uppercase italic opacity-50">
          3D Canvas Reseruation
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 mx-auto flex h-full min-h-[calc(100vh-6rem)] w-full max-w-[1600px] flex-col justify-between gap-6 px-6 py-6 lg:flex-row">

        {/* ── Left Panel ── */}
        {/*
          FIX 1: Scrollbar overflow + rounded corners
          - Wrap the panel in an outer div that holds the rounded corners + border.
          - The inner div gets overflow-y-auto so the scrollbar stays clipped
            inside the rounded boundary.
        */}
        <div className="ScreenplateLeftPanel h-[calc(100vh-9rem)] w-full overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm lg:w-[460px]">
          {/* Inner scrollable wrapper — scrollbar is clipped by parent's overflow:hidden */}
          <div ref={leftPanelRef} className="flex h-full flex-col overflow-y-auto">

            {/* Header — sticky at top of scroll container */}
            <div className="sticky top-0 z-[999] shrink-0 border-b border-slate-100 bg-white px-8 py-6">
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
                Screenplate Setup
              </h1>
              <p className="mt-1 text-[10px] font-bold tracking-[4px] text-slate-400 uppercase">
                {isIncompatibleMode
                  ? 'Incompatibility Resolution Node'
                  : 'Custom Branding Request'}
              </p>
            </div>

            {isIncompatibleMode && (
              <div className="mx-8 mt-4 flex animate-pulse items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4">
                <FiAlertTriangle className="mt-0.5 shrink-0 text-rose-500" />
                <div>
                  <p className="text-[10px] font-black text-rose-700 uppercase">
                    Protocol Mismatch Detected
                  </p>
                  <p className="mt-1 text-[9px] leading-relaxed text-rose-600">
                    Your current screenplate does not support this variant
                    configuration. Initializing new industrial node setup.
                  </p>
                </div>
              </div>
            )}

            <div className="flex-1 space-y-12 px-8 py-8">
              {/* 1. Select Product Container */}
              {/*
                FIX 2: Scroll-wheel inside the dropdown doesn't scroll the dropdown
                - Add onWheel={(e) => e.stopPropagation()} on the dropdown div so
                  scroll events are consumed by the dropdown and don't bubble to
                  the parent panel, preventing the panel from stealing the wheel.
              */}
              <div className="relative" ref={dropdownRef}>
                <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  1. Select Product Container *
                </label>
                <div className="mb-4 text-[9px] font-bold text-slate-300 uppercase italic">
                  {selectedProduct
                    ? `Selected: ${selectedProduct.name} (${selectedVariant?.size})`
                    : 'Choose the product you want to customize'}
                </div>

                <div className="relative z-20">
                  <FiSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search cup or size..."
                    className="ScreenplateSearchInput w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pr-4 pl-12 text-sm font-bold text-slate-900 transition-all focus:border-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setDropdownOpen(true)
                    }}
                    onFocus={() => setDropdownOpen(true)}
                  />
                  {(selectedProduct || selectedVariant) && (
                    <button type="button"
                      onClick={() => {
                        setSelectedProduct(null)
                        setSelectedVariant(null)
                        setSearchQuery('')
                      }}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 transition-colors hover:text-red-500"
                    >
                      <FiX />
                    </button>
                  )}
                </div>

                {/* Search Dropdown — stopPropagation on wheel so it scrolls independently */}
                {dropdownOpen && searchResults.length > 0 && (
                  <div
                    ref={dropdownScrollRef}
                    className="ScreenplateSearchDropdown absolute top-full right-0 left-0 z-50 mt-2 max-h-64 overflow-y-auto rounded-[20px] border border-slate-100 bg-white shadow-2xl"
                  >
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        className="ScreenplateSearchItem pointer-events-auto border-b border-slate-50 p-4 transition-colors last:border-0 hover:bg-slate-50"
                      >
                        <div className="text-sm font-bold text-slate-900">
                          {product.name}
                        </div>
                        <div className="mb-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                          {product.category_label}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {product.variants?.map((v: IProductVariant) => (
                            <button type="button"
                              key={v.variant_id}
                              onClick={() => handleSelectVariant(product, v)}
                              className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-black tracking-widest text-slate-600 uppercase transition-colors hover:bg-slate-900 hover:text-white"
                            >
                              {v.size}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Product Card */}
                {selectedProduct && (
                  <div className="animate-in fade-in slide-in-from-top-4 mt-6 flex flex-col gap-4 duration-300">
                    <div className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="size-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                        {selectedProduct.main_image ? (
                          <img
                            src={`/images/products/${selectedProduct.main_image}`}
                            alt={selectedProduct.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const fallback = e.currentTarget.parentElement?.querySelector('.box-fallback') as HTMLElement
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                        ) : (
                          <BoxFallback />
                        )}
                        <div className="box-fallback hidden h-full w-full">
                          <BoxFallback />
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="text-sm font-black text-slate-900 italic">
                          {selectedProduct.name}
                        </h4>
                        <p className="mt-1 line-clamp-2 text-[10px] text-slate-500 md:leading-relaxed">
                          {selectedProduct.short_description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {selectedProduct.tags?.slice(0, 3).map((tag: string) => (
                            <span
                              key={tag}
                              className="rounded bg-slate-100 px-2 py-0.5 text-[8px] font-black tracking-widest text-slate-500 uppercase"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Intelligent Compatibility Note */}
                    <div className="flex items-start gap-3 rounded-[16px] border border-blue-100 bg-blue-50 p-4">
                      <FiInfo className="mt-0.5 shrink-0 text-blue-500" />
                      {alignment === 'Front' || alignment === '' ? (
                        <p className="text-[10px] leading-snug text-blue-800">
                          <span className="font-bold">COMPATIBILITY NOTE:</span>{' '}
                          Screenplates for 'Front-only' logos may be compatible
                          with other products of similar sizes. Our system admin
                          will verify and adjust this for you.
                        </p>
                      ) : (
                        <p className="text-[10px] leading-snug text-blue-800">
                          <span className="font-bold">
                            UNIQUE CIRCUMFERENCE WARNING:
                          </span>{' '}
                          Because this is an all-around Flat Screen plate (Back
                          to Back / Triple Logo), different cups have different
                          rotational circumferences. A unique plate is required
                          exclusively for this specific product.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Color Selection */}
              <div className="ScreenplateColorSection">
                <label className="mb-1 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  2. Color Separation *
                </label>
                <div className="mb-4 text-[9px] font-bold text-slate-300 uppercase italic">
                  {colorCount > 0
                    ? `Selected: ${colorCount} Color${colorCount > 1 ? 's' : ''}`
                    : 'Number of individual colors in your design'}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((num) => (
                    <label
                      key={num}
                      className={`relative flex cursor-pointer rounded-[16px] border px-4 py-4 focus:outline-none ${
                        colorCount === num
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xl'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      } transition-all`}
                    >
                      <input
                        type="radio"
                        name="colors"
                        className="sr-only"
                        checked={colorCount === num}
                        onChange={() => setColorCount(num)}
                      />
                      <div className="flex w-full items-center justify-center">
                        <span className="text-xs font-black tracking-widest uppercase">
                          {num} Color{num > 1 ? 's' : ''}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Logo Alignment */}
              <div className="ScreenplateAlignmentSection">
                <label className="mb-1 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  3. Print Alignment *
                </label>
                <div className="mb-4 text-[9px] font-bold text-slate-300 uppercase italic">
                  {alignment ? `Selected: ${alignment}` : 'Where your logo will be positioned'}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {['Front', 'Back to Back', 'Triple Logo'].map((align) => (
                    <label
                      key={align}
                      className={`relative flex cursor-pointer rounded-[16px] border px-4 py-4 focus:outline-none ${
                        alignment === align
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xl'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      } transition-all`}
                    >
                      <input
                        type="radio"
                        name="alignment"
                        className="sr-only"
                        checked={alignment === align}
                        onChange={() => setAlignment(align)}
                      />
                      <div className="flex w-full items-center justify-between">
                        <span className="text-xs font-black tracking-widest uppercase">
                          {align}
                        </span>
                        {alignment === align && <FiCheckCircle className="text-white" />}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 4. Logo / Reference Upload */}
              <div className="ScreenplateReferenceSection">
                <label className="mb-1 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  4. Brand Reference (Optional)
                </label>
                <div className="mb-4 text-[9px] font-bold text-slate-300 uppercase italic">
                  {referenceImage ? 'Logo uploaded' : 'Upload your logo or inspiration image'}
                </div>

                {!referenceImage ? (
                  <label className="flex h-32 w-full cursor-pointer appearance-none justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-4 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none">
                    <span className="flex flex-col items-center justify-center space-y-2">
                      <FiUploadCloud className="size-6 text-slate-400" />
                      <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Drop logo or click
                      </span>
                    </span>
                    <input
                      type="file"
                      name="file_upload"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleImageUpload}
                    />
                  </label>
                ) : (
                  <div className="group relative h-32 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <img
                      src={referenceImage}
                      alt="Preview"
                      className="h-full w-full object-contain"
                    />
                    <div className="absolute inset-x-0 bottom-0 translate-y-full bg-white/80 py-2 text-center backdrop-blur transition-all group-hover:translate-y-0">
                      <label className="cursor-pointer text-[10px] font-black tracking-widest text-slate-600 uppercase">
                        Replace File
                        <input
                          type="file"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.webp"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Additional Instructions */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  5. Additional Instructions (Optional)
                </label>
                <div className="text-[9px] font-bold text-slate-300 uppercase italic">
                  Provide specific details for our design team
                </div>
                <textarea
                  className="h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  placeholder="Write any structural notes or special instructions..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
          </div>{/* end inner scroll wrapper */}
        </div>

        {/* ── Right Panel ── */}
        <div className="ScreenplateRightPanel mb-20 md:md-0 sticky top-8 flex h-fit w-full flex-col gap-6 rounded-[24px] border border-slate-100 bg-white p-8 shadow-sm lg:w-[320px]">
          <div className="ScreenplatePricingCard flex flex-col">
            <h3 className="mb-6 text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
              Investment Summary
            </h3>

            <div className="mb-6 space-y-4 border-b border-slate-100 pb-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {colorCount ? `${colorCount} Color Setup Fee` : 'Setup Fee'}
                </span>
                <span className="font-mono text-xs font-black italic">
                  ₱{currentSetupFee.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mb-8 flex items-end justify-between">
              <span className="text-sm font-black tracking-widest text-slate-900 uppercase">
                Total Setup
              </span>
              <span className="ScreenplateTotalValue text-3xl font-black tracking-tighter text-slate-900 italic">
                ₱{calculatedTotal.toLocaleString()}
              </span>
            </div>

            {/* FIX 3: onClick now opens the review modal instead of submitting directly */}
            <button type="button"
              className={`ScreenplateSubmitButton w-full rounded-[16px] border-2 py-4 text-[10px] font-black tracking-[4px] uppercase italic transition-all ${
                isValid
                  ? 'border-slate-900 bg-slate-900 text-white shadow-xl hover:scale-105 active:scale-95'
                  : 'cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400'
              }`}
              onClick={handlePayClick}
              disabled={!isValid}
            >
              {isValid ? 'Review & Pay' : 'Missing Fields'}
            </button>
            <p className="mt-4 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Estimated setup 5-7 days
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScreenplatePage