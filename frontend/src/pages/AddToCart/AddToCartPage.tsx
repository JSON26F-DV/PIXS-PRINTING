import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Circle,
  CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getColors,
  getCustomerScreenplates,
} from '../../api/products.api'
import { useCart } from './hooks/useCart'
import type { CartColorInfo, CartItem } from '../../types/cart'
import type { IScreenPlate } from '../../types/product.types'
import BoxFallback from '../../components/common/BoxFallback'

// ─── Sub-Component for Image Handling ────────────────────────────────────────
const CartProductImage: React.FC<{ src: string; alt: string }> = ({
  src,
  alt,
}) => {
  const [imgError, setImgError] = useState(false)

  if (imgError || !src) {
    return (
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[24px] border border-slate-100 bg-slate-50 md:h-28 md:w-28">
        <BoxFallback />
      </div>
    )
  }

  return (
    <img
      src={src}
      className="h-24 w-24 rounded-[24px] object-cover md:h-28 md:w-28"
      alt={alt}
      onError={() => setImgError(true)}
    />
  )
}

const AddToCartPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    items,
    updateQuantity,
    updateColors,
    updateVariant,
    updatePlatePrice,
    removeItem,
    getItemTotal,
    isLoading: isCartLoading,
  } = useCart()

  const [colors, setColors] = useState<CartColorInfo[]>([])
  const [screenplates, setScreenplates] = useState<IScreenPlate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [colorsRes, screenplatesRes] = await Promise.all([
          getColors(),
          getCustomerScreenplates(),
        ])
        setColors(colorsRes.data)
        setScreenplates(screenplatesRes.data)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load required data.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false)

  useEffect(() => {
    if (items.length > 0 && !hasInitializedSelection) {
      setSelectedItemIds([items[0].id])
      setHasInitializedSelection(true)
    }
  }, [items, hasInitializedSelection])

  const toggleSelection = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  const isAllSelected =
    items.length > 0 && selectedItemIds.length === items.length

  const handleSelectToggle = () => {
    if (isAllSelected) {
      setSelectedItemIds([])
    } else {
      setSelectedItemIds(items.map((i) => i.id))
    }
  }

  const selectedItems = items.filter((i) => selectedItemIds.includes(i.id))
  const selectedTotal = selectedItems.reduce((acc, item) => {
    const total = getItemTotal(item.id)?.total ?? 0
    return acc + total
  }, 0)

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one product.')
      return
    }
    // Store selected items for checkout node
    localStorage.setItem('pixs_checkout_node', JSON.stringify(selectedItems))
    navigate('/transactions')
  }

  const handleQuantityChange = (itemId: string, nextQtyRaw: number) => {
    const target = items.find((item) => item.id === itemId)
    if (!target) return

    let nextQty = Number.isFinite(nextQtyRaw) ? Math.floor(nextQtyRaw) : target.minOrder
    if (nextQty < target.minOrder) nextQty = target.minOrder

    updateQuantity(target, nextQty)
  }

  const handleColorChange = (item: (typeof items)[0], colorId: string) => {
    const selectedColor = colors.find((c) => c.id === colorId)
    if (!selectedColor) return

    const maxChannels = item.plate?.channels || 1
    const currentColors = item.colors || []

    let nextColors: CartColorInfo[]
    if (currentColors.some((c) => c.id === colorId)) {
      nextColors = currentColors.filter((c) => c.id !== colorId)
    } else if (currentColors.length < maxChannels) {
      nextColors = [...currentColors, selectedColor]
    } else {
      if (maxChannels === 1) {
        nextColors = [selectedColor]
      } else {
        return // Block if at max
      }
    }

    updateColors(item.id, nextColors)
  }

  const handleVariantChange = (
    item: CartItem,
    variantId: string,
  ) => {
    const product = item.fullProduct
    const variant = product?.variants.find((v) => v.variant_id === variantId)
    if (!variant) {
        toast.error('Variant metadata not found.')
        return
    }

    if (item.plate) {
      const plate = screenplates.find((p) => p.id === item.plate?.id)
      const compatibility = (plate?.compatibility as Array<{ product_id: string; print_price_per_unit: Record<string, number> }>)?.find((cp) => cp.product_id === item.productId)
      const newPrice = compatibility?.print_price_per_unit?.[variant.size] ?? 0
      updatePlatePrice(item.id, newPrice)
    }

    updateVariant(item.id, {
      id: variant.variant_id,
      size: variant.size,
      width: (variant as { width?: string }).width || '',
      height: (variant as { height?: string }).height || '',
      unitPrice: variant.price,
      stock: variant.stock,
    })
  }

  const getVariantCompatibility = (item: CartItem) => {
    const map: Record<string, { isCompatible: boolean; reason?: string }> = {}
    const product = item.fullProduct
    if (!product) return map

    const plateId = item.plate?.id
    if (!plateId) {
       product.variants.forEach(v => { map[v.variant_id] = { isCompatible: true } })
       return map
    }

    const plate = screenplates.find(p => p.id === plateId)
    if (!plate) {
       product.variants.forEach(v => { map[v.variant_id] = { isCompatible: true } })
       return map
    }

    const comp = plate.compatibility.find(c => c.product_id === item.productId)
    const incomp = plate.incompatibility?.find(i => i.product_id === item.productId)

    product.variants.forEach((v) => {
      const isAllowed = comp && (
        comp.allowed_variants.includes(v.variant_id) || 
        comp.allowed_variants.includes(v.size) || 
        comp.allowed_variants.includes('ALL')
      )

      const isDenied = incomp && (
        incomp.variant_ids.length === 0 || 
        incomp.variant_ids.includes(v.variant_id) || 
        incomp.variant_ids.includes(v.size)
      )
      
      if (isDenied) {
        map[v.variant_id] = { isCompatible: false, reason: 'Incompatible with this plate' }
      } else if (isAllowed) {
        map[v.variant_id] = { isCompatible: true }
      } else {
        map[v.variant_id] = { isCompatible: false, reason: 'Not in plate allow-list' }
      }
    })
    
    return map
  }

  if (isLoading || isCartLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="border-pixs-mint h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="AddToCartPage min-h-screen bg-slate-50 pb-44 lg:pb-32 mt-7 lg:mt-25">
      <div className="fixed top-0 lg:top-20 w-screen z-30 border-b border-slate-100 bg-white/60 px-6 py-5 backdrop-blur-3xl md:px-16 md:top-20">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="CartBackButton flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase transition hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            <span className="hidden md:inline">Back to Homepage</span>
          </button>
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Cart Review
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] px-6 pt-12 md:px-16">
        <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic md:text-5xl">
              Add To Cart
            </h1>
            <p className="mt-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Review products, adjust color and quantity, then proceed to
              checkout.
            </p>
          </div>

          {items.length > 0 && (
            <div className="hidden items-center gap-3 md:flex">
              <button
                onClick={() => setSelectedItemIds(items.map((i) => i.id))}
                className="group flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-5 py-3 text-[10px] font-black tracking-widest text-slate-500 uppercase shadow-sm transition-all hover:bg-slate-50 hover:text-pixs-mint"
              >
                <CheckCircle2 size={16} className="text-pixs-mint" />
                Select All
              </button>
              <button
                onClick={() => setSelectedItemIds([])}
                className="group flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-5 py-3 text-[10px] font-black tracking-widest text-slate-500 uppercase shadow-sm transition-all hover:bg-slate-50 hover:text-rose-500"
              >
                <Trash2 size={16} className="text-rose-300 group-hover:text-rose-500" />
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-black tracking-tight text-slate-900 uppercase italic">
              Your cart is empty
            </p>
            <p className="mt-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Add products from product details.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <section className="CartProductList space-y-4">
              {items.map((item) => {
                const itemTotal = getItemTotal(item.id)
                if (!itemTotal) return null
                const productMeta = item.fullProduct
                const isNeedColor =
                  productMeta?.is_need_color ?? item.colors.length > 0
                const shortDescription =
                  productMeta?.short_description ??
                  'No short description available.'
                const isSelected = selectedItemIds.includes(item.id)

                return (
                  <article
                    key={item.id}
                    onClick={() => toggleSelection(item.id)}
                    className={`CartProductCard relative cursor-pointer rounded-[24px] border p-5 shadow-sm transition-all md:p-6 ${
                      isSelected
                        ? 'border-pixs-mint bg-white ring-4 ring-pixs-mint/5'
                        : 'border-slate-100 bg-slate-50 opacity-60'
                    }`}
                  >
                    {/* Selection Hub */}
                    <div
                      className="absolute top-4 left-4 z-10 flex h-6 w-6 items-center justify-center rounded-full transition-all"
                    >
                      {isSelected ? (
                        <CheckCircle2 className="text-pixs-mint" size={24} />
                      ) : (
                        <Circle className="text-slate-300" size={24} />
                      )}
                    </div>

                    <div className="flex flex-col gap-4 pl-8 md:flex-row md:items-start">
                      <CartProductImage
                        src={`/images/products/${item.productImage}`}
                        alt={item.productName}
                      />

                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="CartProductTitle text-lg font-black tracking-tight text-slate-900 uppercase italic">
                              {item.productName}
                            </h3>
                            <p className="CartProductVariant text-xs font-black tracking-widest text-slate-500 uppercase">
                              {item.variant.size} | {item.variant.width} x{' '}
                              {item.variant.height}
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                              {shortDescription}
                            </p>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeItem(item.id)
                            }}
                            className="CartProductRemoveButton inline-flex items-center gap-1 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-black tracking-wider text-rose-600 uppercase transition hover:bg-rose-100"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>

                        {/* Variant Configuration Hub */}
                        <div className="CartProductVariantPicker space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                              Variant
                            </label>
                            {item.plate && (
                              <span className="text-pixs-mint flex items-center gap-1 text-[9px] font-black tracking-widest uppercase">
                                <CheckCircle2 size={10} /> Compatibility Locked
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.fullProduct?.variants?.map((v) => {
                              const isVariantSelected = item.variant.id === v.variant_id
                              const compatibilityMap = getVariantCompatibility(item)
                              const { isCompatible, reason } = compatibilityMap[v.variant_id] || { isCompatible: true }

                              return (
                                <div key={`${item.id}-${v.variant_id}`} className="relative group">
                                  <button
                                    disabled={!isCompatible}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleVariantChange(item, v.variant_id)
                                    }}
                                    className={`relative rounded-xl border px-3 py-2 text-[10px] font-black tracking-wider uppercase transition ${
                                      isVariantSelected
                                        ? 'border-slate-900 bg-slate-900 text-white'
                                        : isCompatible
                                          ? 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                                          : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 grayscale'
                                    }`}
                                  >
                                    {v.size}
                                    {!isCompatible && isVariantSelected && (
                                      <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-rose-500" />
                                    )}
                                  </button>
                                  
                                  {!isCompatible && (
                                    <div className="pointer-events-none absolute -top-8 left-1/2 z-20 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                                      <div className="whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[8px] font-bold text-white shadow-xl">
                                        {reason || 'Incompatible'}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                          {item.plate && (
                            <p className="text-[9px] font-bold text-slate-400 italic">
                              * Note: Locked to your screenplate. Contact Admin
                              if you need other variants or{' '}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(
                                    `/screenplate?product_id=${item.productId}&variant=${item.variant.size}&mode=incompatible`,
                                  )
                                }}
                                className="underline hover:text-slate-900"
                              >
                                request new plate
                              </button>
                              .
                            </p>
                          )}
                          {!item.plate && productMeta?.is_need_screenplate && (
                            <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 p-3">
                              <p className="text-[9px] font-black text-amber-700 uppercase">
                                Missing Screenplate Requirement
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(
                                    `/screenplate?product_id=${item.productId}&variant=${item.variant.size}`,
                                  )
                                }}
                                className="rounded-lg bg-amber-600 px-3 py-1 text-[8px] font-black text-white uppercase transition-colors hover:bg-amber-700"
                              >
                                Initialize Setup
                              </button>
                            </div>
                          )}
                        </div>

                        {isNeedColor && (
                          <div className="CartProductColorPicker space-y-2">
                            <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                              Master Color Sequence{' '}
                              {item.plate &&
                                `(${item.colors.length}/${item.plate.channels} Channels)`}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {colors.map((color) => {
                                const index = item.colors.findIndex(
                                  (c) => c.id === color.id,
                                )
                                const selected = index !== -1
                                const label = selected
                                  ? index === 0
                                    ? 'Primary'
                                    : index === 1
                                      ? 'Secondary'
                                      : 'Accent'
                                  : null

                                return (
                                  <button
                                    key={`${item.id}-${color.id}`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleColorChange(item, color.id)
                                    }}
                                    className={`relative rounded-full border px-3 py-1.5 text-[10px] font-black tracking-wider uppercase transition ${
                                      selected
                                        ? 'border-slate-900 bg-slate-900 text-white'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-2.5 w-2.5 rounded-full border border-slate-200"
                                        style={{ backgroundColor: color.hex }}
                                      />
                                      {color.name}
                                      {label && (
                                        <span className="text-pixs-mint ml-1 text-[8px] italic">
                                          {label}
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        <div className="CartProductQuantity flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleQuantityChange(item.id, item.quantity - 1)
                            }}
                            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-100"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            min={item.minOrder}
                            value={item.quantity}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(event) =>
                              handleQuantityChange(
                                item.id,
                                Number(event.target.value),
                              )
                            }
                            className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-black text-slate-900 outline-none"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleQuantityChange(item.id, item.quantity + 1)
                            }}
                            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-100"
                          >
                            <Plus size={14} />
                          </button>
                          <span className="text-[10px] font-bold text-slate-400 ml-2">min: {item.minOrder}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 rounded-[24px] bg-slate-50 p-4 md:grid-cols-3">
                          <div>
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                              Price / Unit
                            </p>
                            <p className="font-mono text-sm font-black text-slate-900 italic">
                              PHP {item.variant.unitPrice.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                              Subtotal
                            </p>
                            <p className="font-mono text-sm font-black text-slate-900 italic">
                              PHP {itemTotal.total.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {item.plate && (
                          <div className="mt-2 border-t border-slate-100 pt-4">
                            <p className="flex items-center gap-2 text-sm font-black tracking-tight text-slate-900 italic">
                              🖨 {item.plate.name}
                            </p>
                            <p className="mt-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                              {item.plate.type === 'Flatscreen' ? 'Flat' : item.plate.type === 'Cylindrical' ? 'Center' : 'Front'} | {item.plate.channels} channels
                            </p>
                            <p className="mt-2 text-xs font-black italic">
                              Plate price: ₱{(item.plate.printPricePerUnit || 0).toFixed(2)}/unit
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </section>

            <aside className="CartTotalSection sticky top-36 h-fit hidden md:block rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm lg:top-40">
              <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase italic">
                Cart Total
              </h2>
              <p className="mt-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                {selectedItems.length} Selected Item
                {selectedItems.length > 1 ? 's' : ''}
              </p>
              <div className="my-5 h-px bg-slate-100" />
              <p className="font-mono text-3xl font-black text-slate-900 italic">
                PHP {selectedTotal.toFixed(2)}
              </p>
              <button
                onClick={handleCheckout}
                disabled={selectedItems.length === 0}
                className={`CartCheckoutButton mt-6 w-full rounded-3xl border px-8 py-4 text-[10px] font-black tracking-[4px] uppercase italic shadow-2xl transition-all active:scale-95 ${
                   selectedItems.length > 0
                    ? 'border-white/10 bg-slate-900 text-white hover:scale-105'
                    : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300 shadow-none'
                }`}
              >
                Checkout Selected
              </button>
            </aside>

            {/* Mobile Fixed Bottom Bar */}
            <div className="md:hidden fixed bottom-20 left-0 w-full z-40 bg-white/90 border-t border-slate-100 px-6 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] backdrop-blur-3xl">
              <div className="flex items-center justify-between gap-4">
                {/* 1. Selection Toggle */}
                <button
                  onClick={handleSelectToggle}
                  className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-900 uppercase italic"
                >
                  {isAllSelected ? (
                    <CheckCircle2 size={24} className="text-pixs-mint" />
                  ) : (
                    <Circle size={24} className="text-slate-300" />
                  )}
                  <span>All</span>
                </button>

                {/* 2. Total Price */}
                <div className="flex-1 text-right">
                  <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">
                    Total
                  </p>
                  <p className="font-mono text-lg font-black text-slate-900 italic leading-none">
                    PHP {selectedTotal.toFixed(2)}
                  </p>
                </div>

                {/* 3. Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={selectedItems.length === 0}
                  className={`flex h-12 items-center justify-center rounded-2xl px-6 text-[10px] font-black tracking-[2px] uppercase italic shadow-lg transition-all active:scale-95 ${
                    selectedItems.length > 0
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-300 shadow-none'
                  }`}
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default AddToCartPage
