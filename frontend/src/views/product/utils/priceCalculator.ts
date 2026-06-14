import type {
  IPriceBreakdown,
  IProduct,
  IScreenPlate,
} from '../../../types/product.types'

interface CalcParams {
  product: IProduct
  variantId: string
  plateId: string | null
  quantity: number
}

/**
 * Enterprise Price Logic Engine (PD Module).
 * Formula: total_price = variant_price × quantity (print cost included in unit price)
 * Rule: Setup fees are handled globally in the plate management module, not added per detail configurator.
 */
export const calculatePrice = ({
  product,
  variantId,
  plateId,
  quantity,
}: CalcParams): IPriceBreakdown => {
  const variant = product.variants.find((v) => v.variant_id === variantId)
  const variantUnitPrice = variant?.price ?? product.base_price

  if (!plateId) {
    const subtotal = variantUnitPrice * quantity
    return {
      variantUnitPrice,
      printPricePerUnit: 0,
      setupFee: 0,
      subtotal,
      total: subtotal,
    }
  }

  const subtotal = variantUnitPrice * quantity
  return {
    variantUnitPrice,
    printPricePerUnit: 0,
    setupFee: 0,
    subtotal,
    total: subtotal,
  }
}

/**
 * Finalizes the price breakdown based on active screen plate selection.
 * Setup fee is strictly 0 in this context as per requested protocol.
 */
export const calculatePriceWithPlate = (
  breakdown: IPriceBreakdown,
  plate: IScreenPlate,
  productId: string,
  quantity: number,
  variantId: string,
): IPriceBreakdown => {
  // Print cost is now included in cup unit price - no separate print fee
  const printPricePerUnit = 0
  
  const subtotal = breakdown.variantUnitPrice * quantity
  const total = subtotal  // No additional print cost

  return { ...breakdown, printPricePerUnit, setupFee: 0, subtotal, total }
}

export const getStockStatus = (stock: number, threshold: number) => {
  if (stock === 0)
    return {
      label: 'Out of Stock',
      color: 'text-rose-500',
      dot: 'bg-rose-500',
    } as const
  if (stock <= threshold)
    return {
      label: 'Low Stock',
      color: 'text-amber-500',
      dot: 'bg-amber-500',
    } as const
  return {
    label: 'In Stock',
    color: 'text-emerald-500',
    dot: 'bg-emerald-500',
  } as const
}
