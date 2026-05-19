import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
} from '../../../api/cart.api'
import type {
  CartItem,
  CartColorInfo,
  AddToCartData,
} from '../../../types/cart'
import type { IProduct, IScreenPlateCompatibility, IScreenPlateIncompatibility } from '../../../types/product.types'

const mapBackendToFrontend = (item: {
  id: string
  product_id: string
  product?: {
    name: string
    main_image: string
    category_label: string
    min_order: number
    current_stock: number
  }
  quantity: number
  variant_id: string
  unit_price: string
  variant?: {
    size?: string
    label?: string
    width?: string
    height?: string
    stock?: number
  }
  colors?: Array<{
    color_id: string
    color?: {
      name: string
      hex: string
      type?: string
    }
  }>
  screenplate?: {
    plate_name: string
    is_flatscreen: boolean
    channels: number
    base_setup_fee: string
    technical_info?: string
    compatibility?: IScreenPlateCompatibility[]
    incompatibility?: IScreenPlateIncompatibility[]
  }
  screenplate_id: string
  plate_price: string
  total_cart_price?: string | number
  selected?: boolean | number
  created_at: string
}): CartItem => {
  return {
    id: item.id,
    productId: item.product_id,
    productName: item.product?.name || '',
    productImage: item.product?.main_image || '',
    category: item.product?.category_label || '',
    minOrder: item.product?.min_order || 1,
    currentStock: item.product?.current_stock || 0,
    quantity: item.quantity,
    variant: {
      id: item.variant_id,
      size: item.variant?.size || item.variant?.label || '',
      width: item.variant?.width || '',
      height: item.variant?.height || '',
      unitPrice: parseFloat(item.unit_price),
      stock: item.variant?.stock || 0,
    },
    colors: (item.colors || []).map((c) => ({
      id: c.color_id,
      name: c.color?.name || '',
      hex: c.color?.hex || '',
      type: (c.color?.type as 'Standard' | 'Premium') || 'Standard',
    })),
    plate: item.screenplate
      ? {
          id: item.screenplate_id,
          name: item.screenplate.plate_name,
          type: item.screenplate.is_flatscreen ? 'Flatscreen' : 'Rotary',
          printPricePerUnit: parseFloat(item.plate_price),
          setupFee: parseFloat(item.screenplate.base_setup_fee),
          channels: item.screenplate.channels,
          printingInfo: item.screenplate.technical_info || '',
          isOwned: true,
          compatibility: item.screenplate.compatibility,
          incompatibility: item.screenplate.incompatibility,
        }
      : null,
    customRequirements: '',
    createdAt: item.created_at,
    selected: Boolean(item.selected),
    totalCartPrice: typeof item.total_cart_price === 'string' 
      ? parseFloat(item.total_cart_price) 
      : (item.total_cart_price || 0),
    fullProduct: item.product as unknown as IProduct,
  }
}

export const cartService = {
  async getCartItems(): Promise<CartItem[]> {
    const res = await getCart()
    return (res.data || []).map(mapBackendToFrontend)
  },

  async updateQuantity(itemId: string, quantity: number): Promise<CartItem[]> {
    await updateCartItem(itemId, { quantity })
    return this.getCartItems()
  },

  async updateColors(
    itemId: string,
    colors: CartColorInfo[],
  ): Promise<CartItem[]> {
    await updateCartItem(itemId, {
      colors: colors.map((c, index) => ({
        id: c.id,
        channel_label:
          index === 0 ? 'Primary' : index === 1 ? 'Secondary' : 'Accent',
        channel_order: index,
      })),
    })
    return this.getCartItems()
  },


  async updatePlatePrice(
    itemId: string,
    platePrice: number,
  ): Promise<CartItem[]> {
    await updateCartItem(itemId, { plate_price: platePrice })
    return this.getCartItems()
  },

  async removeCartItem(itemId: string): Promise<CartItem[]> {
    await removeFromCart(itemId)
    return this.getCartItems()
  },

  async updateCartItem(
    itemId: string,
    data: Record<string, unknown>,
  ): Promise<CartItem[]> {
    await updateCartItem(itemId, data)
    return this.getCartItems()
  },

  async addToCart(data: AddToCartData): Promise<CartItem[]> {
    await addToCart(data)
    return this.getCartItems()
  },
}
