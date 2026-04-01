export interface CartColorInfo {
  id: string;
  name: string;
  hex: string;
  type: 'Standard' | 'Premium';
}

export interface CartPlateInfo {
  id: string;
  name: string;
  type: string;
  printPricePerUnit: number;
  setupFee: number;
  printingInfo: string;
  isOwned: boolean;
}

export interface CartVariantInfo {
  id: string;
  size: string;
  width: string;
  height: string;
  unitPrice: number;
  stock: number;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  minOrder: number;
  currentStock: number;
  quantity: number;
  variant: CartVariantInfo;
  color: CartColorInfo | null;
  plate: CartPlateInfo | null;
  createdAt: string;
}

export interface CartItemTotals {
  itemId: string;
  variantCost: number;
  printCost: number;
  setupFeeApplied: number;
  total: number;
}
