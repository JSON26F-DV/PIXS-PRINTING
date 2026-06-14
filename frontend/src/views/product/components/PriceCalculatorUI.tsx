import {
  ShoppingCart,
  AlertTriangle,
  Info,
  PackageCheck,
  Layers,
  Palette,
} from 'lucide-react'

import { clsx } from 'clsx'
import type { IPriceBreakdown } from '../../../types/product.types'

interface PriceCalculatorUIProps {
  breakdown: IPriceBreakdown
  canAddToCart: boolean
  isOutOfStock: boolean
  minOrder: number
  isQuantityTooLow: boolean
  hasRequiredPlate: boolean
  isNeedScreenplate: boolean
  hasRequiredColor: boolean
  isNeedColor: boolean
  onAddToCart: () => void
  onBuyNow: () => void
  quantity: number
  isStockInsufficient?: boolean
  hideBuyNow?: boolean
}

/**
 * Enterprise Price Summary & Transaction Terminal.
 * Formula: unit-based unit_price × quantity (print inclusive).
 * Protocol: Enforces mandatory metadata identification based on product type (Hardware vs Printing).
 */
const PriceCalculatorUI: React.FC<PriceCalculatorUIProps> = ({
  breakdown,
  canAddToCart,
  isOutOfStock,
  minOrder,
  isQuantityTooLow,
  hasRequiredPlate,
  isNeedScreenplate,
  hasRequiredColor,
  isNeedColor,
  onAddToCart,
  onBuyNow,
  quantity,
  isStockInsufficient,
  hideBuyNow,
}) => {
  const isColorMissing = isNeedColor && !hasRequiredColor
  const isPlateMissing = isNeedScreenplate && !hasRequiredPlate

  return (
    <div className="animate-in slide-in-from-bottom-8 space-y-8 duration-700">
      {/* Price Summary Container */}
      <div className="group relative space-y-10 overflow-hidden rounded-3xl bg-white p-10 shadow-xl shadow-slate-200/50 border border-slate-100 md:rounded-[44px] md:p-12">
        <div className="bg-pixs-mint/20 absolute top-0 right-0 h-64 w-64 translate-x-12 -translate-y-12 animate-pulse rounded-full blur-[120px]" />

        <div className="flex items-center justify-between border-b border-slate-100 pb-8">
          <div className="space-y-2">
            <p className="text-pixs-mint text-[10px] font-black tracking-[6px] uppercase italic">
              Estimated Total
            </p>
            <h2 className="text-4xl leading-none font-black tracking-tighter text-slate-900 uppercase italic md:text-5xl">
              ₱{breakdown.total.toLocaleString()}
            </h2>
          </div>

          <div className="flex flex-col items-end">
            <span className="mb-1 rounded-full px-2 py-1 text-[8px] leading-none font-black tracking-widest text-emerald-600 uppercase ring-1 ring-emerald-200 bg-emerald-50">
              Pricing Mode
            </span>
            <span className="text-[8px] font-bold tracking-widest text-slate-400 uppercase italic">
              Final Cost
            </span>
          </div>
        </div>

        {/* Precise Calculation Matrix */}
        <div className="relative z-10 space-y-4">
          {/* Unit Price Node */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <PackageCheck size={14} className="text-pixs-mint" />
              <span className="text-[10px] font-black tracking-[3px] text-slate-500 uppercase italic">
                Unit Price
              </span>
            </div>
            <span className="text-sm font-black text-slate-900 italic">
              ₱{breakdown.variantUnitPrice.toLocaleString()}
            </span>
          </div>

          {/* Volume Indicator Node */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <Layers size={14} className="text-pixs-mint" />
              <span className="text-[10px] font-black tracking-[3px] text-slate-500 uppercase italic">
                Quantity
              </span>
            </div>
            <span className="text-sm font-black text-slate-900 italic">
              {quantity.toLocaleString()} Units
            </span>
          </div>

          {/* Total Cost */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <span className="text-pixs-mint text-[10px]">∑</span>
              <span className="text-[10px] font-black tracking-[3px] text-slate-500 uppercase italic">
                Total Cost
              </span>
            </div>
            <span className="text-sm font-black text-slate-900 italic">
              ₱{(breakdown.variantUnitPrice * quantity).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Logic Constraint Center */}
      <div className="space-y-4">
        {isOutOfStock && (
          <div className="animate-in zoom-in flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-5 text-rose-600 italic transition-all duration-500 md:rounded-[28px]">
            <AlertTriangle size={18} strokeWidth={3} />
            <p className="text-[10px] font-black tracking-[2px] uppercase">
              {isStockInsufficient 
                ? `Insufficient stock for minimum order (${minOrder} qty).` 
                : "Product is currently out of stock."}
            </p>
          </div>
        )}

        {isQuantityTooLow && (
          <div className="animate-in zoom-in flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-5 text-amber-600 italic transition-all duration-500 md:rounded-[28px]">
            <Info size={18} strokeWidth={3} />
            <p className="text-[10px] font-black tracking-[2px] uppercase">
              Notice: Minimum order of {minOrder} units required.
            </p>
          </div>
        )}

        {isPlateMissing && (
          <div className="animate-in slide-in-from-left flex items-center gap-3 rounded-2xl border border-rose-800 bg-rose-900 p-5 text-rose-100 italic transition-all duration-500 md:rounded-[28px]">
            <Layers size={18} strokeWidth={3} className="text-rose-400" />
            <p className="text-[10px] font-black tracking-[2px] uppercase">
              Required: Please select a screenplate to proceed.
            </p>
          </div>
        )}

        {isColorMissing && (
          <div className="flex animate-pulse items-center gap-3 rounded-2xl border border-dashed border-slate-800 bg-slate-900 p-5 text-amber-500 italic transition-all md:rounded-[28px]">
            <Palette size={18} strokeWidth={3} className="text-amber-400" />
            <p className="text-[10px] font-black tracking-[2px] uppercase">
              Required: Please select a color to proceed.
            </p>
          </div>
        )}

        {/* Dual Action CTA Terminal */}
        <div className="flex flex-col gap-4">
          {!hideBuyNow && (
            <button
              onClick={onBuyNow}
              disabled={!canAddToCart}
              className={clsx(
                'group relative flex w-full items-center justify-center gap-4 overflow-hidden rounded-2xl py-6 transition-all duration-500 active:scale-[0.98] md:rounded-[32px]',
                canAddToCart
                  ? 'bg-pixs-mint text-slate-900 hover:bg-pixs-mint/90 hover:scale-[1.01]'
                  : 'cursor-not-allowed bg-slate-100 text-slate-300 opacity-60',
              )}
            >
              <span className="text-xl font-black tracking-tighter uppercase italic">
                {canAddToCart ? 'BUY NOW' : 'Selection Incomplete'}
              </span>
              <PackageCheck size={24} strokeWidth={3} />
            </button>
          )}

          <button
            onClick={onAddToCart}
            disabled={!canAddToCart}
            className={clsx(
              'group flex w-full items-center justify-center gap-4 rounded-2xl border border-slate-200 py-5 transition-all duration-500 active:scale-[0.98] md:rounded-[28px]',
              canAddToCart
                ? 'bg-white text-slate-500 hover:border-slate-400 hover:text-slate-900'
                : 'cursor-not-allowed bg-slate-50 text-slate-300 opacity-40',
            )}
          >
            <span className="text-xs font-black tracking-[3px] uppercase italic">
              ADD TO CART
            </span>
            <ShoppingCart size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default PriceCalculatorUI
