import React from 'react';
import type { IPriceBreakdown } from '../../../types/product.types';

interface PriceSummaryProps {
  breakdown: IPriceBreakdown;
  quantity: number;
  canAddToCart: boolean;
  isOutOfStock: boolean;
  minOrder: number;
  quantity_too_low: boolean;
}

const PriceSummary: React.FC<PriceSummaryProps> = ({
  breakdown, quantity, canAddToCart, isOutOfStock, minOrder, quantity_too_low
}) => {
  const rows = [
    { label: 'Unit Price', value: `₱${breakdown.variantUnitPrice.toFixed(2)}` },
    ...(breakdown.printPricePerUnit > 0 ? [
      { label: 'Print / Unit', value: `₱${breakdown.printPricePerUnit.toFixed(2)}` },
      { label: `Setup Fee (×1)`, value: `₱${breakdown.setupFee.toLocaleString()}` },
    ] : []),
    { label: `Qty ×${quantity.toLocaleString()}`, value: `₱${breakdown.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
  ];

  return (
    <div className="rounded-3xl bg-slate-900 p-6 space-y-5">
      {/* Breakdown */}
      <div className="space-y-2">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{row.label}</span>
            <span className="text-[10px] text-slate-300 font-black font-mono">{row.value}</span>
          </div>
        ))}
        <div className="h-px bg-slate-700 my-2" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Est. Total</span>
          <span className="text-2xl text-white font-black font-mono italic tracking-tighter">
            ₱{breakdown.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* CTA */}
      <button
        disabled={!canAddToCart}
        className="w-full py-5 rounded-2xl font-black uppercase tracking-[4px] text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-pixs-mint text-slate-900 hover:scale-[1.02] active:scale-95 shadow-xl shadow-pixs-mint/20"
      >
        {isOutOfStock ? 'Out of Stock' : quantity_too_low ? `Min. ${minOrder.toLocaleString()} pcs required` : 'Add to Cart'}
      </button>

      <button
        disabled={!canAddToCart}
        className="w-full py-4 rounded-2xl font-black uppercase tracking-[4px] text-xs border-2 border-slate-700 text-slate-300 hover:border-slate-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Request Quotation
      </button>
    </div>
  );
};

export default PriceSummary;
