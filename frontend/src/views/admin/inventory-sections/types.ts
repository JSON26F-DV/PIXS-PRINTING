export interface IVariant {
  variant_id: string
  size: string
  width: string
  height: string
  price: number
  stock: number
}

export interface IProduct {
  id: string
  name: string
  category: string
  category_id?: string
  category_label?: string
  short_description: string
  long_description: string
  best_for: string
  base_price: number
  raw_material_cost: number
  current_stock: number
  min_threshold: number
  min_order: number
  main_image: string
  gallery: string[]
  print_method: string
  tags: string[]
  is_need_color: boolean
  variants: IVariant[]
  total_sold?: number
  is_in_stock?: boolean
  ratings?: number
}

export interface ICategory {
  id: string
  label: string
  count?: number
  image?: string
}

export interface IUser {
  id: string
  name: string
  first_name?: string
  last_name?: string
  email: string
  profile_picture: string
  role?: string
  company_name?: string
  business_address?: string
}

export interface IRestockLog {
  id: string
  product_id: string | null
  product_name: string
  qty_added: number
  cost: number
  date: string
  type: 'RESTOCK' | 'MISC'
  staff_name: string
  notes: string
}
