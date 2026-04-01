import type { IProduct, IScreenPlate, IColor, IScreenPlateCompatibility } from '../../../types/product.types';
import productsData from '../../../data/products.json';
import screenplateData from '../../../data/screenplate.json';
import colorData from '../../../data/color.json';

// Simulated latency to mimic actual production API call
const SIMULATED_DELAY_MS = 250;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Fetch a single product by its unique node ID */
export const fetchProductById = async (id: string): Promise<IProduct | null> => {
  await delay(SIMULATED_DELAY_MS);
  const product = (productsData as IProduct[]).find(p => p.id === id);
  return product ?? null;
};

/** Fetch all active screen plates compatible with the specific product ID */
export const fetchCompatiblePlates = async (productId: string): Promise<IScreenPlate[]> => {
  await delay(SIMULATED_DELAY_MS);
  return (screenplateData as IScreenPlate[]).filter(plate =>
    plate.is_active &&
    plate.compatible_products.some((cp: IScreenPlateCompatibility) => cp.product_id === productId)
  );
};

/** Fetch the master inventory of standard and premium colors */
export const fetchColors = async (): Promise<IColor[]> => {
  await delay(SIMULATED_DELAY_MS);
  return colorData as IColor[];
};

/** Mock checking if a customer already owns a screen plate to waive setup fees */
export const checkOwnedPlates = async (): Promise<string[]> => {
  await delay(SIMULATED_DELAY_MS);
  // Mock logic: Returns SP-MINT-001 as an owned plate for the demonstration
  return ['SP-MINT-001']; 
};
