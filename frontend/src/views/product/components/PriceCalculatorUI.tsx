import {
  ShoppingCart,
  AlertTriangle,
  Info,
  Printer,
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
}) => {
  const isColorMissing = isNeedColor && !hasRequiredColor
  const isPlateMissing = isNeedScreenplate && !hasRequiredPlate

  return (
    <div className="animate-in slide-in-from-bottom-8 space-y-8 duration-700">
      {/* Total Projection Matrix */}
      <div className="group relative space-y-10 overflow-hidden rounded-[44px] bg-slate-900 p-10 shadow-2xl shadow-slate-900/40 md:p-12">
        <div className="bg-pixs-mint/5 absolute top-0 right-0 h-64 w-64 translate-x-12 -translate-y-12 animate-pulse rounded-full blur-[120px]" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-8">
          <div className="space-y-2">
            <p className="text-pixs-mint text-[10px] font-black tracking-[6px] uppercase italic">
              Active Projection
            </p>
            <h2 className="text-4xl leading-none font-black tracking-tighter text-white uppercase italic md:text-5xl">
              ₱{breakdown.total.toLocaleString()}
            </h2>
          </div>

          <div className="flex flex-col items-end">
            <span className="mb-1 rounded-full px-2 py-1 text-[8px] leading-none font-black tracking-widest text-emerald-500 uppercase ring-1 ring-emerald-500/20">
              Unit Logic Protocol
            </span>
            <span className="text-[8px] font-bold tracking-widest text-slate-500 uppercase italic opacity-40">
              Final Transaction Node
            </span>
          </div>
        </div>

        {/* Calculation Nodes */}
        <div className="relative z-10 grid grid-cols-2 gap-8">
          <div className="hover:border-pixs-mint/20 group/stat space-y-1.5 rounded-[28px] border border-slate-800/60 bg-slate-800/40 p-5 transition-all">
            <div className="mb-1 flex items-center gap-2 text-slate-400">
              <Printer size={12} className="text-pixs-mint" />
              <p className="text-[8px] font-black tracking-widest uppercase">
                Print / Unit
              </p>
            </div>
            <p className="text-lg font-black text-white italic">
              ₱{breakdown.printPricePerUnit.toLocaleString()}
            </p>
          </div>

          <div className="hover:border-pixs-mint/20 group/stat space-y-1.5 rounded-[28px] border border-slate-800/60 bg-slate-800/40 p-5 transition-all">
            <div className="mb-1 flex items-center gap-2 text-slate-400">
              <PackageCheck size={12} className="text-pixs-mint" />
              <p className="text-[8px] font-black tracking-widest uppercase">
                Base / Unit
              </p>
            </div>
            <p className="text-lg font-black text-white italic">
              ₱{breakdown.variantUnitPrice.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Logic Constraint Center */}
      <div className="space-y-4">
        {isOutOfStock && (
          <div className="animate-in zoom-in flex items-center gap-3 rounded-[28px] border border-rose-100 bg-rose-50 p-5 text-rose-600 italic transition-all duration-500">
            <AlertTriangle size={18} strokeWidth={3} />
            <p className="text-[10px] font-black tracking-[2px] uppercase">
              Inventory State Collision: Fully Depleted Stack.
            </p>
          </div>
        )}

        {isQuantityTooLow && (
          <div className="animate-in zoom-in flex items-center gap-3 rounded-[28px] border border-amber-100 bg-amber-50 p-5 text-amber-600 italic transition-all duration-500">
            <Info size={18} strokeWidth={3} />
            <p className="text-[10px] font-black tracking-[2px] uppercase">
              Threshold Logic Error: {minOrder} Node Requirement.
            </p>
          </div>
        )}

        {isPlateMissing && (
          <div className="animate-in slide-in-from-left flex items-center gap-3 rounded-[28px] border border-rose-800 bg-rose-900 p-5 text-rose-100 italic transition-all duration-500">
            <Layers size={18} strokeWidth={3} className="text-rose-400" />
            <p className="text-[10px] font-black tracking-[2px] uppercase">
              Protocol Locked: Customized Screen Plate Selection Required.
            </p>
          </div>
        )}

        {isColorMissing && (
          <div className="flex animate-pulse items-center gap-3 rounded-[28px] border border-dashed border-slate-800 bg-slate-900 p-5 text-amber-500 italic transition-all">
            <Palette size={18} strokeWidth={3} className="text-amber-400" />
            <p className="text-[10px] font-black tracking-[2px] uppercase">
              Protocol Locked: Color Identification node required.
            </p>
          </div>
        )}

        {/* Dual Action CTA Terminal */}
        <div className="flex flex-col gap-4">
          <button
            onClick={onBuyNow}
            disabled={!canAddToCart}
            className={clsx(
              'group relative flex w-full items-center justify-center gap-4 overflow-hidden rounded-[32px] py-6 transition-all duration-500 active:scale-[0.98]',
              canAddToCart
                ? 'bg-pixs-mint shadow-pixs-mint/20 text-slate-900 shadow-xl hover:scale-[1.01]'
                : 'cursor-not-allowed bg-slate-100 text-slate-300 opacity-60 grayscale',
            )}
          >
            <span className="text-xl font-black tracking-tighter uppercase italic">
              {canAddToCart ? 'BUY NOW' : 'Protocol Locked'}
            </span>
            <PackageCheck size={24} strokeWidth={3} />
          </button>

          <button
            onClick={onAddToCart}
            disabled={!canAddToCart}
            className={clsx(
              'group flex w-full items-center justify-center gap-4 rounded-[28px] border border-slate-200 py-5 transition-all duration-500 active:scale-[0.98]',
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
