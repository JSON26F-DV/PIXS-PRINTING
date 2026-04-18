import compatJson from "../data/screenplate_compatibility.json";
import screenplatesJson from "../data/screenplates.json";
import type { Product, Screenplate, ScreenplateCompatibility } from "../types";

const CURRENT_USER_ID = "USER-99";

export function useScreenplateFilter(): {
  screenplates: Screenplate[];
  compat: ScreenplateCompatibility[];
  getCompatibleProductIdSet: (screenplateId: string | number | "ANY") => Set<number>;
} {
  // TODO: Replace with API call → axios.get('/api/screenplates?owner_id=me')
  const allPlates = screenplatesJson as Screenplate[];
  const screenplates = allPlates.filter((p) => p.owner_id === CURRENT_USER_ID);

  // TODO: Replace with API call → axios.get('/api/screenplate-compatibility')
  const compat = compatJson as ScreenplateCompatibility[];

  const getCompatibleProductIdSet = (screenplateId: string | number | "ANY") => {
    if (screenplateId === "ANY") return new Set<number>();

    const set = new Set<number>();
    for (const row of compat) {
      if (String(row.screenplate_id) !== String(screenplateId)) continue;
      const match = /^PROD-(\d{3})$/.exec(String(row.product_id));
      if (match) set.add(Number(match[1]));
    }
    return set;
  };

  return { screenplates, compat, getCompatibleProductIdSet };
}

export function isCompatibleWithScreenplate(args: {
  product: Product;
  screenplateId: string | "ANY";
  compatibleIdsFromJoin: Set<number>;
}): boolean {
  const { product, screenplateId, compatibleIdsFromJoin } = args;
  if (screenplateId === "ANY") return true;

  if (compatibleIdsFromJoin.size > 0) {
    return compatibleIdsFromJoin.has(product.id);
  }

  // Fallback if join data is incomplete: avoid blocking results in mock mode.
  // TODO: When backend exists, remove this and rely solely on server truth.
  return true;
}
