import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { clsx } from 'clsx';

interface QuantitySelectorProps {
  quantity: number;
  minOrder: number;
  maxStock: number;
  onChange: (qty: number) => void;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({ quantity, minOrder, maxStock, onChange }) => {
  const isTooLow = quantity < minOrder;
  const isTooHigh = quantity > maxStock;
  const hasError = isTooLow || isTooHigh;

  const decrement = () => onChange(Math.max(1, quantity - (quantity > minOrder ? minOrder : 1)));
  const increment = () => onChange(Math.min(maxStock, quantity + minOrder));

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">
        Quantity <span className="text-slate-300 normal-case tracking-normal font-bold">· MOQ: {minOrder.toLocaleString()} pcs</span>
      </p>
      <div className={clsx(
        'flex items-center gap-0 w-full rounded-2xl border-2 overflow-hidden transition-all',
        hasError ? 'border-rose-400 shadow-lg shadow-rose-100' : 'border-slate-100'
      )}>
        <button
          onClick={decrement}
          disabled={quantity <= minOrder}
          className="w-14 h-14 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-20 transition-all"
        >
          <Minus size={18} />
        </button>
        <input
          type="number"
          min={minOrder}
          max={maxStock}
          value={quantity}
          onChange={e => onChange(parseInt(e.target.value) || minOrder)}
          className="flex-1 text-center text-lg font-black text-slate-900 font-mono italic focus:outline-none bg-transparent py-3"
        />
        <button
          onClick={increment}
          disabled={quantity >= maxStock}
          className="w-14 h-14 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-20 transition-all"
        >
          <Plus size={18} />
        </button>
      </div>
      {isTooLow && <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">↳ Minimum order is {minOrder.toLocaleString()} pcs</p>}
      {isTooHigh && <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">↳ Only {maxStock.toLocaleString()} units available</p>}
    </div>
  );
};

export default QuantitySelector;
