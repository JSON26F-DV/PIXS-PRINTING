import type { CartItem, CartItemTotals } from '../../../types/cart'

export interface CartTotalsResult {
  perItem: CartItemTotals[]
  grandTotal: number
}

export const calculateItemTotal = (
  item: CartItem,
  setupFeeApplied: number,
): CartItemTotals => {
  const variantCost = item.variant.unitPrice * item.quantity
  const printCost = (item.plate?.printPricePerUnit ?? 0) * item.quantity
  const total = variantCost + printCost + setupFeeApplied

  return {
    itemId: item.id,
    variantCost,
    printCost,
    setupFeeApplied,
    total,
  }
}

export const calculateCartTotals = (items: CartItem[]): CartTotalsResult => {
  const perItem = items.map((item) => {
    // Setup fees are removed globally.
    const setupFeeApplied = 0
    return calculateItemTotal(item, setupFeeApplied)
  })

  const grandTotal = perItem.reduce((sum, item) => sum + item.total, 0)
  return { perItem, grandTotal }
}
