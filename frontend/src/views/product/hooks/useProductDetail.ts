import { useState, useMemo, useEffect } from 'react';
import type { IProduct, IScreenPlate, IPriceBreakdown, IColor } from '../../../types/product.types';
import { calculatePrice, calculatePriceWithPlate } from '../utils/priceCalculator';
import { checkOwnedPlates, fetchColors } from '../services/mockDataService';

interface UseProductDetailProps {
  product: IProduct;
  compatiblePlates: IScreenPlate[];
}

/**
 * Enterprise Product Logic Controller.
 * Business Rule: Enforces mandatory selection of Color and Screenplate ONLY if required by the product metadata.
 * Protocol: Bypasses selections for standalone hardware (is_need_color: false, etc).
 */
export const useProductDetail = ({ product, compatiblePlates }: UseProductDetailProps) => {
  const defaultVariant = product.variants[0] ?? null;

  const [selectedVariantId, setSelectedVariantId] = useState<string>(defaultVariant?.variant_id ?? '');
  const [quantity, setQuantity] = useState<number>(product.min_order);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedPlateId, setSelectedPlateId] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  
  const [colors, setColors] = useState<IColor[]>([]);
  const [ownedPlateIds, setOwnedPlateIds] = useState<string[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchColors(),
      checkOwnedPlates()
    ]).then(([clr, owned]) => {
      setColors(clr);
      setOwnedPlateIds(owned);
      setIsLoadingMetadata(false);
    });
  }, []);

  const selectablePlates = useMemo(
    () => compatiblePlates.filter(plate => ownedPlateIds.includes(plate.plate_id)),
    [compatiblePlates, ownedPlateIds]
  );

  const selectedVariant = useMemo(
    () => product.variants.find(v => v.variant_id === selectedVariantId) ?? null,
    [product.variants, selectedVariantId]
  );
  
  const selectedPlate = useMemo(
    () => selectablePlates.find(p => p.plate_id === selectedPlateId) ?? null,
    [selectablePlates, selectedPlateId]
  );
  
  const selectedColor = useMemo(
    () => colors.find(c => c.id === selectedColorId) ?? null,
    [colors, selectedColorId]
  );

  const priceBreakdown = useMemo<IPriceBreakdown>(() => {
    const base = calculatePrice({ product, variantId: selectedVariantId, plateId: selectedPlateId, quantity });
    if (selectedPlate && selectedVariant) {
      return calculatePriceWithPlate(base, selectedPlate, product.id, quantity, selectedVariant.size);
    }
    return base;
  }, [product, selectedVariantId, selectedVariant, quantity, selectedPlateId, selectedPlate]);

  const stockForVariant = selectedVariant?.stock ?? product.current_stock;
  const isQuantityTooLow = quantity < product.min_order;
  const isQuantityTooHigh = quantity > stockForVariant;
  const isOutOfStock = stockForVariant === 0;

  // Enforced Protocols: Check if required metadata selections are satisfied
  const hasRequiredPlate = !product.is_need_screenplate || (product.is_need_screenplate && !!selectedPlateId);
  const hasRequiredColor = !product.is_need_color || (product.is_need_color && !!selectedColorId);
  
  const canAddToCart = 
    !isQuantityTooLow && 
    !isQuantityTooHigh && 
    !isOutOfStock && 
    selectedVariantId !== '' && 
    hasRequiredColor &&
    hasRequiredPlate;

  const handlePlateChange = (plateId: string | null) => {
    setSelectedPlateId(plateId);
    setSelectedPosition(null);
  };

  const handleColorChange = (colorId: string) => {
    setSelectedColorId(colorId);
    // Protocol: Notification toast removed as per updated UX specifications.
  };

  return {
    state: { selectedVariantId, quantity, selectedColorId, selectedPlateId, selectedPosition, colors, ownedPlateIds, selectablePlates, isLoadingMetadata },
    actions: { setSelectedVariantId, setQuantity, handleColorChange, handlePlateChange, setSelectedPosition },
    computed: { selectedVariant, selectedPlate, selectedColor, priceBreakdown, stockForVariant, isQuantityTooLow, isQuantityTooHigh, isOutOfStock, canAddToCart, hasRequiredPlate, hasRequiredColor }
  };
};
