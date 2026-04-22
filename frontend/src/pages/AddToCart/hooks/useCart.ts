import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import type { CartItem } from '../../../types/cart'
import { cartService } from '../services/cartService'
import { calculateCartTotals } from '../utils/priceCalculator'

const getStockStatusLabel = (qty: number, stock: number) => {
  if (stock <= 0) return 'Out of stock'
  if (qty > stock) return 'Over stock'
  if (stock <= 20) return 'Low stock'
  return 'In stock'
}

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const data = await cartService.getCartItems()
        setItems(data)
      } catch (error) {
        console.error('Failed to fetch cart:', error)
        // Only toast if it's not a 401 (handled by interceptor/auth flow usually)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCart()
  }, [])

  const totals = useMemo(() => calculateCartTotals(items), [items])

  const updateQuantity = (item: CartItem, nextQty: number) => {
    if (nextQty < 1) {
      toast.error('Quantity must be at least 1.')
      return false
    }

    if (nextQty > item.currentStock) {
      toast.error(`Only ${item.currentStock} stocks available.`)
      return false
    }

    setItems((prev) =>
      prev.map((i) => {
        if (i.id === item.id) {
          const nextTotal = (i.variant.unitPrice * nextQty) + ((i.plate?.printPricePerUnit ?? 0) * nextQty);
          return { ...i, quantity: nextQty, totalCartPrice: nextTotal };
        }
        return i;
      }),
    )
    return true
  }

  const updateColors = (itemId: string, colors: CartItem['colors']) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, colors } : i)),
    )
  }


  const updatePlatePrice = (
    itemId: string,
    printPricePerUnit: number,
  ) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          const nextPlate = i.plate ? { ...i.plate, printPricePerUnit } : null;
          const nextTotal = (i.variant.unitPrice * i.quantity) + (printPricePerUnit * i.quantity);
          return { ...i, plate: nextPlate, totalCartPrice: nextTotal };
        }
        return i;
      }),
    )
  }
  
  const updateSelected = (itemId: string, selected: boolean) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, selected } : i)),
    )
  }

  const removeItem = async (itemId: string) => {
    try {
      const updated = await cartService.removeCartItem(itemId)
      setItems(updated)
      toast.success('Item removed from cart.')
    } catch {
      toast.error('Failed to remove item.')
    }
  }

  const getItemTotal = (itemId: string) =>
    totals.perItem.find((item) => item.itemId === itemId) ?? null

  const updateItemConfig = (
    itemId: string,
    updates: Partial<{
      colors: CartItem['colors'];
      platePrice: number;
      quantity: number;
      selected: boolean;
    }>
  ) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          const nextQty = updates.quantity ?? i.quantity;
          const nextColors = updates.colors ?? i.colors;
          const nextSelected = updates.selected ?? i.selected;
          const nextPrintPrice = updates.platePrice !== undefined ? updates.platePrice : (i.plate?.printPricePerUnit ?? 0);
          
          const nextTotal = (i.variant.unitPrice * nextQty) + (nextPrintPrice * nextQty);
          
          return { 
            ...i, 
            quantity: nextQty, 
            colors: nextColors, 
            selected: nextSelected,
            totalCartPrice: nextTotal,
            plate: i.plate ? { ...i.plate, printPricePerUnit: nextPrintPrice } : null
          };
        }
        return i;
      }),
    )
  }

  const syncCart = async () => {
    try {
      const promises = items.map((item) =>
        cartService.updateCartItem(item.id, {
          quantity: item.quantity,
          total_cart_price: item.totalCartPrice,
          selected: item.selected ? 1 : 0,
          colors: item.colors.map((c, index) => ({
            id: c.id,
            channel_label: index === 0 ? 'Primary' : index === 1 ? 'Secondary' : 'Accent',
            channel_order: index,
          })),
        }),
      )
      await Promise.all(promises)
      return true
    } catch (e) {
      console.error('Failed to sync cart:', e)
      toast.error('Failed to save cart changes.')
      return false
    }
  }

  return {
    items,
    totals,
    isLoading,
    updateQuantity,
    removeItem,
    updateColors,
    updatePlatePrice,
    getItemTotal,
    getStockStatusLabel,
    updateSelected,
    updateItemConfig,
    syncCart,
  }
}
