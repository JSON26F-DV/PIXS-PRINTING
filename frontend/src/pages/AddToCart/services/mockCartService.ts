import type { CartColorInfo, CartItem, CartPlateInfo, CartVariantInfo } from '../../../types/cart';

const CART_STORAGE_KEY = 'pixs_cart_v1';

export interface AddCartItemInput {
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  minOrder: number;
  currentStock: number;
  quantity: number;
  variant: CartVariantInfo;
  colors: CartColorInfo[];
  plate: CartPlateInfo | null;
}

const makeCartItemId = (input: AddCartItemInput): string => {
  return [
    input.productId,
    input.variant.id,
    input.colors.map(c => c.id).sort().join('-') || 'no-color',
    input.plate?.id ?? 'no-plate',
  ].join('__');
};

const readStorage = (): CartItem[] => {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStorage = (items: CartItem[]) => {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
};

export const mockCartService = {
  getCartItems(): CartItem[] {
    return readStorage();
  },

  addCartItem(input: AddCartItemInput): CartItem[] {
    const itemId = makeCartItemId(input);
    const current = readStorage();
    const existing = current.find((item) => item.id === itemId);

    if (existing) {
      const updated = current.map((item) =>
        item.id === itemId ? { ...item, quantity: item.quantity + input.quantity } : item,
      );
      writeStorage(updated);
      return updated;
    }

    const nextItem: CartItem = {
      id: itemId,
      ...input,
      createdAt: new Date().toISOString(),
    };

    const updated = [nextItem, ...current];
    writeStorage(updated);
    return updated;
  },

  updateQuantity(itemId: string, quantity: number): CartItem[] {
    const updated = readStorage().map((item) => (item.id === itemId ? { ...item, quantity } : item));
    writeStorage(updated);
    return updated;
  },

  updateColors(itemId: string, colors: CartColorInfo[]): CartItem[] {
    const current = readStorage();
    const updated = current.map((item) => (item.id === itemId ? { ...item, colors } : item));
    writeStorage(updated);
    return updated;
  },

  updateVariant(itemId: string, variant: CartVariantInfo): CartItem[] {
    const current = readStorage();
    const updated = current.map((item) => (item.id === itemId ? { ...item, variant } : item));
    writeStorage(updated);
    return updated;
  },

  updatePlatePrice(itemId: string, printPricePerUnit: number): CartItem[] {
    const current = readStorage();
    const updated = current.map((item) => {
      if (item.id === itemId && item.plate) {
        return {
          ...item,
          plate: { ...item.plate, printPricePerUnit }
        };
      }
      return item;
    });
    writeStorage(updated);
    return updated;
  },

  removeCartItem(itemId: string): CartItem[] {
    const updated = readStorage().filter((item) => item.id !== itemId);
    writeStorage(updated);
    return updated;
  },
};
