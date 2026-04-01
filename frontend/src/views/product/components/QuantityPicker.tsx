import React from 'react';
import { Plus, Minus, AlertTriangle, Info, Zap } from 'lucide-react';
import { clsx } from 'clsx';

interface QuantityPickerProps {
  quantity: number;
  minOrder: number;
  maxStock: number;
  onChange: (val: number) => void;
}

/**
 * Enterprise Quantity Protocol Picker.
 * Features: High-tactile manual controls + Quick Clickable range shortcuts (1x, 5x, 10x Min Order).
 * Logic: strictly enforced thresholds with collision detection.
 */
const QuantityPicker: React.FC<QuantityPickerProps> = ({ quantity, minOrder, maxStock, onChange }) => {
  const isTooLow = quantity <= minOrder;
  const isAtPeak = quantity >= maxStock;

  // Operational Logic: Calculate standard quick-select ranges based on product minimum
  const quickRanges = [minOrder, minOrder * 5, minOrder * 10].filter(val => val <= maxStock);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Order Quantity Protocol</p>
        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic">{maxStock.toLocaleString()} Nodes Available</span>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
        {/* Manual Protocol Interaction */}
        <div className="flex items-center p-2 bg-slate-900 border border-slate-800 rounded-[32px] shadow-2xl shadow-slate-900/40">
          <button
            onClick={() => onChange(Math.max(minOrder, quantity - 1))}
            disabled={isTooLow}
            className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-pixs-mint disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90"
          >
            <Minus size={18} strokeWidth={3} />
          </button>
          
          <input
            type="number"
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value) || minOrder;
              onChange(Math.min(maxStock, Math.max(minOrder, val)));
            }}
            className="w-24 bg-transparent text-white text-center font-black text-2xl outline-none font-mono italic"
          />

          <button
            onClick={() => onChange(Math.min(maxStock, quantity + 1))}
            disabled={isAtPeak}
            className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-pixs-mint disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90"
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>

        {/* Quick Clickable Range Protocol */}
        <div className="flex flex-wrap gap-2.5">
           {quickRanges.map(range => (
             <button
               key={range}
               onClick={() => onChange(range)}
               className={clsx(
                 'px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border outline-none flex items-center gap-2',
                 quantity === range 
                  ? 'bg-pixs-mint border-pixs-mint text-slate-900 shadow-lg shadow-pixs-mint/20 scale-105' 
                  : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300 hover:bg-white active:scale-95 shadow-sm'
               )}
             >
               <Zap size={10} className={quantity === range ? 'text-slate-900' : 'text-pixs-mint'} />
               {range.toLocaleString()}
             </button>
           ))}
        </div>
      </div>

      {/* Validation Feedback Terminal */}
      <div className="flex flex-wrap gap-3">
         <div className={clsx('flex items-center gap-2 px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all', quantity === minOrder ? 'bg-amber-50 border-amber-100 text-amber-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400')}>
            <Info size={12} /> Min Node Protocol: {minOrder.toLocaleString()}
         </div>
         {isAtPeak && (
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest animate-pulse shadow-sm shadow-rose-200/20">
              <AlertTriangle size={12} /> Peak Inventory Level Reached
            </div>
         )}
      </div>
    </div>
  );
};

export default QuantityPicker;
