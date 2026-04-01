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

  productName: string;
  quantity: number;
  variant?: {
    unitPrice: number;
    color?: string;
    size?: string;
  };
}

export interface Order {
  order_id: string;
  user_id: string;
  products: OrderProduct[];
  shipping_address: unknown;
  payment_method: unknown;
  delivery_method: unknown;

  notes?: string;
  status: OrderStatus;
  created_at: string;
  payment_hash: string;
}

