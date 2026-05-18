// ─── Product Domain Types ─────────────────────────────────────────────────────

export interface IProductVariant {
  variant_id: string
  label?: string
  price: number
  stock: number
  // Legacy fields
  size: string
  width: string
  height: string
}

export interface IProduct {
  id: string
  name: string
  short_description: string
  base_price: number
  is_in_stock: boolean
  main_image: string
  min_order: number
  is_need_screenplate: boolean
  is_need_color: boolean
  category_id: string
  category_label: string
  variants: IProductVariant[]
  tags: string[]
  gallery: string[]
  ratings?: number
  total_sold?: number
  // Legacy fields for backward compatibility if needed, but primary focus is DB shape
  long_description?: string
  best_for?: string
  min_threshold?: number
  print_method?: string
  reviews?: {
    id: number
    rating: number
    feedback: string
    customer_name: string
    created_at: string
  }[]
}

export interface ICategory {
  id: string
  label: string
  count: number
  image: string | null
}

export interface IFilters {
  category: string
  price: string
  sort: string
  status: string
  screenplate: string
}

// ─── Color Domain Types ───────────────────────────────────────────────────────

export interface IColor {
  id: string
  name: string
  hex: string
  type: 'Standard' | 'Premium'
}

// ─── Screen Plate Domain Types ───────────────────────────────────────────────

export interface IScreenPlateCompatibility {
  product_id: string
  allowed_variants: string[]
  print_price_per_unit?: Record<string, number>
}

export interface IScreenPlateIncompatibility {
  product_id: string
  variant_ids: string[]
}

export interface IScreenPlate {
  id: string
  owner_id: string
  plate_name: string
  base_setup_fee: number
  is_flatscreen: boolean
  channels: number
  alignment: string
  supported_alignments: string[]
  dimensions: string
  image: string
  comment?: string
  technical_info?: string
  compatibility: IScreenPlateCompatibility[]
  incompatibility?: IScreenPlateIncompatibility[]
}

// ─── Order Configuration ──────────────────────────────────────────────────────

export interface IOrderConfig {
  productId: string
  variantId: string
  quantity: number
  colorIds: string[]
  plateId: string | null
  printPosition: string | null
}

export interface IPriceBreakdown {
  variantUnitPrice: number
  printPricePerUnit: number
  setupFee: number
  subtotal: number
  total: number
}
