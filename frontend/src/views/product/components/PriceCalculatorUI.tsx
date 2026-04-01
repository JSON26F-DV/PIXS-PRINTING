import { ShoppingCart, AlertTriangle, Info, Printer, PackageCheck, Layers, Palette } from 'lucide-react';

import { clsx } from 'clsx';
import type { IPriceBreakdown } from '../../../types/product.types';

interface PriceCalculatorUIProps {
  breakdown: IPriceBreakdown;
  canAddToCart: boolean;
  isOutOfStock: boolean;
  minOrder: number;
  isQuantityTooLow: boolean;
  hasRequiredPlate: boolean;
  isNeedScreenplate: boolean;
  hasRequiredColor: boolean;
  isNeedColor: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
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
  const isColorMissing = isNeedColor && !hasRequiredColor;
  const isPlateMissing = isNeedScreenplate && !hasRequiredPlate;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      {/* Total Projection Matrix */}
      <div className="bg-slate-900 rounded-[44px] p-10 md:p-12 space-y-10 shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pixs-mint/5 blur-[120px] rounded-full translate-x-12 -translate-y-12 animate-pulse" />
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-8">
           <div className="space-y-2">
              <p className="text-[10px] font-black text-pixs-mint uppercase tracking-[6px] italic">Active Projection</p>
              <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">₱{breakdown.total.toLocaleString()}</h2>
           </div>
           
           <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1 ring-1 ring-emerald-500/20 px-2 py-1 rounded-full">Unit Logic Protocol</span>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest italic opacity-40">Final Transaction Node</span>
           </div>
        </div>

        {/* Calculation Nodes */}
        <div className="grid grid-cols-2 gap-8 relative z-10">
          <div className="space-y-1.5 p-5 bg-slate-800/40 rounded-[28px] border border-slate-800/60 transition-all hover:border-pixs-mint/20 group/stat">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Printer size={12} className="text-pixs-mint" />
              <p className="text-[8px] font-black uppercase tracking-widest">Print / Unit</p>
            </div>
            <p className="text-lg font-black text-white italic">₱{breakdown.printPricePerUnit.toLocaleString()}</p>
          </div>

          <div className="space-y-1.5 p-5 bg-slate-800/40 rounded-[28px] border border-slate-800/60 transition-all hover:border-pixs-mint/20 group/stat">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <PackageCheck size={12} className="text-pixs-mint" />
              <p className="text-[8px] font-black uppercase tracking-widest">Base / Unit</p>
            </div>
            <p className="text-lg font-black text-white italic">₱{breakdown.variantUnitPrice.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Logic Constraint Center */}
      <div className="space-y-4">
        {isOutOfStock && (
           <div className="flex items-center gap-3 p-5 bg-rose-50 text-rose-600 rounded-[28px] border border-rose-100 italic transition-all animate-in zoom-in duration-500">
             <AlertTriangle size={18} strokeWidth={3} />
             <p className="text-[10px] font-black uppercase tracking-[2px]">Inventory State Collision: Fully Depleted Stack.</p>
           </div>
        )}
        
        {isQuantityTooLow && (
           <div className="flex items-center gap-3 p-5 bg-amber-50 text-amber-600 rounded-[28px] border border-amber-100 italic transition-all animate-in zoom-in duration-500">
             <Info size={18} strokeWidth={3} />
             <p className="text-[10px] font-black uppercase tracking-[2px]">Threshold Logic Error: {minOrder} Node Requirement.</p>
           </div>
        )}

        {isPlateMissing && (
           <div className="flex items-center gap-3 p-5 bg-rose-900 text-rose-100 rounded-[28px] border border-rose-800 italic transition-all animate-in slide-in-from-left duration-500">
             <Layers size={18} strokeWidth={3} className="text-rose-400" />
             <p className="text-[10px] font-black uppercase tracking-[2px]">Protocol Locked: Customized Screen Plate Selection Required.</p>
           </div>
        )}

        {isColorMissing && (
           <div className="flex items-center gap-3 p-5 bg-slate-900 text-amber-500 rounded-[28px] border border-slate-800 italic transition-all border-dashed animate-pulse">
             <Palette size={18} strokeWidth={3} className="text-amber-400" />
             <p className="text-[10px] font-black uppercase tracking-[2px]">Protocol Locked: Color Identification node required.</p>
           </div>
        )}

        {/* Dual Action CTA Terminal */}
        <div className="flex flex-col gap-4">
          <button
            onClick={onBuyNow}
            disabled={!canAddToCart}
            className={clsx(
              'w-full py-6 rounded-[32px] flex items-center justify-center gap-4 transition-all duration-500 relative overflow-hidden group active:scale-[0.98]',
              canAddToCart 
                ? 'bg-pixs-mint text-slate-900 shadow-xl shadow-pixs-mint/20 hover:scale-[1.01]' 
                : 'bg-slate-100 text-slate-300 cursor-not-allowed grayscale opacity-60'
            )}
          >
            <span className="text-xl font-black uppercase italic tracking-tighter">
              {canAddToCart ? 'BUY NOW' : 'Protocol Locked'}
            </span>
            <PackageCheck size={24} strokeWidth={3} />
          </button>

          <button
            onClick={onAddToCart}
            disabled={!canAddToCart}
            className={clsx(
              'w-full py-5 rounded-[28px] flex items-center justify-center gap-4 transition-all duration-500 border border-slate-200 group active:scale-[0.98]',
              canAddToCart 
                ? 'bg-white text-slate-500 hover:text-slate-900 hover:border-slate-400' 
                : 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-40'
            )}
          >
            <span className="text-xs font-black uppercase tracking-[3px] italic">
              ADD TO CART
            </span>
            <ShoppingCart size={16} strokeWidth={2.5} />
          </button>

        </div>
      </div>
    </div>
  );
};

export default PriceCalculatorUI;
