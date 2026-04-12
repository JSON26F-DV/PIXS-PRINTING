import React from 'react'
import type { IPriceBreakdown } from '../../../types/product.types'

interface PriceSummaryProps {
  breakdown: IPriceBreakdown
  quantity: number
  canAddToCart: boolean
  isOutOfStock: boolean
  minOrder: number
  quantity_too_low: boolean
}

const PriceSummary: React.FC<PriceSummaryProps> = ({
  breakdown,
  quantity,
  canAddToCart,
  isOutOfStock,
  minOrder,
  quantity_too_low,
}) => {
  const rows = [
    { label: 'Unit Price', value: `₱${breakdown.variantUnitPrice.toFixed(2)}` },
    ...(breakdown.printPricePerUnit > 0
      ? [
          {
            label: 'Print / Unit',
            value: `₱${breakdown.printPricePerUnit.toFixed(2)}`,
          },
          {
            label: `Setup Fee (×1)`,
            value: `₱${breakdown.setupFee.toLocaleString()}`,
          },
        ]
      : []),
    {
      label: `Qty ×${quantity.toLocaleString()}`,
      value: `₱${breakdown.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
  ]

  return (
    <div className="space-y-5 rounded-3xl bg-slate-900 p-6">
      {/* Breakdown */}
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              {row.label}
            </span>
            <span className="font-mono text-[10px] font-black text-slate-300">
              {row.value}
            </span>
          </div>
        ))}
        <div className="my-2 h-px bg-slate-700" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Est. Total
          </span>
          <span className="font-mono text-2xl font-black tracking-tighter text-white italic">
            ₱
            {breakdown.total.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {/* CTA */}
      <button
        disabled={!canAddToCart}
        className="bg-pixs-mint shadow-pixs-mint/20 w-full rounded-2xl py-5 text-xs font-black tracking-[4px] text-slate-900 uppercase shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {isOutOfStock
          ? 'Out of Stock'
          : quantity_too_low
            ? `Min. ${minOrder.toLocaleString()} pcs required`
            : 'Add to Cart'}
      </button>

      <button
        disabled={!canAddToCart}
        className="w-full rounded-2xl border-2 border-slate-700 py-4 text-xs font-black tracking-[4px] text-slate-300 uppercase transition-all hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Request Quotation
      </button>
    </div>
  )
}

export default PriceSummary
