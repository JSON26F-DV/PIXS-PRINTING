import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['cart-items'],
    queryFn: cartService.getCartItems,
  })
  const [localItems, setLocalItems] = useState<CartItem[] | null>(null)

  const resolvedItems = localItems ?? items

  const totals = useMemo(() => calculateCartTotals(resolvedItems), [resolvedItems])

  const updateQuantity = (item: CartItem, nextQty: number) => {
    if (nextQty < 1) {
      toast.error('Quantity must be at least 1.')
      return false
    }

    if (nextQty > item.currentStock) {
      toast.error(`Only ${item.currentStock} stocks available.`)
      return false
    }

    setLocalItems((prev) =>
      (prev || resolvedItems).map((i) => {
        if (i.id === item.id) {
          const nextTotal = i.variant.unitPrice * nextQty;
          return { ...i, quantity: nextQty, totalCartPrice: nextTotal };
        }
        return i;
      }),
    )
    return true
  }

  const updateColors = (itemId: string, colors: CartItem['colors']) => {
    setLocalItems((prev) =>
      (prev || resolvedItems).map((i) => (i.id === itemId ? { ...i, colors } : i)),
    )
  }



  
  const updateSelected = (itemId: string, selected: boolean) => {
    setLocalItems((prev) =>
      (prev || resolvedItems).map((i) => (i.id === itemId ? { ...i, selected } : i)),
    )
  }

  const removeItem = async (itemId: string) => {
    try {
      const updated = await cartService.removeCartItem(itemId)
      setLocalItems(updated)
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
      quantity: number;
      selected: boolean;
      variant: CartItem['variant'];
    }>
  ) => {
    setLocalItems((prev) =>
      (prev || resolvedItems).map((i) => {
        if (i.id === itemId) {
          const nextQty = updates.quantity ?? i.quantity;
          const nextColors = updates.colors ?? i.colors;
          const nextSelected = updates.selected ?? i.selected;
          const nextVariant = updates.variant ?? i.variant;

          const nextTotal = nextVariant.unitPrice * nextQty;
          
          return { 
            ...i, 
            quantity: nextQty, 
            colors: nextColors, 
            selected: nextSelected,
            variant: nextVariant,
            totalCartPrice: nextTotal,
          };
        }
        return i;
      }),
    )
  }

  const syncCart = async (targetItems?: CartItem[]) => {
    try {
      const itemsToSync = targetItems || resolvedItems
      const promises = itemsToSync.map((item) =>
        cartService.updateCartItem(item.id, {
          quantity: item.quantity,
          total_cart_price: item.totalCartPrice,
          selected: item.selected ? 1 : 0,
          variant_id: item.variant.id,
          unit_price: item.variant.unitPrice,
          colors: item.colors.map((c, index) => ({
            id: c.id,
            channel_label: index === 0 ? 'Primary' : index === 1 ? 'Secondary' : 'Accent',
            channel_order: index,
          })),
        }),
      )
      await Promise.all(promises)
      if (targetItems) {
        setLocalItems(targetItems)
      }
      return true
    } catch (e) {
      console.error('Failed to sync cart:', e)
      toast.error('Failed to save cart changes.')
      return false
    }
  }

  return {
    items: resolvedItems,
    totals,
    isLoading,
    updateQuantity,
    removeItem,
    updateColors,
    getItemTotal,
    getStockStatusLabel,
    updateSelected,
    updateItemConfig,
    syncCart,
  }
}
