import React from 'react';
import { clsx } from 'clsx';
import type { IProductVariant } from '../../../types/product.types';

interface VariantSelectorProps {
  variants: IProductVariant[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
  minThreshold: number;
}

/**
 * Enterprise Variant Selection Matrix.
 * Displays available sizes/configurations with integrated stock-level indicators.
 * Formula Logic: Direct mapping to variant-specific price nodes.
 */
const VariantSelector: React.FC<VariantSelectorProps> = ({ variants, selectedVariantId, onSelect, minThreshold }) => {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Select Production Variant</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {variants.map(v => {
          const isLowStock = v.stock > 0 && v.stock <= minThreshold;
          const isOutOfStock = v.stock === 0;

          return (
            <button
              key={v.variant_id}
              onClick={() => !isOutOfStock && onSelect(v.variant_id)}
              disabled={isOutOfStock}
              className={clsx(
                'relative p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-1 group overflow-hidden',
                selectedVariantId === v.variant_id ? 'border-pixs-mint bg-white shadow-lg shadow-pixs-mint/5 translate-y-[-2px]' : 'border-slate-50 hover:border-slate-300 bg-white',
                isOutOfStock ? 'opacity-40 grayscale cursor-not-allowed border-dashed' : ''
              )}
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Size · {v.size}</span>
              <span className="text-sm font-black text-slate-900 group-hover:text-pixs-mint transition-colors">₱{v.price.toLocaleString()}</span>
              
              {isLowStock && (
                 <span className="text-[7px] font-black uppercase tracking-widest text-amber-500 mt-1 animate-pulse">Low Node Inventory</span>
              )}
              {isOutOfStock && (
                 <span className="text-[7px] font-black uppercase tracking-widest text-rose-500 mt-1">Null Inventory</span>
              )}

              {selectedVariantId === v.variant_id && (
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-pixs-mint shadow-2xl shadow-pixs-mint" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VariantSelector;
