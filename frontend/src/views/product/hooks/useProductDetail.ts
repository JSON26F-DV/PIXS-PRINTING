import { useState, useMemo, useEffect } from 'react'
import type {
  IProduct,
  IScreenPlate,
  IPriceBreakdown,
  IColor,
} from '../../../types/product.types'
import {
  calculatePrice,
  calculatePriceWithPlate,
} from '../utils/priceCalculator'
import { getColors } from '../../../api/products.api'

interface UseProductDetailProps {
  product: IProduct
  compatiblePlates: IScreenPlate[]
  preselectedPlateName?: string | null
}

/**
 * Enterprise Product Logic Controller.
 * Business Rule: Enforces mandatory selection of Color and Screenplate ONLY if required by the product metadata.
 * Protocol: Bypasses selections for standalone hardware (is_need_color: false, etc).
 */
export const useProductDetail = ({
  product,
  compatiblePlates,
  preselectedPlateName,
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

  const [selectedPlateId, setSelectedPlateId] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.selectedPlateId ?? null
      } catch {
        return null
      }
    }

    // Protocol: If a plate is pre-selected via navigation, prioritize its node ID
    if (preselectedPlateName) {
      const plate = compatiblePlates.find(
        (p) => p.plate_name === preselectedPlateName,
      )
      if (plate) return plate.id
    }

    return null
  })

  const [selectedPosition, setSelectedPosition] = useState<string | null>(
    () => {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return parsed.selectedPosition ?? null
        } catch {
          return null
        }
      }
      return null
    },
  )

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
      selectedPlateId,
      selectedPosition,
      customRequirements,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [
    selectedVariantId,
    quantity,
    selectedColorIds,
    selectedPlateId,
    selectedPosition,
    customRequirements,
    STORAGE_KEY,
  ])

  // Filter Protocol: Only show plates that are COMPATIBLE with this specific product
  const selectablePlates = useMemo(
    () => compatiblePlates.filter((plate) => {
      // NOTE: compatiblePlates are already owned by the customer (fetched via /api/customer/screenplates)
      return plate.compatibility.some(cp => cp.product_id === product.id)
    }),
    [compatiblePlates, product.id],
  )

  // Identify plates that are specifically INCOMPATIBLE with the selected variant
  const incompatiblePlateIds = useMemo(() => {
    if (!selectedVariantId) return []
    const variant = product.variants.find(v => v.variant_id === selectedVariantId)
    if (!variant) return []

    // Use the screenplate_incompatible logic if available or derived from compatibility missing
    return selectablePlates
      .filter(plate => {
        // If there's an explicit incompatibility list
        const incomp = plate.incompatibility?.find(i => i.product_id === product.id)
        if (incomp) {
          // If variant_ids is empty, the entire product is incompatible with this plate
          if (incomp.variant_ids.length === 0) return true
          return incomp.variant_ids.includes(variant.variant_id) || incomp.variant_ids.includes(variant.size)
        }

        // Check if THIS specific variant matches any in the compatibility allow-list
        const comp = plate.compatibility.find(c => c.product_id === product.id)
        if (!comp) return true // Should not happen due to selectablePlates filter

        // If allowed_variants is empty or contains 'ALL', it's compatible with everything
        if (!comp.allowed_variants || comp.allowed_variants.length === 0 || comp.allowed_variants.includes('ALL')) {
           return false 
        }

        // If not in the allow-list, it's incompatible
        return !comp.allowed_variants.includes(variant.variant_id) && !comp.allowed_variants.includes(variant.size)
      })
      .map(p => p.id)
  }, [selectablePlates, selectedVariantId, product.id, product.variants])

  // New: Variant-level compatibility map for the selected plate
  const variantCompatibilityMap = useMemo(() => {
    const map: Record<string, { isCompatible: boolean; reason?: string }> = {}
    
    product.variants.forEach(v => {
      // If no plate selected, all variants are compatible by default (no plate requirements yet)
      if (!selectedPlateId) {
        map[v.variant_id] = { isCompatible: true }
        return
      }

      const plate = selectablePlates.find(p => p.id === selectedPlateId)
      if (!plate) {
        map[v.variant_id] = { isCompatible: true }
        return
      }

      const comp = plate.compatibility.find(c => c.product_id === product.id)
      const incomp = plate.incompatibility?.find(i => i.product_id === product.id)

      const isAllowed = comp && (
        comp.allowed_variants.includes(v.variant_id) || 
        comp.allowed_variants.includes(v.size) || 
        comp.allowed_variants.includes('ALL')
      )

      const isDenied = incomp && (
        incomp.variant_ids.length === 0 || // Empty variant_ids means whole product is denied
        incomp.variant_ids.includes(v.variant_id) || 
        incomp.variant_ids.includes(v.size)
      )
      
      // Rule 4: INCOMPATIBLE takes priority
      if (isDenied) {
        map[v.variant_id] = { isCompatible: false, reason: 'Not Compatible' }
      } else if (isAllowed) {
        map[v.variant_id] = { isCompatible: true }
      } else {
        // Rule 2.3: Not listed in compatibility -> Not Compatible
        map[v.variant_id] = { isCompatible: false, reason: 'Not Compatible' }
      }
    })
    
    return map
  }, [product.variants, product.id, selectedPlateId, selectablePlates])

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

  const selectedPlate = useMemo(
    () => selectablePlates.find((p) => p.id === selectedPlateId) ?? null,
    [selectablePlates, selectedPlateId],
  )

  const selectedColors = useMemo(
    () => colors.filter((c) => selectedColorIds.includes(c.id)),
    [colors, selectedColorIds],
  )

  const priceBreakdown = useMemo<IPriceBreakdown>(() => {
    const base = calculatePrice({
      product,
      variantId: selectedVariantId,
      plateId: selectedPlateId,
      quantity,
    })
    if (selectedPlate && selectedVariant) {
      return calculatePriceWithPlate(
        base,
        selectedPlate,
        product.id,
        quantity,
        selectedVariant.variant_id,
      )
    }
    return base
  }, [
    product,
    selectedVariantId,
    selectedVariant,
    quantity,
    selectedPlateId,
    selectedPlate,
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
  const hasRequiredPlate =
    !product.is_need_screenplate ||
    (product.is_need_screenplate && !!selectedPlateId)
  const hasRequiredColor =
    !product.is_need_color ||
    (product.is_need_color && selectedColorIds.length > 0)

  const canAddToCart =
    !isQuantityTooLow &&
    !isQuantityTooHigh &&
    !isOutOfStock &&
    (product.variants.length === 0 || selectedVariantId !== '') &&
    hasRequiredColor &&
    hasRequiredPlate &&
    (!selectedPlateId || !incompatiblePlateIds.includes(selectedPlateId)) &&
    (!selectedVariantId || (variantCompatibilityMap[selectedVariantId]?.isCompatible !== false))

  const handlePlateChange = (plateId: string | null) => {
    setSelectedPlateId(plateId)
    setSelectedPosition(null)

    // Protocol: Ensure color selection respects the new plate's channel count
    const newPlate = selectablePlates.find((p) => p.id === plateId)
    if (newPlate && selectedColorIds.length > newPlate.channels) {
      setSelectedColorIds((prev) => prev.slice(0, newPlate.channels))
    }
  }

  const handleColorChange = (colorId: string) => {
    const maxChannels = selectedPlate?.channels || 1
    setSelectedColorIds((prev) => {
      if (prev.includes(colorId)) {
        return prev.filter((id) => id !== colorId)
      }
      if (prev.length < maxChannels) {
        return [...prev, colorId]
      }
      // If at max, we could replace the last one or do nothing.
      // Typically, for better UX, we replace the last selection if single channel, or just block if multi.
      if (maxChannels === 1) return [colorId]
      return prev
    })
  }

  return {
    state: {
      selectedVariantId,
      quantity,
      selectedColorIds,
      selectedPlateId,
      selectedPosition,
      colors,
      selectablePlates,
      incompatiblePlateIds,
      variantCompatibilityMap,
      isLoadingMetadata,
      customRequirements,
    },
    actions: {
      setSelectedVariantId,
      setQuantity,
      handleColorChange,
      handlePlateChange,
      setSelectedPosition,
      setCustomRequirements,
    },
    computed: {
      selectedVariant,
      selectedPlate,
      selectedColors,
      priceBreakdown,
      stockForVariant,
      isQuantityTooLow,
      isQuantityTooHigh,
      isOutOfStock,
      isStockInsufficient,
      canAddToCart,
      hasRequiredPlate,
      hasRequiredColor,
    },
  }
}
