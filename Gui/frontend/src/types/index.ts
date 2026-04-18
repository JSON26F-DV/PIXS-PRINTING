export interface Category {
  id: number;
  label: string; // Refined from 'name'
  slug: string;
  description: string;
  count: number; // Refined from 'product_count'
  image: string | null;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  category_id: number;
  best_for: string;
  description: string;
  base_price: number;
  min_order: number;
  stock: number;
  stock_threshold: number;
  main_image: string | null;
  images: string[];
  tags: string[];
  rating: number; // Mocked 3.0-4.9
  rating_count: number;
  is_active: boolean;
  screenplate_ids: number[];
}

export interface Screenplate {
  id: number | string;
  owner_id: string;
  plate_name: string;
  base_setup_fee: number;
  is_flatscreen: 0 | 1;
  channels: number;
  alignment: string;
  supported_alignments: string[];
  dimensions: string;
  technical_info: string;
  image: string;
  comment: string;
}

export interface ScreenplateCompatibility {
  id: number;
  screenplate_id: number | string;
  product_id: number | string;
  variant_id: string | null;
  print_price_per_unit: number;
}

export type PriceSort = "LOW_TO_HIGH" | "HIGH_TO_LOW";
export type AvailabilityFilter = "ALL" | "IN_STOCK";
export type RatingFilter = "ANY" | "4_UP" | "3_UP";

export interface ProductFilters {
  priceSort: PriceSort;
  category: number | "ALL";
  availability: AvailabilityFilter;
  favoritesOnly: boolean;
  screenplateId: number | string | "ALL";
  rating?: RatingFilter;
  inStockOnly?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export const PIXS_FAVORITES_KEY = "pixs_favorites" as const;

export function formatPHP(n: number): string {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

export function mockRating(id: number): number {
  const s = String(id);
  return ((s.charCodeAt(s.length - 1) % 20) + 30) / 10;
}

