import React from 'react'
import { clsx } from 'clsx'
import type { IProductVariant } from '../../../types/product.types'

interface VariantSelectorProps {
  variants: IProductVariant[]
  selectedVariantId: string | null
  onSelect: (variantId: string) => void
  minThreshold: number
  minOrder: number
  compatibleVariantSizes?: string[] | null
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
  compatibleVariantSizes,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
        Select Production Variant
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {variants.map((v) => {
          const isLowStock = v.stock > 0 && v.stock <= minThreshold
          const isOutOfStock = v.stock < minOrder
          const isCompatible =
            !compatibleVariantSizes || compatibleVariantSizes.includes(v.size)
          const isDisabled = isOutOfStock || !isCompatible

          return (
            <button
              key={v.variant_id}
              onClick={() => !isDisabled && onSelect(v.variant_id)}
              disabled={isDisabled}
              className={clsx(
                'group relative flex flex-col gap-1 overflow-hidden rounded-2xl border-2 p-4 text-left transition-all',
                selectedVariantId === v.variant_id
                  ? 'border-pixs-mint shadow-pixs-mint/5 translate-y-[-2px] bg-white shadow-lg'
                  : 'border-slate-50 bg-white hover:border-slate-300',
                isDisabled
                  ? 'cursor-not-allowed border-dashed opacity-40 grayscale'
                  : '',
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
                  Low Node Inventory
                </span>
              )}
              {isOutOfStock && (
                <span className="mt-1 text-[7px] font-black tracking-widest text-rose-500 uppercase">
                  Out of Stock
                </span>
              )}
              {!isCompatible && !isOutOfStock && (
                <span className="mt-1 text-[7px] font-black tracking-widest text-slate-400 uppercase">
                  Plate Incompatible
                </span>
              )}

              {selectedVariantId === v.variant_id && (
                <div className="bg-pixs-mint shadow-pixs-mint absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full shadow-2xl" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default VariantSelector
