export interface CartColorInfo {
  id: string
  name: string
  hex: string
  type: 'Standard' | 'Premium'
}

export interface CartVariantInfo {
  id: string
  size: string
  width: string
  height: string
  unitPrice: number
  stock: number
}

import type { IProduct } from './product.types'

export interface CartItem {
  id: string
  productId: string
  productName: string
  productImage: string
  category: string
  minOrder: number
  currentStock: number
  quantity: number
  variant: CartVariantInfo
  colors: CartColorInfo[]
  customRequirements?: string
  createdAt: string
  selected: boolean
  temp?: boolean
  totalCartPrice: number
  fullProduct?: IProduct
}

export interface CartItemTotals {
  itemId: string
  variantCost: number
  total: number
}

export interface AddToCartData {
  id: string
  product_id: string
  variant_id: string
  quantity: number
  unit_price: number
  total_cart_price: number
  temp?: boolean
  selected?: boolean
  colors: {
    color_id: string
    id: string
    channel_label: string
    channel_order: number
  }[]
}

export interface UpdateCartItemData {
  quantity?: number
  selected?: boolean | number
  variant_id?: string
  unit_price?: number
  total_cart_price?: number
  colors?: {
    id: string
    channel_label: string
    channel_order: number
  }[]
}
