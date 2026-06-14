/** UI filters for the customer marketplace (homepage catalog section). */
export type HomepagePriceSort =
  | 'LOW_TO_HIGH'
  | 'HIGH_TO_LOW'
  | 'MOST_SOLD'
  | 'HIGHEST_RATING'
  | 'A_TO_Z'
  | 'Z_TO_A'
export type HomepageAvailabilityFilter = 'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'

export interface HomepageProductFilters {
  priceSort: HomepagePriceSort
  /** `categories.id` from API (`categories` table). */
  category: string | 'ALL'
  availability: HomepageAvailabilityFilter
  favoritesOnly: boolean
  minRating: number | 'ALL'
  soldFilter: 'ALL' | 'MOST_SOLD'
}

export const PIXS_FAVORITES_KEY = 'pixs_favorites' as const

export function formatPHP(n: number): string {
  return '\u20B1' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

/** Deterministic “rating” from product id (no ratings table in schema). */
export function mockRatingFromProductId(id: string): number {
  let sum = 0
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i)
  return ((sum % 20) + 30) / 10
}
