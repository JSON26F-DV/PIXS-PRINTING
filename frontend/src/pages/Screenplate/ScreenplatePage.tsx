import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  FiUploadCloud,
  FiSearch,
  FiX,
  FiCheckCircle,
  FiInfo,
  FiAlertTriangle,
} from 'react-icons/fi'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import productsDataRaw from '../../data/products.json'

interface ProductVariant {
  variant_id: string
  size: string
}

interface Product {
  id: string
  name: string
  category: string
  print_method?: string
  variants?: ProductVariant[]
  main_image?: string
  short_description?: string
  tags?: string[]
}

const productsData = productsDataRaw as Product[]

const ScreenplatePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  )
  const [colorCount, setColorCount] = useState<number>(0)
  const [alignment, setAlignment] = useState<string>('')
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [comment, setComment] = useState<string>('')
  const [searchParams] = useSearchParams()

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle URL Parameters for auto-selection
  useEffect(() => {
    const productId = searchParams.get('product_id')
    const variantSize = searchParams.get('variant')

    if (productId && variantSize) {
      const product = productsData.find((p) => p.id === productId)
      if (product) {
        const variant = product.variants?.find((v) => v.size === variantSize)
        if (variant) {
          setSelectedProduct(product)
          setSelectedVariant(variant)
          setSearchQuery(`${product.name} - ${variant.size}`)
        }
      }
    }
  }, [searchParams])

  const isIncompatibleMode = searchParams.get('mode') === 'incompatible'

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []

    return productsData.filter((p) => {
      // Filter for Screen Print or Flat Screen compatibility
      const method = p.print_method || ''
      const isCompatible =
        method.includes('Screen Print') || method.includes('Flat Screen')
      if (!isCompatible) return false

      const q = searchQuery.toLowerCase()
      const matchName = p.name.toLowerCase().includes(q)
      const matchVariant = p.variants?.some((v: ProductVariant) =>
        v.size.toLowerCase().includes(q),
      )

      return matchName || matchVariant
    })
  }, [searchQuery])

  const BASE_SETUP_FEE = 700
  const calculatedTotal = colorCount ? BASE_SETUP_FEE * colorCount : 0
  const isValid =
    selectedProduct &&
    selectedVariant &&
    colorCount > 0 &&
    alignment &&
    referenceImage

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setReferenceImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSelectVariant = (product: Product, variant: ProductVariant) => {
    setSelectedProduct(product)
    setSelectedVariant(variant)
    setSearchQuery(`${product.name} - ${variant.size}`)
    setDropdownOpen(false)
  }

  const handleSubmit = () => {
    if (!isValid) {
      toast.error('Please complete all required fields.')
      return
    }

    const transactionId = `TXN-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')}`

    // 1. Order Payload (Direct Pay)
    const orderPayload = {
      order_id: transactionId,
      product_id: selectedProduct.id,
      variant: selectedVariant.size,
      total_amount: calculatedTotal,
      order_type: 'Screenplate Checkout',
      payment_status: 'Paid',
      status: 'Processing',
    }

    // 2. Screenplate Request Payload
    const screenplatePayload = {
      request_id: transactionId,
      product_id: selectedProduct.id,
      variant: selectedVariant.size,
      color_count: colorCount,
      alignment: alignment,
      reference_image: referenceImage, // Base64 or path
      comment: comment,
      status: 'Pending Admin Action',
    }

    // 3. System Chat Confirmation Mock
    const chatMessagePayload = {
      message_id: `MSG-${Date.now()}`,
      sender: 'System',
      receiver: 'Customer',
      type: 'Screenplate Confirmation',
      content: `Your screenplate request for ${selectedProduct.name} (${selectedVariant.size}) has been paid and received! Admin will process this shortly.`,
      reference_order: transactionId,
    }

    const combinedTransactionData = {
      order: orderPayload,
      request_screenplate: screenplatePayload,
      chat_message: chatMessagePayload,
    }

    // Simulate saving the ecosystem architecture
    const blob = new Blob([JSON.stringify(combinedTransactionData, null, 2)], {
      type: 'application/json',
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'screenplate_transaction.json'
    link.click()

    toast.success(
      'Checkout Successful! View Notification Modal & Chat for details.',
      { duration: 5000 },
    )
  }

  return (
    <div className="ScreenplatePage relative flex min-h-[calc(100vh-6rem)] flex-col items-center overflow-hidden bg-slate-50">
      {/* 
        Canvas Background
        The center remains empty for future Three.js injection.
        Absolute positioning allows the 3D context to take over the background.
      */}
      <div className="ScreenplateCanvas pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        {/* Intentionally left blank for Three.js */}
        <div className="text-6xl font-black tracking-tighter text-slate-200 uppercase italic opacity-50">
          3D Canvas Reseruation
        </div>
      </div>

      {/* Main Container */}
      <div className="pointer-events-none relative z-10 flex h-full min-h-[calc(100vh-6rem)] w-full max-w-[1600px] flex-col justify-between gap-6 px-6 py-6 lg:flex-row">
        {/* Left Panel */}
        <div className="ScreenplateLeftPanel pointer-events-auto flex h-[calc(100vh-9rem)] w-full flex-col overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm lg:w-[460px]">
          {/* Header */}
          <div className="shrink-0 border-b border-slate-100 bg-white px-8 py-6">
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

          <div className="flex-1 space-y-12 overflow-y-auto px-8 py-8">
            {/* 1. Search Bar */}
            <div className="relative" ref={dropdownRef}>
              <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                1. Target Container *
              </label>

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
                  <button
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

              {/* 2. Search Dropdown */}
              {dropdownOpen && searchResults.length > 0 && (
                <div className="ScreenplateSearchDropdown absolute top-full right-0 left-0 z-50 mt-2 max-h-64 overflow-y-auto rounded-[20px] border border-slate-100 bg-white shadow-2xl">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="ScreenplateSearchItem pointer-events-auto border-b border-slate-50 p-4 transition-colors last:border-0 hover:bg-slate-50"
                    >
                      <div className="text-sm font-bold text-slate-900">
                        {product.name}
                      </div>
                      <div className="mb-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        {product.category}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.variants?.map((v: ProductVariant) => (
                          <button
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

              {/* 1.a Selected Product Card Data */}
              {selectedProduct && (
                <div className="animate-in fade-in slide-in-from-top-4 mt-6 flex flex-col gap-4 duration-300">
                  <div className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    {selectedProduct.main_image && (
                      <img
                        src={selectedProduct.main_image}
                        alt={selectedProduct.name}
                        className="h-20 w-20 rounded-xl border border-slate-100 bg-slate-50 object-cover"
                      />
                    )}
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-sm font-black text-slate-900 italic">
                        {selectedProduct.name}
                      </h4>
                      <p className="mt-1 line-clamp-2 text-[10px] text-slate-500 md:leading-relaxed">
                        {selectedProduct.short_description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {selectedProduct.tags
                          ?.slice(0, 3)
                          .map((tag: string) => (
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
                        Because this is an all-around Flat Screen plate (Back to
                        Back / Triple Logo), different cups have different
                        rotational circumferences. A unique plate is required
                        exclusively for this specific product.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Color Selection */}
            <div className="ScreenplateColorSection">
              <label className="mb-4 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                2. Color Separation *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((num) => (
                  <label
                    key={num}
                    className={`relative flex cursor-pointer rounded-[16px] border px-4 py-4 focus:outline-none ${colorCount === num ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'} transition-all`}
                  >
                    <input
                      type="radio"
                      name="colors"
                      className="ScreenplateColorRadio sr-only"
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

            {/* 4. Logo Alignment */}
            <div className="ScreenplateAlignmentSection">
              <label className="mb-4 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                3. Print Alignment *
              </label>
              <div className="grid grid-cols-1 gap-3">
                {['Front', 'Back to Back', 'Triple Logo'].map((align) => (
                  <label
                    key={align}
                    className={`relative flex cursor-pointer rounded-[16px] border px-4 py-4 focus:outline-none ${alignment === align ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'} transition-all`}
                  >
                    <input
                      type="radio"
                      name="alignment"
                      className="ScreenplateAlignmentRadio sr-only"
                      checked={alignment === align}
                      onChange={() => setAlignment(align)}
                    />
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-black tracking-widest uppercase">
                        {align}
                      </span>
                      {alignment === align && (
                        <FiCheckCircle className="text-white" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 5. Logo / Reference Upload */}
            <div className="ScreenplateReferenceSection">
              <label className="mb-4 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                4. Brand Reference *
              </label>

              {!referenceImage ? (
                <label className="flex h-32 w-full cursor-pointer appearance-none justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-4 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none">
                  <span className="flex flex-col items-center justify-center space-y-2">
                    <FiUploadCloud className="h-6 w-6 text-slate-400" />
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Drop logo or click
                    </span>
                  </span>
                  <input
                    type="file"
                    name="file_upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              ) : (
                <div className="group relative h-32 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  <img
                    src={referenceImage}
                    alt="Preview"
                    className="ScreenplateImagePreview h-full w-full object-contain"
                  />
                  <div className="absolute inset-x-0 bottom-0 translate-y-full bg-white/80 py-2 text-center backdrop-blur transition-all group-hover:translate-y-0">
                    <label className="cursor-pointer text-[10px] font-black tracking-widest text-slate-600 uppercase">
                      Replace File
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Textarea for Notes */}
            <div className="space-y-4">
              <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                5. Additional Instructions
              </label>
              <textarea
                className="ScreenplateCommentTextarea h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                placeholder="Write any structural notes or special instructions..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="ScreenplateRightPanel pointer-events-auto sticky top-8 flex h-fit w-full flex-col gap-6 rounded-[24px] border border-slate-100 bg-white p-8 shadow-sm lg:w-[320px]">
          <div className="ScreenplatePricingCard flex flex-col">
            <h3 className="mb-6 text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
              Investment Summary
            </h3>

            <div className="mb-6 space-y-4 border-b border-slate-100 pb-6">
              <div className="ScreenplatePriceRow flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  Base Setup Fee
                </span>
                <span className="font-mono text-xs font-black italic">
                  ₱{BASE_SETUP_FEE.toLocaleString()}
                </span>
              </div>
              <div className="ScreenplatePriceRow flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  Color Multiplier
                </span>
                <span className="font-mono text-xs font-black italic">
                  {colorCount ? `x${colorCount}` : '-'}
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

            <button
              className={`ScreenplateSubmitButton w-full rounded-[16px] border-2 py-4 text-[10px] font-black tracking-[4px] uppercase italic transition-all ${
                isValid
                  ? 'border-slate-900 bg-slate-900 text-white shadow-xl hover:scale-105 active:scale-95'
                  : 'cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400'
              } `}
              onClick={handleSubmit}
              disabled={!isValid}
            >
              {isValid ? 'Pay & Lock Setup' : 'Missing Fields'}
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
