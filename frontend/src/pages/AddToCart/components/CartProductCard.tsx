import React from 'react';
import type { CartItem, CartItemTotals } from '../../../types/cart';
import QuantityPicker from './QuantityPicker';
import ColorInfo from './ColorInfo';
import PlateInfo from './PlateInfo';

interface CartProductCardProps {
  item: CartItem;
  totals: CartItemTotals;
  stockStatus: string;
  onUpdateQuantity: (nextQuantity: number) => boolean;
  onRemove: () => void;
}

const CartProductCard: React.FC<CartProductCardProps> = ({ item, totals, stockStatus, onUpdateQuantity, onRemove }) => {
  return (
    <article className="CartProductCard rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <img src={item.productImage} alt={item.productName} className="CartProductImage h-24 w-24 rounded-xl object-cover" />

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="CartProductName text-base font-semibold text-slate-900">{item.productName}</h3>
              <p className="CartProductVariant text-sm text-slate-600">
                Variant: {item.variant.size} ({item.variant.width} x {item.variant.height})
              </p>
            </div>
            <button onClick={onRemove} className="RemoveButton text-sm font-medium text-rose-600 hover:text-rose-700">
              Remove
            </button>
          </div>

          <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">{stockStatus}</span>

          <ColorInfo color={item.color} />
          <PlateInfo plate={item.plate} setupFeeApplied={totals.setupFeeApplied} />

          <QuantityPicker
            quantity={item.quantity}
            minOrder={item.minOrder}
            currentStock={item.currentStock}
            onChange={onUpdateQuantity}
          />

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 md:grid-cols-4">
            <div>
              <p>Unit Price</p>
              <p className="font-semibold text-slate-900">PHP {item.variant.unitPrice.toFixed(2)}</p>
            </div>
            <div>
              <p>Print Price</p>
              <p className="font-semibold text-slate-900">PHP {(item.plate?.printPricePerUnit ?? 0).toFixed(2)}</p>
            </div>
            <div>
              <p>Setup Fee</p>
              <p className="font-semibold text-slate-900">PHP {totals.setupFeeApplied.toFixed(2)}</p>
            </div>
            <div>
              <p>Total</p>
              <p className="font-semibold text-slate-900">PHP {totals.total.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default CartProductCard;
