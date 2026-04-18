import productsJson from "../data/products.json";
import type { Product } from "../types";

export function useProducts(): { products: Product[]; isLoading: boolean } {
  // TODO: Replace with API call → axios.get('/api/products')
  const products = productsJson as Product[];
  return { products, isLoading: false };
}
