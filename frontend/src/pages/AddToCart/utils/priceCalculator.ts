import type { CartItem, CartItemTotals } from '../../../types/cart';

export interface CartTotalsResult {
  perItem: CartItemTotals[];
  grandTotal: number;
}

export const calculateItemTotal = (item: CartItem, setupFeeApplied: number): CartItemTotals => {
  const variantCost = item.variant.unitPrice * item.quantity;
  const printCost = (item.plate?.printPricePerUnit ?? 0) * item.quantity;
  const total = variantCost + printCost + setupFeeApplied;

  return {
    itemId: item.id,
    variantCost,
    printCost,
    setupFeeApplied,
    total,
  };
};

export const calculateCartTotals = (items: CartItem[]): CartTotalsResult => {
  const alreadyChargedPlateIds = new Set<string>();
  const perItem = items.map((item) => {
    const shouldChargeSetupFee =
      !!item.plate && !item.plate.isOwned && !alreadyChargedPlateIds.has(item.plate.id);
    const setupFeeApplied = shouldChargeSetupFee ? item.plate?.setupFee ?? 0 : 0;

    if (shouldChargeSetupFee && item.plate) {
      alreadyChargedPlateIds.add(item.plate.id);
    }

    return calculateItemTotal(item, setupFeeApplied);
  });

  const grandTotal = perItem.reduce((sum, item) => sum + item.total, 0);
  return { perItem, grandTotal };
};
