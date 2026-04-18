import categoriesJson from "../data/categories.json";
import type { Category } from "../types";

// Raw shape from categories.json — uses `name` and `product_count`
interface RawCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  image: string | null;
  product_count: number;
}

export function useCategories(): { categories: Category[]; isLoading: boolean } {
  // TODO: Replace with API call → axios.get('/api/categories')
  const raw = categoriesJson as RawCategory[];
  const categories: Category[] = raw.map((c) => ({
    id: c.id,
    label: c.name,
    slug: c.slug,
    description: c.description,
    count: c.product_count,
    image: c.image,
  }));
  return { categories, isLoading: false };
}
