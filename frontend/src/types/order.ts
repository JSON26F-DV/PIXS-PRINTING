export const ORDER_STATUS = {
  PENDING: "PENDING",
  PAYMENT_VERIFIED: "PAYMENT_VERIFIED",
  PRINTING: "PRINTING",
  READY_FOR_SHIPPING: "READY_FOR_SHIPPING",
  ON_DELIVERY: "ON_DELIVERY",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export interface OrderProduct {
  id: string; // From CartItem.id
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  quantity: number;
  variant: {
    unitPrice: number;
    size: string;
    id: string;
  };
  colors: { name: string; hex: string }[];
  plate: { name: string; setupFee: number; printPricePerUnit: number } | null;
  customRequirements?: string;
}

export interface Order {
  order_id: string; // Unified with order.json
  user_id: string;
  products: OrderProduct[]; // Unified with order.json
  total_amount: number;
  shipping_address: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phoneNumber: string;
  };
  payment_method: {
    type: string;
    provider: string;
    transactionId?: string;
  };
  delivery_method: {
    carrier: string;
    serviceLevel: string;
    estimatedDays: number;
  };
  notes?: string;
  status: OrderStatus;
  created_at: string;
  payment_hash: string;
  discount?: {
    discount_id: string | null;
    total_discount_amount: number;
  };
  feedback?: string;
  complaint?: string;
  rating?: number;
}

