
export interface IVariant {
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
  variants: IVariant[];
}

export interface ICategory {
  id: string;
  label: string;
  count?: number;
  image?: string;
}

export interface ICompatibilityNode {
  product_id: string; 
  allowed_variants: string[];
  print_price_per_unit?: Record<string, number>;
}

export interface IScreenplate {
  id: string;
  owner_id: string;
  plate_name: string;
  image: string;
  channels: number;
  alignment: string;
  supported_alignments?: string[];
  dimensions?: string;
  technical_info: string;
  comment: string;
  base_setup_fee?: number;
  is_flatscreen: boolean;
  compatibility: ICompatibilityNode[];
  incompatible_products: string[];
}

export interface IUser {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  profile_picture: string;
  role?: string;
  company_name?: string;
  business_address?: string;
}

export interface IRestockLog {
  id: string;
  product_id: string | null;
  product_name: string;
  qty_added: number;
  cost: number;
  date: string;
  type: 'RESTOCK' | 'MISC';
  staff_name: string;
  notes: string;
}
