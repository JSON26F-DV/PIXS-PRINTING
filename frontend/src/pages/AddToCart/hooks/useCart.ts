import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { CartItem } from '../../../types/cart';
import { mockCartService } from '../services/mockCartService';
import { calculateCartTotals } from '../utils/priceCalculator';

const getStockStatusLabel = (qty: number, stock: number) => {
  if (stock <= 0) return 'Out of stock';
  if (qty > stock) return 'Over stock';
  if (stock <= 20) return 'Low stock';
  return 'In stock';
};

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>(() => mockCartService.getCartItems());

  const totals = useMemo(() => calculateCartTotals(items), [items]);

  const updateQuantity = (item: CartItem, nextQty: number) => {
    if (nextQty < 1) {
      toast.error('Quantity must be at least 1.');
      return false;
    }

    if (nextQty > item.currentStock) {
      toast.error(`Only ${item.currentStock} stocks available.`);
      return false;
    }

    const updated = mockCartService.updateQuantity(item.id, nextQty);
    setItems(updated);
    return true;
  };

  const updateColors = (itemId: string, colors: CartItem['colors']) => {
    const updated = mockCartService.updateColors(itemId, colors);
    setItems(updated);
  };

  const updateVariant = (itemId: string, variant: CartItem['variant']) => {
    const updated = mockCartService.updateVariant(itemId, variant);
    setItems(updated);
  };

  const updatePlatePrice = (itemId: string, printPricePerUnit: number) => {
    const updated = mockCartService.updatePlatePrice(itemId, printPricePerUnit);
    setItems(updated);
  };

  const removeItem = (itemId: string) => {
    const updated = mockCartService.removeCartItem(itemId);
    setItems(updated);
    toast.success('Item removed from cart.');
  };

  const getItemTotal = (itemId: string) => totals.perItem.find((item) => item.itemId === itemId) ?? null;

  return {
    items,
    totals,
    updateQuantity,
    removeItem,
    updateColors,
    updateVariant,
    updatePlatePrice,
    getItemTotal,
    getStockStatusLabel,
  };
};
