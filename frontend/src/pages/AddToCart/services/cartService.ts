import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
} from '../../../api/cart.api'
import type {
  CartItem,
  CartColorInfo,
  CartPlateInfo,
  CartVariantInfo,
} from '../../../types/cart'

const mapBackendToFrontend = (item: any): CartItem => {
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
    colors: (item.colors || []).map((c: any) => ({
      id: c.color_id,
      name: c.color?.name || '',
      hex: c.color?.hex || '',
      type: c.color?.type || 'Standard',
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
        }
      : null,
    customRequirements: '',
    createdAt: item.created_at,
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

  async updateVariant(
    itemId: string,
    variant: CartVariantInfo,
  ): Promise<CartItem[]> {
    await updateCartItem(itemId, {
      variant_id: variant.id,
      unit_price: variant.unitPrice,
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
}
