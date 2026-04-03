import { useState, useMemo } from 'react';
import type { IProduct, IScreenPlate, IPriceBreakdown } from '../../../types/product.types';
import { calculatePrice, calculatePriceWithPlate } from '../utils/priceCalculator';

interface UseOrderConfigProps {
  product: IProduct;
  compatiblePlates: IScreenPlate[];
}

/**
 * Encapsulates all order configuration state and derived values.
 * Zero logic in the page JSX — everything is controlled here.
 */
export const useOrderConfig = ({ product, compatiblePlates }: UseOrderConfigProps) => {
  const defaultVariant = product.variants[0] ?? null;

  const [selectedVariantId, setSelectedVariantId] = useState<string>(defaultVariant?.variant_id ?? '');
  const [quantity, setQuantity] = useState<number>(product.min_order);
  const [selectedPlateId, setSelectedPlateId] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  const selectedVariant = useMemo(
    () => product.variants.find(v => v.variant_id === selectedVariantId) ?? null,
    [product.variants, selectedVariantId]
  );

  const selectedPlate = useMemo(
    () => compatiblePlates.find(p => p.id === selectedPlateId) ?? null,
    [compatiblePlates, selectedPlateId]
  );

  const availablePositions = useMemo(() => {
    if (!selectedPlate) return [];
    // Since allowed_alignments is removed from compatibility, we'll use the plate's supported_alignments
    return selectedPlate.supported_alignments ?? [];
  }, [selectedPlate]);

  const priceBreakdown = useMemo<IPriceBreakdown>(() => {
    const base = calculatePrice({
      product,
      variantId: selectedVariantId,
      plateId: selectedPlateId,
      quantity,
    });
    if (selectedPlate && selectedVariant) {
      return calculatePriceWithPlate(base, selectedPlate, product.id, quantity, selectedVariant.size);
    }
    return base;
  }, [product, selectedVariantId, selectedVariant, quantity, selectedPlateId, selectedPlate]);

  // ─── Validation helpers ───────────────────────────────────────────────────
  const stockForVariant = selectedVariant?.stock ?? product.current_stock;
  const isQuantityTooLow = quantity < product.min_order;
  const isQuantityTooHigh = quantity > stockForVariant;
  const isOutOfStock = stockForVariant === 0;
  const canAddToCart = !isQuantityTooLow && !isQuantityTooHigh && !isOutOfStock;

  const handlePlateChange = (plateId: string | null) => {
    setSelectedPlateId(plateId);
    setSelectedPosition(null); // Reset position when plate changes
  };

  return {
    selectedVariantId, setSelectedVariantId,
    quantity, setQuantity,
    selectedPlateId, handlePlateChange,
    selectedPosition, setSelectedPosition,
    selectedVariant,
    selectedPlate,
    availablePositions,
    priceBreakdown,
    stockForVariant,
    isQuantityTooLow,
    isQuantityTooHigh,
    isOutOfStock,
    canAddToCart,
  };
};
