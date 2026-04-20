import React from 'react'
import { clsx } from 'clsx'
import type { IProductVariant } from '../../../types/product.types'

interface VariantSelectorProps {
  variants: IProductVariant[]
  selectedVariantId: string | null
  onSelect: (variantId: string) => void
  minThreshold: number
  minOrder: number
  variantCompatibilityMap?: Record<string, { isCompatible: boolean; reason?: string }>
}

/**
 * Enterprise Variant Selection Matrix.
 * Displays available sizes/configurations with integrated stock-level indicators.
 * Formula Logic: Direct mapping to variant-specific price nodes.
 */
const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  selectedVariantId,
  onSelect,
  minThreshold,
  minOrder,
  variantCompatibilityMap,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
        Select Size
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {variants.map((v) => {
          const isLowStock = v.stock > 0 && v.stock <= minThreshold
          const isOutOfStock = v.stock < minOrder
          
          const compInfo = variantCompatibilityMap?.[v.variant_id]
          const isCompatible = !compInfo || compInfo.isCompatible
          const isDisabled = isOutOfStock || !isCompatible

          return (
            <div key={v.variant_id} className="group relative">
              <button
                onClick={() => !isDisabled && onSelect(v.variant_id)}
                disabled={isDisabled}
                className={clsx(
                  'relative flex w-full flex-col gap-1 overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-300',
                  selectedVariantId === v.variant_id
                    ? 'border-pixs-mint shadow-pixs-mint/5 translate-y-[-2px] bg-white shadow-lg'
                    : 'border-slate-50 bg-white hover:border-slate-300',
                  isDisabled
                    ? 'cursor-not-allowed border-dashed opacity-40 grayscale'
                    : 'hover:scale-[1.02] active:scale-[0.98]',
                )}
              >
                <span className="text-[10px] leading-none font-black tracking-widest text-slate-400 uppercase">
                  Size · {v.size}
                </span>
                <span className="group-hover:text-pixs-mint text-sm font-black text-slate-900 transition-colors">
                  ₱{v.price.toLocaleString()}
                </span>

                {isLowStock && !isOutOfStock && (
                  <span className="mt-1 animate-pulse text-[7px] font-black tracking-widest text-amber-500 uppercase">
                    Low Stock
                  </span>
                )}
                {isOutOfStock && (
                  <span className="mt-1 text-[7px] font-black tracking-widest text-rose-500 uppercase">
                    Out of Stock
                  </span>
                )}
                {!isCompatible && !isOutOfStock && (
                  <span className="mt-1 text-[7px] font-black tracking-widest text-slate-400 uppercase">
                    Not Compatible
                  </span>
                )}

                {selectedVariantId === v.variant_id && (
                  <div className="bg-pixs-mint shadow-pixs-mint absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full shadow-2xl" />
                )}
              </button>

              {/* Hover Tooltip for Disabled States */}
              {isDisabled && (
                <div className="pointer-events-none absolute -top-8 left-1/2 z-50 -translate-x-1/2 opacity-0 transition-all duration-300 group-hover:-top-10 group-hover:opacity-100">
                  <div className="rounded-lg bg-slate-900 px-3 py-1.5 shadow-xl">
                    <p className="whitespace-nowrap text-[8px] font-black tracking-widest text-white uppercase">
                      {isOutOfStock 
                        ? 'Insufficient Inventory' 
                        : 'Not Compatible'}
                    </p>
                    {/* Tooltip Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-t-4 border-slate-900 border-x-transparent" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VariantSelector
