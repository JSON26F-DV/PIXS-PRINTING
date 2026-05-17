import React from 'react'
import { Plus, Minus, AlertTriangle, Info, Zap } from 'lucide-react'
import { clsx } from 'clsx'

interface QuantityPickerProps {
  quantity: number
  minOrder: number
  maxStock: number
  onChange: (val: number) => void
}

/**
 * Enterprise Quantity Protocol Picker.
 * Features: High-tactile manual controls + Quick Clickable range shortcuts (1x, 5x, 10x Min Order).
 * Logic: strictly enforced thresholds with collision detection.
 */
const QuantityPicker: React.FC<QuantityPickerProps> = ({
  quantity,
  minOrder,
  maxStock,
  onChange,
}) => {
  const isTooLow = quantity <= minOrder
  const isAtPeak = quantity >= maxStock

  // Operational Logic: Calculate standard quick-select ranges based on product minimum
  const quickRanges = [minOrder, minOrder * 5, minOrder * 10].filter(
    (val) => val <= maxStock,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
          Select Quantity
        </p>
        <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase italic">
          {maxStock.toLocaleString()} units available
        </span>
      </div>

      <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
        {/* Manual Protocol Interaction */}
        <div className="flex items-center rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl shadow-slate-900/40 md:rounded-[32px]">
          <button
            onClick={() => onChange(Math.max(minOrder, quantity - 1))}
            disabled={isTooLow}
            className="hover:text-pixs-mint flex h-12 w-12 items-center justify-center text-slate-400 transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-20"
          >
            <Minus size={18} strokeWidth={3} />
          </button>

          <input
            type="number"
            value={quantity || ''}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              if (isNaN(val)) {
                onChange(0)
              } else {
                onChange(Math.min(maxStock, val))
              }
            }}
            className="w-24 bg-transparent text-center font-mono text-2xl font-black text-white italic outline-none disabled:opacity-50"
          />

          <button
            onClick={() => onChange(Math.min(maxStock, quantity + 1))}
            disabled={isAtPeak}
            className="hover:text-pixs-mint flex h-12 w-12 items-center justify-center text-slate-400 transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-20"
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>

        {/* Quick Clickable Range Protocol */}
        <div className="flex flex-wrap gap-2.5">
          {quickRanges.map((range) => (
            <button
              key={range}
              onClick={() => onChange(range)}
              className={clsx(
                'flex items-center gap-2 rounded-2xl border px-5 py-3 text-[10px] font-black tracking-widest uppercase transition-all outline-none',
                quantity === range
                  ? 'bg-pixs-mint border-pixs-mint shadow-pixs-mint/20 scale-105 text-slate-900 shadow-lg'
                  : 'border-slate-100 bg-slate-50 text-slate-400 shadow-sm hover:border-slate-300 hover:bg-white active:scale-95',
              )}
            >
              <Zap
                size={10}
                className={
                  quantity === range ? 'text-slate-900' : 'text-pixs-mint'
                }
              />
              {range.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Validation Feedback Terminal */}
      <div className="flex flex-wrap gap-3">
        <div
          className={clsx(
            'flex items-center gap-2 rounded-xl border px-4 py-2 text-[9px] font-black tracking-widest uppercase transition-all',
            quantity < minOrder
              ? 'border-rose-100 bg-rose-50 text-rose-600 shadow-sm animate-pulse'
              : quantity === minOrder
              ? 'border-amber-100 bg-amber-50 text-amber-600 shadow-sm'
              : 'border-slate-100 bg-slate-50 text-slate-400',
          )}
        >
          {quantity < minOrder ? <AlertTriangle size={12} /> : <Info size={12} />} 
          Minimum Requirement: {minOrder.toLocaleString()} units
        </div>
        {isAtPeak && (
          <div className="flex animate-pulse items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2 text-[9px] font-black tracking-widest text-rose-600 uppercase shadow-sm shadow-rose-200/20">
            <AlertTriangle size={12} /> Maximum Available Stock Reached
          </div>
        )}
      </div>
    </div>
  )
}

export default QuantityPicker
