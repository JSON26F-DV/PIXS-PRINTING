import type {
  IProduct,
  IColor,
} from '../../../types/product.types'
import productsData from '../../../data/products.json'
import colorData from '../../../data/color.json'

// Simulated latency to mimic actual production API call
const SIMULATED_DELAY_MS = 250

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Fetch a single product by its unique node ID */
export const fetchProductById = async (
  id: string,
): Promise<IProduct | null> => {
  await delay(SIMULATED_DELAY_MS)
  const product = (productsData as unknown as IProduct[]).find(
    (p) => p.id === id,
  )
  return product ?? null
}

/** Fetch the master inventory of standard and premium colors */
export const fetchColors = async (): Promise<IColor[]> => {
  await delay(SIMULATED_DELAY_MS)
  return colorData as IColor[]
}
