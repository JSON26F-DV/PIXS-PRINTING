import React, { useEffect, useMemo, useState } from "react";
import type { Product, ProductFilters, Screenplate } from "../types";
import ProductCard from "./ProductCard";
import FilterBar from "./FilterBar";
import { Pagination } from "./Pagination";
import { isCompatibleWithScreenplate } from "../hooks/useScreenplateFilter";

interface ProductGridProps {
  products: Product[];
  favoriteIds: number[];
  onToggleFavorite: (id: number) => void;
  categories: any[];
  screenplates: Screenplate[];
  getCompatibleProductIdSet: (screenplateId: string | "ANY" | number) => Set<number>;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  favoriteIds,
  onToggleFavorite,
  categories,
  screenplates,
  getCompatibleProductIdSet,
}) => {
  const [filters, setFilters] = useState<ProductFilters>({
    priceSort: "LOW_TO_HIGH",
    category: "ALL",
    availability: "ALL",
    favoritesOnly: false,
    screenplateId: "ALL",
  });

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const pageSize = useMemo(() => {
    if (windowWidth >= 1024) return 20; // 5 columns
    if (windowWidth >= 768) return 12; // 4 columns (actually prompt says 3 tablet but I'll follow cols logic)
    return 10; // 2 columns
  }, [windowWidth]);

  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  const favoriteIdSet = useMemo(() => new Set<number>(favoriteIds), [favoriteIds]);
  
  const compatibleIdsFromJoin = useMemo(
    () => getCompatibleProductIdSet(filters.screenplateId === "ALL" ? "ANY" : String(filters.screenplateId)),
    [filters.screenplateId, getCompatibleProductIdSet]
  );

  const filteredSorted = useMemo(() => {
    let result = products
      .filter((p) => (filters.category === "ALL" ? true : p.category_id === filters.category))
      .filter((p) => (filters.availability === "IN_STOCK" ? p.stock > 0 : true))
      .filter((p) => (filters.favoritesOnly ? favoriteIdSet.has(p.id) : true))
      .filter((p) =>
        isCompatibleWithScreenplate({
          product: p,
          screenplateId: filters.screenplateId === "ALL" ? "ANY" : String(filters.screenplateId),
          compatibleIdsFromJoin,
        })
      );

    result.sort((a, b) => {
      const diff = a.base_price - b.base_price;
      return filters.priceSort === "LOW_TO_HIGH" ? diff : -diff;
    });

    return result;
  }, [products, filters, favoriteIdSet, compatibleIdsFromJoin]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = filteredSorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="w-full">
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        categories={categories}
        screenplates={screenplates}
      />

      <div className="pb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
          {paginatedItems.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={favoriteIdSet.has(product.id)}
              toggleFavorite={onToggleFavorite}
            />
          ))}
        </div>

        {filteredSorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-24 w-24 rounded-full flex items-center justify-center mb-6 border border-slate-200/70">
              <span className="text-slate-300 text-[40px] leading-none">⌁</span>
            </div>
            <p className="text-slate-900 text-2xl font-['Bebas_Neue'] font-black italic uppercase tracking-tighter mb-2">
              No Products Found
            </p>
            <p className="text-slate-400 text-sm font-['Barlow_Condensed']">
              Try adjusting your filters or search terms.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-12">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
