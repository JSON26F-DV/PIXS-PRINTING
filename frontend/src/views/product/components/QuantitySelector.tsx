import React from 'react'
import { Minus, Plus } from 'lucide-react'
import { clsx } from 'clsx'

interface QuantitySelectorProps {
  quantity: number
  minOrder: number
  maxStock: number
  onChange: (qty: number) => void
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  minOrder,
  maxStock,
  onChange,
}) => {
  const isTooLow = quantity < minOrder
  const isTooHigh = quantity > maxStock
  const hasError = isTooLow || isTooHigh

  const decrement = () =>
    onChange(Math.max(1, quantity - (quantity > minOrder ? minOrder : 1)))
  const increment = () => onChange(Math.min(maxStock, quantity + minOrder))

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
        Quantity{' '}
        <span className="font-bold tracking-normal text-slate-300 normal-case">
          · MOQ: {minOrder.toLocaleString()} pcs
        </span>
      </p>
      <div
        className={clsx(
          'flex w-full items-center gap-0 overflow-hidden rounded-2xl border-2 transition-all',
          hasError
            ? 'border-rose-400 shadow-lg shadow-rose-100'
            : 'border-slate-100',
        )}
      >
        <button
          onClick={decrement}
          disabled={quantity <= minOrder}
          className="flex h-14 w-14 items-center justify-center text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-900 disabled:opacity-20"
        >
          <Minus size={18} />
        </button>
        <input
          type="number"
          min={minOrder}
          max={maxStock}
          value={quantity}
          onChange={(e) => onChange(parseInt(e.target.value) || minOrder)}
          className="flex-1 bg-transparent py-3 text-center font-mono text-lg font-black text-slate-900 italic focus:outline-none"
        />
        <button
          onClick={increment}
          disabled={quantity >= maxStock}
          className="flex h-14 w-14 items-center justify-center text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-900 disabled:opacity-20"
        >
          <Plus size={18} />
        </button>
      </div>
      {isTooLow && (
        <p className="text-[10px] font-black tracking-widest text-rose-500 uppercase">
          ↳ Minimum order is {minOrder.toLocaleString()} pcs
        </p>
      )}
      {isTooHigh && (
        <p className="text-[10px] font-black tracking-widest text-rose-500 uppercase">
          ↳ Only {maxStock.toLocaleString()} units available
        </p>
      )}
    </div>
  )
}

export default QuantitySelector
