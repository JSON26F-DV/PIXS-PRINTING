import { useState, useMemo, useEffect } from 'react'
import type {
  IProduct,
  IPriceBreakdown,
  IColor,
} from '../../../types/product.types'
import {
  calculatePrice,
} from '../utils/priceCalculator'
import { getColors } from '../../../api/products.api'

interface UseProductDetailProps {
  product: IProduct
}

/**
 * Enterprise Product Logic Controller.
 * Business Rule: Enforces mandatory selection of Color ONLY if required by the product metadata.
 * Protocol: Bypasses selections for standalone hardware (is_need_color: false, etc).
 */
export const useProductDetail = ({
  product,
}: UseProductDetailProps) => {
  const defaultVariant = product.variants[0] ?? null

  const STORAGE_KEY = useMemo(() => `pixs_draft_${product.id}`, [product.id])

  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.selectedVariantId ?? defaultVariant?.variant_id ?? ''
      } catch {
        return defaultVariant?.variant_id ?? ''
      }
    }
    return defaultVariant?.variant_id ?? ''
  })

  const [quantity, setQuantity] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.quantity ?? product.min_order
      } catch {
        return product.min_order
      }
    }
    return product.min_order
  })

  const [selectedColorIds, setSelectedColorIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.selectedColorIds ?? []
      } catch {
        return []
      }
    }
    return []
  })

  const [customRequirements, setCustomRequirements] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.customRequirements ?? ''
      } catch {
        return ''
      }
    }
    return ''
  })
  const [colors, setColors] = useState<IColor[]>([])
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true)

  useEffect(() => {
    getColors().then((res) => {
      const clr = res.data || []
      setColors(clr)

      // Verification Protocol: Ensure selected metadata nodes still exist in current fetch
      setSelectedColorIds((prev) =>
        prev.filter((id) => clr.some((c: IColor) => c.id === id)),
      )

      // Protocol: Auto-select initial color node if requirement identified and NO saved draft exists
      const saved = localStorage.getItem(STORAGE_KEY)
      if (
        product.is_need_color &&
        clr.length > 0 &&
        selectedColorIds.length === 0 &&
        !saved
      ) {
        setSelectedColorIds([clr[0].id])
      }

      setIsLoadingMetadata(false)
    })
  }, [product.is_need_color, product.id, STORAGE_KEY, selectedColorIds.length])

  // Sync Node: Persist local configuration state to unified terminal storage
  useEffect(() => {
    const config = {
      selectedVariantId,
      quantity,
      selectedColorIds,
      customRequirements,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [
    selectedVariantId,
    quantity,
    selectedColorIds,
    customRequirements,
    STORAGE_KEY,
  ])

  const selectedVariant = useMemo(() => {
    if (product.variants.length === 0) {
      return {
        variant_id: 'BASE',
        size: 'Standard',
        width: 'N/A',
        height: 'N/A',
        price: product.base_price,
        stock: product.is_in_stock ? 1000 : 0,
      }
    }
    return (
      product.variants.find((v) => v.variant_id === selectedVariantId) ?? null
    )
  }, [product, selectedVariantId])

  const selectedColors = useMemo(
    () => colors.filter((c) => selectedColorIds.includes(c.id)),
    [colors, selectedColorIds],
  )

  const priceBreakdown = useMemo<IPriceBreakdown>(() => {
    return calculatePrice({
      product,
      variantId: selectedVariantId,
      quantity,
    })
  }, [
    product,
    selectedVariantId,
    quantity,
  ])

  const stockForVariant = selectedVariant?.stock ?? (product.is_in_stock ? 1000 : 0)
  const isQuantityTooLow = quantity < product.min_order
  const isQuantityTooHigh = quantity > stockForVariant
  const isStockInsufficient = stockForVariant < product.min_order
  const isOutOfStock = stockForVariant === 0 || isStockInsufficient

  // Protocol: Constrain quantity against available stock when switching variants (Sizes)
  // Fix: Derive during render or use timeout to avoid cascade
  useEffect(() => {
    const t = setTimeout(() => {
      setQuantity((prev) => {
        if (stockForVariant === 0) return 0
        if (prev > stockForVariant) return stockForVariant
        if (prev < product.min_order && stockForVariant >= product.min_order) return product.min_order
        return prev
      })
    }, 0)
    return () => clearTimeout(t)
  }, [stockForVariant, product.min_order, setQuantity])

  // Enforced Protocols: Check if required metadata selections are satisfied
  const hasRequiredColor =
    !product.is_need_color ||
    (product.is_need_color && selectedColorIds.length > 0)

  const canAddToCart =
    !isQuantityTooLow &&
    !isQuantityTooHigh &&
    !isOutOfStock &&
    (product.variants.length === 0 || selectedVariantId !== '') &&
    hasRequiredColor

  const handleColorChange = (colorId: string) => {
    setSelectedColorIds((prev) => {
      if (prev.includes(colorId)) {
        return prev.filter((id) => id !== colorId)
      }
      return [colorId]
    })
  }

  return {
    state: {
      selectedVariantId,
      quantity,
      selectedColorIds,
      colors,
      isLoadingMetadata,
      customRequirements,
    },
    actions: {
      setSelectedVariantId,
      setQuantity,
      handleColorChange,
      setCustomRequirements,
    },
    computed: {
      selectedVariant,
      selectedColors,
      priceBreakdown,
      stockForVariant,
      isQuantityTooLow,
      isQuantityTooHigh,
      isOutOfStock,
      isStockInsufficient,
      canAddToCart,
      hasRequiredColor,
    },
  }
}
