import React, { useState, useEffect, useCallback } from 'react'
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
} from '../../api/products.api'
import { useCart } from './hooks/useCart'
import type { CartColorInfo, CartItem } from '../../types/cart'
import BoxFallback from '../../components/common/BoxFallback'
import VariantSelector from '../../views/product/components/VariantSelector'

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

// ─── Types ────────────────────────────────────────────────────────────────────
type PendingConfig = {
  selected?: boolean
  quantity?: number
  colors?: CartColorInfo[]
  variant?: CartItem['variant']
  platePrice?: number
}

const AddToCartPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    items,
    removeItem,
    isLoading: isCartLoading,
    syncCart,
  } = useCart()

  const [colors, setColors] = useState<CartColorInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pendingMap, setPendingMap] = useState<Record<string, PendingConfig>>({})

  // Merge cart item with its pending overrides and RECALCULATE totals
  const getVariantCompatibilityMap = useCallback((item: CartItem) => {
    const map: Record<string, { isCompatible: boolean; reason?: string }> = {}
    try {
      const product = item.fullProduct
      if (!product || !product.variants) return map

      // We use the merged item's plate to get compatibility info
      const plate = item.plate

      product.variants.forEach((v) => {
        if (!plate) {
          map[v.variant_id] = { isCompatible: true }
          return
        }

        const comp = plate.compatibility?.find((c) => c.product_id === product.id)
        const incomp = plate.incompatibility?.find(
          (i) => i.product_id === product.id,
        )

        // If no compatibility record exists for this specific product, we default to compatible
        // because the plate is already assigned to this cart item.
        if (!comp && !incomp) {
          map[v.variant_id] = { isCompatible: true }
          return
        }

        const isAllowed =
          comp &&
          (comp.allowed_variants?.includes(v.variant_id) ||
            comp.allowed_variants?.includes(v.size) ||
            comp.allowed_variants?.includes('ALL'))

        const isDenied =
          incomp &&
          (incomp.variant_ids?.length === 0 ||
            incomp.variant_ids?.includes(v.variant_id) ||
            incomp.variant_ids?.includes(v.size))

        if (isDenied) {
          map[v.variant_id] = { isCompatible: false, reason: 'Not Compatible' }
        } else if (isAllowed) {
          map[v.variant_id] = { isCompatible: true }
        } else {
          // If a compatibility record EXISTS for this product but this variant isn't in it, then it's incompatible
          map[v.variant_id] = { isCompatible: false, reason: 'Not Compatible' }
        }
      })
    } catch (err) {
      console.error('Compatibility calculation failed:', err)
    }

    return map
  }, [])

  const getMergedItem = useCallback(
    (item: CartItem): CartItem => {
      const pending = pendingMap[item.id]
      const merged = pending ? { ...item, ...pending } : { ...item }

      // Dynamically determine plate price based on selected variant's compatibility mapping
      if (merged.plate && merged.plate.compatibility) {
        const product = item.fullProduct
        const comp = merged.plate.compatibility.find(
          (c) => c.product_id === product?.id,
        )
        if (comp && comp.print_price_per_unit) {
          const vId = merged.variant.id
          const dynamicPrice =
            comp.print_price_per_unit[vId] ?? comp.print_price_per_unit['ALL']

          if (dynamicPrice !== undefined) {
            merged.plate = {
              ...merged.plate,
              printPricePerUnit: Number(dynamicPrice),
            }
          }
        }
      }

      // Explicit pending override takes precedence (if any)
      if (pending?.platePrice !== undefined && merged.plate) {
        merged.plate = { ...merged.plate, printPricePerUnit: pending.platePrice }
      }

      // Recalculate totalCartPrice for UI subtotal accuracy
      const quantity = merged.quantity
      const unitPrice = merged.variant.unitPrice
      const printPrice = merged.plate?.printPricePerUnit ?? 0
      merged.totalCartPrice = quantity * unitPrice + quantity * printPrice

      return merged
    },
    [pendingMap],
  )


  const setPending = useCallback((itemId: string, patch: PendingConfig) => {
    setPendingMap((prev: Record<string, PendingConfig>) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? {}), ...patch },
    }))
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [colorsRes] = await Promise.all([
          getColors(),
        ])
        setColors(colorsRes.data)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load required data.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // ─── Merged items list ────────────────────────────────────────────────────
  const mergedItems: CartItem[] = items.map(getMergedItem)

  const isAllSelected =
    mergedItems.length > 0 && mergedItems.every((i) => i.selected)

  const handleSelectToggle = () => {
    const next = !isAllSelected
    mergedItems.forEach((i) => setPending(i.id, { selected: next }))
  }

  const toggleSelection = (id: string, current: boolean) => {
    setPending(id, { selected: !current })
  }

  const selectedItems = mergedItems.filter((i) => i.selected)
  
  const hasMissingColor = selectedItems.some(item => {
    const productMeta = item.fullProduct
    if (productMeta?.is_need_color) {
      const requiredChannels = item.plate?.channels || 1
      return item.colors.length < requiredChannels
    }
    return false
  })

  const selectedTotal = selectedItems.reduce((acc, item) => {
    return acc + item.totalCartPrice
  }, 0)

  const hasIncompatibleVariant = selectedItems.some((item) => {
    if (!item.variant || !item.variant.id) return false
    const compMap = getVariantCompatibilityMap(item)
    return compMap[item.variant.id]?.isCompatible === false
  })

  // ─── Checkout: flush all pending to backend then navigate ─────────────────
  const handleCheckout = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one product.')
      return
    }

    if (hasMissingColor) {
      toast.error('Please select the required colors for all selected items.')
      return
    }

    if (hasIncompatibleVariant) {
      toast.error(
        'Some selected products have incompatible sizes for their assigned screenplates.',
      )
      return
    }

    try {
      const success = await syncCart(mergedItems)
      if (!success) {
        // Error is already toasted by syncCart, but we stop navigation
        return
      }

      toast.success('Cart updated successfully')
      setPendingMap({})
      
      // Save the specifically selected items to localStorage for Transactions page
      localStorage.setItem('pixs_checkout_node', JSON.stringify(selectedItems))
      navigate('/transactions')
    } catch (err) {
      console.error('Checkout error:', err)
      toast.error('Systems encountered an error during checkout. Please try again.')
    }
  }

  // ─── Quantity ─────────────────────────────────────────────────────────────
  const handleQuantityChange = (itemId: string, nextQtyRaw: number) => {
    const target = mergedItems.find((item) => item.id === itemId)
    if (!target) return

    let nextQty = Number.isFinite(nextQtyRaw) ? Math.floor(nextQtyRaw) : target.minOrder
    if (nextQty < target.minOrder) nextQty = target.minOrder

    setPending(itemId, { quantity: nextQty })
  }

  const handleVariantChange = (itemId: string, variantId: string) => {
    const item = mergedItems.find((i) => i.id === itemId)
    if (!item || !item.fullProduct) return

    const productVariant = item.fullProduct.variants?.find((v) => v.variant_id === variantId)
    if (!productVariant) return

    setPending(itemId, {
      variant: {
        id: productVariant.variant_id,
        size: productVariant.size || '',
        width: String(productVariant.width || ''),
        height: String(productVariant.height || ''),
        unitPrice: typeof productVariant.price === 'string' ? parseFloat(productVariant.price) : (Number(productVariant.price) || 0),
        stock: Number(productVariant.stock) || 0,
      },
    })
  }

  const handleColorChange = (item: CartItem, colorId: string) => {
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
        return
      }
    }

    setPending(item.id, { colors: nextColors })
  }


  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading || isCartLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="border-pixs-mint h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"></div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    // Layout: Full page scrollable, fixed header
    <div className="AddToCartPage flex flex-col bg-slate-50 mt-7 lg:mt-0">

      {/* ── Sticky Header ── */}
      <div className="shrink-0 w-full z-30 border-b border-slate-100 bg-white/60 px-6 py-5 backdrop-blur-3xl md:px-16 lg:mt-20">
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

      {/* ── Main content: fills remaining height, no overflow on this level ── */}
      {/* ── Main content ── */}
      <main className="mx-auto w-full max-w-[1400px] px-6 md:px-16">

        {/* Page title + select controls */}
        <div className="mb-6 mt-6 flex flex-col justify-between gap-6 md:flex-row md:items-end shrink-0">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic md:text-5xl">
              Add To Cart
            </h1>
            <p className="mt-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Review products, adjust color and quantity, then proceed to checkout.
            </p>
          </div>

          {mergedItems.length > 0 && (
            <div className="hidden items-center md:flex">
              <button
                onClick={handleSelectToggle}
                className="group flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-5 py-3 text-[10px] font-black tracking-widest text-slate-500 uppercase shadow-sm transition-all hover:bg-slate-50"
              >
                {isAllSelected ? (
                  <>
                    <Trash2 size={16} className="text-rose-500" />
                    Clear Selection
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="text-pixs-mint" />
                    Select All
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Content grid: left scrolls, right is sticky ── */}
        {mergedItems.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-black tracking-tight text-slate-900 uppercase italic">
              Your cart is empty
            </p>
            <p className="mt-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Add products from product details.
            </p>
          </div>
        ) : (
          // h-full so children can take remaining space; overflow-hidden prevents leaking
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] pb-28 lg:pb-32">

            {/* LEFT: Product List */}
            <section className="CartProductList space-y-4">
              {mergedItems.map((item) => {
                const productMeta = item.fullProduct
                const shortDescription =
                  productMeta?.short_description ?? 'No short description available.'
                const isSelected = item.selected

                return (
                  <article
                    key={item.id}
                    onClick={() => toggleSelection(item.id, isSelected)}
                    className={`CartProductCard relative cursor-pointer rounded-[24px] border p-5 shadow-sm transition-all md:p-6 ${
                      isSelected
                        ? 'border-pixs-mint bg-white ring-4 ring-pixs-mint/5'
                        : 'border-slate-100 bg-slate-50 opacity-60'
                    }`}
                  >
                    {/* Selection indicator */}
                    <div className="absolute top-4 left-4 z-10 flex h-6 w-6 items-center justify-center rounded-full transition-all">
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
                            {item.variant && (
                              <p className="CartProductVariant text-xs font-black tracking-widest text-slate-500 uppercase">
                                {item.variant.size} | {item.variant.width} x{' '}
                                {item.variant.height}
                              </p>
                            )}
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


                        {/* Variant Selector */}
                        {productMeta?.variants && (
                          <div className="CartProductVariantSelector" onClick={(e) => e.stopPropagation()}>
                             <VariantSelector
                                variants={productMeta.variants}
                                selectedVariantId={item.variant.id}
                                onSelect={(vId) => handleVariantChange(item.id, vId)}
                                minThreshold={productMeta.min_threshold ?? 5}
                                minOrder={item.minOrder}
                                variantCompatibilityMap={getVariantCompatibilityMap(item)}
                             />
                          </div>
                        )}

                        {/* Color Picker */}
                        {Boolean(productMeta?.is_need_color) && (
                          <div className="CartProductColorPicker space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                Master Color Sequence{' '}
                                {item.plate &&
                                  `(${item.colors.length}/${item.plate.channels} Channels)`}
                              </label>
                              {item.colors.length < (item.plate?.channels || 1) && (
                                <span className="text-[10px] font-black tracking-widest text-rose-500 uppercase animate-pulse">
                                  * Color required
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {colors.map((color) => {
                                const index = item.colors.findIndex((c) => c.id === color.id)
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

                        {/* Quantity */}
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
                              handleQuantityChange(item.id, Number(event.target.value))
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
                          <span className="text-[10px] font-bold text-slate-400 ml-2">
                            min: {item.minOrder}
                          </span>
                        </div>

                        {/* Price Summary */}
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
                              PHP {item.totalCartPrice.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Plate Info */}
                        {item.plate && (
                          <div className="mt-2 border-t border-slate-100 pt-4">
                            <p className="flex items-center gap-2 text-sm font-black tracking-tight text-slate-900 italic">
                              🖨 {item.plate.name}
                            </p>
                            <p className="mt-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                              {item.plate.type === 'Flatscreen'
                                ? 'Flat'
                                : item.plate.type === 'Cylindrical'
                                  ? 'Center'
                                  : 'Front'}{' '}
                              | {item.plate.channels} channels
                            </p>
                            <p className="mt-2 text-xs font-black italic">
                              Printing Price: ₱
                              {(item.plate.printPricePerUnit || 0).toFixed(2)}/unit
                            </p>
                            <p className="mt-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              Printing Subtotal: ₱
                              {(
                                (item.plate.printPricePerUnit || 0) * item.quantity
                              ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </section>

            {/* RIGHT: Cart total — sticky */}
            <aside className="CartTotalSection hidden md:flex flex-col h-fit sticky top-[120px] rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase italic">
                Cart Total
              </h2>
              <p className="mt-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                {selectedItems.length} Selected Item
                {selectedItems.length !== 1 ? 's' : ''}
              </p>
              <div className="my-5 h-px bg-slate-100" />
              <p className="font-mono text-3xl font-black text-slate-900 italic">
                PHP {selectedTotal.toFixed(2)}
              </p>
              <button
                onClick={handleCheckout}
                disabled={selectedItems.length === 0 || hasMissingColor}
                className={`CartCheckoutButton mt-6 w-full rounded-3xl border px-8 py-4 text-[10px] font-black tracking-[4px] uppercase italic shadow-2xl transition-all active:scale-95 ${
                  selectedItems.length > 0 && !hasMissingColor
                    ? 'border-white/10 bg-slate-900 text-white hover:scale-105'
                    : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300 shadow-none'
                }`}
              >
                {hasMissingColor ? 'Complete Config' : 'Checkout Selected'}
              </button>
            </aside>
          </div>
        )}
      </main>

      {/* ── Mobile Fixed Bottom Bar ── */}
      <div className="md:hidden fixed bottom-20 left-0 w-full z-40 bg-white/90 border-t border-slate-100 px-6 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] backdrop-blur-3xl">
        <div className="flex items-center justify-between gap-4">
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

          <div className="flex-1 text-right">
            <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">
              Total
            </p>
            <p className="font-mono text-lg font-black text-slate-900 italic leading-none">
              PHP {selectedTotal.toFixed(2)}
            </p>
          </div>

          <button
            onClick={handleCheckout}
            disabled={selectedItems.length === 0 || hasMissingColor}
            className={`flex h-12 items-center justify-center rounded-2xl px-6 text-[10px] font-black tracking-[2px] uppercase italic shadow-lg transition-all active:scale-95 ${
              selectedItems.length > 0 && !hasMissingColor
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-300 shadow-none'
            }`}
          >
            {hasMissingColor ? 'Fix Entry' : 'Checkout'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddToCartPage