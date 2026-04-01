// ─── Product Domain Types ─────────────────────────────────────────────────────

export interface IProductVariant {
  variant_id: string;
  size: string;
  width: string;
  height: string;
  price: number;
  stock: number;
}

export interface IProduct {
  id: string;
  name: string;
  category: string;
  short_description: string;
  long_description: string;
  best_for: string;
  base_price: number;
  raw_material_cost: number;
  current_stock: number;
  min_threshold: number;
  min_order: number;
  main_image: string;
  gallery: string[];
  print_method: string;
  tags: string[];
  is_need_screenplate: boolean;
  is_need_color: boolean;
  variants: IProductVariant[];
}

// ─── Color Domain Types ───────────────────────────────────────────────────────

export interface IColor {
  id: string;
  name: string;
  hex: string;
  type: 'Standard' | 'Premium';
}

// ─── Screen Plate Domain Types ───────────────────────────────────────────────

export interface IScreenPlateCompatibility {
  product_id: string;
  product_name: string;
  print_price_per_unit: number;
  max_print_area: string;
  position_allowed: string[];
}

export interface IScreenPlateCapabilities {
  print_type: string;
  max_colors: number;
  special_logic: string;
}

export interface IScreenPlate {
  plate_id: string;
  plate_name: string;
  type: string;
  setup_fee: number;
  description: string;
  logo_url: string;
  dimensions: string;
  capabilities: IScreenPlateCapabilities;
  technical_info: string;
  compatible_products: IScreenPlateCompatibility[];
  is_active: boolean;
  created_by: string;
}

// ─── Order Configuration ──────────────────────────────────────────────────────

export interface IOrderConfig {
  productId: string;
  variantId: string;
  quantity: number;
  colorId: string | null;
  plateId: string | null;
  printPosition: string | null;
}

export interface IPriceBreakdown {
  variantUnitPrice: number;
  printPricePerUnit: number;
  setupFee: number;
  subtotal: number;
  total: number;
}
