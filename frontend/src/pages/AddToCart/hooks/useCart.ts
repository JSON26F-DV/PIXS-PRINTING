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

  const updateQuantity = async (item: CartItem, nextQty: number) => {
    if (nextQty < 1) {
      toast.error('Quantity must be at least 1.')
      return false
    }

    if (nextQty > item.currentStock) {
      toast.error(`Only ${item.currentStock} stocks available.`)
      return false
    }

    try {
      const updated = await cartService.updateQuantity(item.id, nextQty)
      setItems(updated)
      return true
    } catch (error) {
      toast.error('Failed to update quantity.')
      return false
    }
  }

  const updateColors = async (itemId: string, colors: CartItem['colors']) => {
    try {
      const updated = await cartService.updateColors(itemId, colors)
      setItems(updated)
      toast.success('Configuration updated.')
    } catch (error) {
      toast.error('Failed to update colors.')
    }
  }

  const updateVariant = async (
    itemId: string,
    variant: CartItem['variant'],
  ) => {
    try {
      const updated = await cartService.updateVariant(itemId, variant)
      setItems(updated)
      toast.success('Product variant updated.')
    } catch (error) {
      toast.error('Failed to update variant.')
    }
  }

  const updatePlatePrice = async (
    itemId: string,
    printPricePerUnit: number,
  ) => {
    try {
      const updated = await cartService.updatePlatePrice(
        itemId,
        printPricePerUnit,
      )
      setItems(updated)
    } catch (error) {
      console.error('Failed to update plate price:', error)
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      const updated = await cartService.removeCartItem(itemId)
      setItems(updated)
      toast.success('Item removed from cart.')
    } catch (error) {
      toast.error('Failed to remove item.')
    }
  }

  const getItemTotal = (itemId: string) =>
    totals.perItem.find((item) => item.itemId === itemId) ?? null

  return {
    items,
    totals,
    isLoading,
    updateQuantity,
    removeItem,
    updateColors,
    updateVariant,
    updatePlatePrice,
    getItemTotal,
    getStockStatusLabel,
  }
}
