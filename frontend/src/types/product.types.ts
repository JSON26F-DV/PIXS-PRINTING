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
  allowed_variants: string[];
  print_price_per_unit?: Record<string, number>;
}

export interface IScreenPlate {
  id: string;
  owner_id: string;
  plate_name: string;
  base_setup_fee: number;
  is_flatscreen: boolean;
  channels: number;
  alignment: string;
  supported_alignments: string[];
  dimensions: string;
  image: string;
  comment?: string;
  technical_info?: string;
  compatibility: IScreenPlateCompatibility[];
  incompatible_products: string[];
}

// ─── Order Configuration ──────────────────────────────────────────────────────

export interface IOrderConfig {
  productId: string;
  variantId: string;
  quantity: number;
  colorIds: string[];
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
