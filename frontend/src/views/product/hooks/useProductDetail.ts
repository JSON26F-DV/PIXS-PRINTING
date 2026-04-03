import { useState, useMemo, useEffect } from 'react';
import type { IProduct, IScreenPlate, IPriceBreakdown, IColor } from '../../../types/product.types';
import { calculatePrice, calculatePriceWithPlate } from '../utils/priceCalculator';
import { checkOwnedPlates, fetchColors } from '../services/mockDataService';

interface UseProductDetailProps {
  product: IProduct;
  compatiblePlates: IScreenPlate[];
  preselectedPlateName?: string | null;
}

/**
 * Enterprise Product Logic Controller.
 * Business Rule: Enforces mandatory selection of Color and Screenplate ONLY if required by the product metadata.
 * Protocol: Bypasses selections for standalone hardware (is_need_color: false, etc).
 */
export const useProductDetail = ({ product, compatiblePlates, preselectedPlateName }: UseProductDetailProps) => {
  const defaultVariant = product.variants[0] ?? null;

  const STORAGE_KEY = useMemo(() => `pixs_draft_${product.id}`, [product.id]);

  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.selectedVariantId ?? (defaultVariant?.variant_id ?? '');
      } catch { return defaultVariant?.variant_id ?? ''; }
    }
    return defaultVariant?.variant_id ?? '';
  });

  const [quantity, setQuantity] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.quantity ?? product.min_order;
      } catch { return product.min_order; }
    }
    return product.min_order;
  });

  const [selectedColorIds, setSelectedColorIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.selectedColorIds ?? [];
      } catch { return []; }
    }
    return [];
  });

  const [selectedPlateId, setSelectedPlateId] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.selectedPlateId ?? null;
      } catch { return null; }
    }
    
    // Protocol: If a plate is pre-selected via navigation, prioritize its node ID
    if (preselectedPlateName) {
      const plate = compatiblePlates.find(p => p.plate_name === preselectedPlateName);
      if (plate) return plate.id;
    }

    return null;
  });

  const [selectedPosition, setSelectedPosition] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.selectedPosition ?? null;
      } catch { return null; }
    }
    return null;
  });
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
      
      // Verification Protocol: Ensure selected metadata nodes still exist in current fetch
      setSelectedColorIds(prev => prev.filter(id => clr.some(c => c.id === id)));

      // Protocol: Auto-select initial color node if requirement identified and NO saved draft exists
      const saved = localStorage.getItem(STORAGE_KEY);
      if (product.is_need_color && clr.length > 0 && selectedColorIds.length === 0 && !saved) {
        setSelectedColorIds([clr[0].id]);
      }
      
      setIsLoadingMetadata(false);
    });
  }, [product.is_need_color, product.id, STORAGE_KEY, selectedColorIds.length]);

  // Sync Node: Persist local configuration state to unified terminal storage
  useEffect(() => {
    const config = {
      selectedVariantId,
      quantity,
      selectedColorIds,
      selectedPlateId,
      selectedPosition
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [selectedVariantId, quantity, selectedColorIds, selectedPlateId, selectedPosition, STORAGE_KEY]);

  const selectablePlates = useMemo(
    () => compatiblePlates.filter(plate => ownedPlateIds.includes(plate.id)),
    [compatiblePlates, ownedPlateIds]
  );

  const selectedVariant = useMemo(() => {
    if (product.variants.length === 0) {
      return {
        variant_id: 'BASE',
        size: 'Standard',
        width: 'N/A',
        height: 'N/A',
        price: product.base_price,
        stock: product.current_stock
      };
    }
    return product.variants.find(v => v.variant_id === selectedVariantId) ?? null;
  }, [product, selectedVariantId]);
  
  const selectedPlate = useMemo(
    () => selectablePlates.find(p => p.id === selectedPlateId) ?? null,
    [selectablePlates, selectedPlateId]
  );
  
  const selectedColors = useMemo(
    () => colors.filter(c => selectedColorIds.includes(c.id)),
    [colors, selectedColorIds]
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
  const hasRequiredColor = !product.is_need_color || (product.is_need_color && selectedColorIds.length > 0);
  
  const canAddToCart = 
    !isQuantityTooLow && 
    !isQuantityTooHigh && 
    !isOutOfStock && 
    (product.variants.length === 0 || selectedVariantId !== '') && 
    hasRequiredColor &&
    hasRequiredPlate;

  const handlePlateChange = (plateId: string | null) => {
    setSelectedPlateId(plateId);
    setSelectedPosition(null);
    
    // Protocol: Ensure color selection respects the new plate's channel count
    const newPlate = selectablePlates.find(p => p.id === plateId);
    if (newPlate && selectedColorIds.length > newPlate.channels) {
      setSelectedColorIds(prev => prev.slice(0, newPlate.channels));
    }
  };

  const handleColorChange = (colorId: string) => {
    const maxChannels = selectedPlate?.channels || 1;
    setSelectedColorIds(prev => {
      if (prev.includes(colorId)) {
        return prev.filter(id => id !== colorId);
      }
      if (prev.length < maxChannels) {
        return [...prev, colorId];
      }
      // If at max, we could replace the last one or do nothing.
      // Typically, for better UX, we replace the last selection if single channel, or just block if multi.
      if (maxChannels === 1) return [colorId];
      return prev;
    });
  };

  return {
    state: { selectedVariantId, quantity, selectedColorIds, selectedPlateId, selectedPosition, colors, ownedPlateIds, selectablePlates, isLoadingMetadata },
    actions: { setSelectedVariantId, setQuantity, handleColorChange, handlePlateChange, setSelectedPosition },
    computed: { selectedVariant, selectedPlate, selectedColors, priceBreakdown, stockForVariant, isQuantityTooLow, isQuantityTooHigh, isOutOfStock, canAddToCart, hasRequiredPlate, hasRequiredColor }
  };
};
