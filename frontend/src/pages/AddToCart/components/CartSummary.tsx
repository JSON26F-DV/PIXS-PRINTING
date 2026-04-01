import React from 'react';

interface CartSummaryProps {
  totalItems: number;
  grandTotal: number;
}

const CartSummary: React.FC<CartSummaryProps> = ({ totalItems, grandTotal }) => {
  return (
    <aside className="CartTotalSection sticky top-28 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between text-slate-600">
          <span>Items</span>
          <span>{totalItems}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
          <span>Grand Total</span>
          <span>PHP {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
      <button
        disabled={totalItems === 0}
        className="mt-4 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Proceed to Checkout
      </button>
    </aside>
  );
};

export default CartSummary;
