import React from "react";
import HeroSection from "../../components/HeroSection";
import CategoryCard from "../../components/CategoryCard";
import ProductGrid from "../../components/ProductGrid";
import { useCategories } from "../../hooks/useCategories";
import { useProducts } from "../../hooks/useProducts";
import { useFavorites } from "../../hooks/useFavorites";
import { useScreenplateFilter } from "../../hooks/useScreenplateFilter";

const Homepage: React.FC = () => {
  const { categories } = useCategories();
  const { products } = useProducts();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { screenplates, getCompatibleProductIdSet } = useScreenplateFilter();

  return (
    <main className="min-h-screen">
      {/* SECTION 1: HERO */}
      <HeroSection />

      {/* SECTION 2: PRINT DIVISIONS (QUICK CATEGORIES) */}
      <section className="max-w-[1480px] mx-auto px-4 md:px-10 pt-10 md:pt-14 pb-10 md:pb-16">
        <header className="mb-8 md:mb-10 flex flex-col gap-2">
          <h2 className="section_title text-3xl md:text-5xl text-slate-900 font-black italic">
            Production Line
          </h2>
          <p className="font-mono text-xs md:text-sm uppercase tracking-[4px] text-slate-400">
            Industrial categories
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
          {categories.slice(0, 4).map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
          <CategoryCard category={{} as any} isMore />
        </div>
      </section>

      {/* SECTION 3: DEPLOYMENT READY (ALL PRODUCTS) */}
      <section id="marketplace">
        <div className="max-w-[1480px] mx-auto px-4 md:px-10 py-14 md:py-20">
          <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <h2 className="section_title text-4xl md:text-6xl text-slate-900 font-black italic">
                Marketplace
              </h2>
              <p className="mt-3 font-mono text-xs md:text-sm uppercase tracking-[4px] text-slate-400">
                Active inventory catalog
              </p>
            </div>
          </header>

          <ProductGrid
            products={products}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            categories={categories}
            screenplates={screenplates}
            getCompatibleProductIdSet={getCompatibleProductIdSet}
          />
        </div>
      </section>
    </main>
  );
};

export default Homepage;
