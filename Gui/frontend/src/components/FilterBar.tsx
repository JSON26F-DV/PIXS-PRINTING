import React, { useState } from "react";
import { ChevronDown, Heart } from "lucide-react";
import type { Category, Screenplate, ProductFilters } from "../types";

interface FilterBarProps {
  filters: ProductFilters;
  setFilters: (filters: ProductFilters) => void;
  categories: Category[];
  screenplates: Screenplate[];
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  categories,
  screenplates,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const updateFilters = (key: keyof ProductFilters, value: any) => {
    setFilters({ ...filters, [key]: value });
    setActiveDropdown(null);
  };

  return (
    <div className="w-full mb-8">
      {/* Top Container (always visible): text-based controls */}
      <div className="grid grid-cols-2 md:grid-cols-5 items-center gap-x-10 gap-y-3">
        {/* Favorites Toggle */}
        <button
          onClick={() => updateFilters("favoritesOnly", !filters.favoritesOnly)}
          className={[
            "inline-flex items-center justify-start gap-2",
            "text-[11px] md:text-xs font-black uppercase tracking-[0.22em] italic",
            "text-slate-500 hover:text-slate-900 transition-colors",
            filters.favoritesOnly ? "text-slate-900" : "",
          ].join(" ")}
        >
          <Heart
            size={14}
            fill={filters.favoritesOnly ? "currentColor" : "none"}
            className={filters.favoritesOnly ? "text-pixs-mint" : "text-slate-400"}
          />
          FAVORITES
        </button>

        {/* Category Dropdown Trigger */}
        <button
          type="button"
          onClick={() => toggleDropdown("category")}
          className={[
            "inline-flex items-center justify-between md:justify-start gap-2",
            "text-[11px] md:text-xs font-black uppercase tracking-[0.22em] italic",
            "text-slate-500 hover:text-slate-900 transition-colors",
            filters.category !== "ALL" ? "text-slate-900" : "",
          ].join(" ")}
        >
          {filters.category === "ALL"
            ? "DIVISIONS"
            : categories.find((c) => c.id === filters.category)?.label}
          <ChevronDown
            size={14}
            className={[
              "transition-transform duration-200 ease-in-out",
              activeDropdown === "category" ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>

        {/* Price Sort Dropdown Trigger */}
        <button
          type="button"
          onClick={() => toggleDropdown("price")}
          className={[
            "inline-flex items-center justify-between md:justify-start gap-2",
            "text-[11px] md:text-xs font-black uppercase tracking-[0.22em] italic",
            "text-slate-500 hover:text-slate-900 transition-colors",
          ].join(" ")}
        >
          SORT PROTOCOL
          <ChevronDown
            size={14}
            className={[
              "transition-transform duration-200 ease-in-out",
              activeDropdown === "price" ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>

        {/* Availability Toggle */}
        <button
          onClick={() =>
            updateFilters(
              "availability",
              filters.availability === "IN_STOCK" ? "ALL" : "IN_STOCK"
            )
          }
          className={[
            "inline-flex items-center justify-start gap-2",
            "text-[11px] md:text-xs font-black uppercase tracking-[0.22em] italic",
            "text-slate-500 hover:text-slate-900 transition-colors",
            filters.availability === "IN_STOCK" ? "text-slate-900" : "",
          ].join(" ")}
        >
          {filters.availability === "IN_STOCK" ? "SUPPLY: ACTIVE" : "SUPPLY: ALL"}
        </button>

        {/* Screenplate Dropdown Trigger */}
        <button
          type="button"
          onClick={() => toggleDropdown("screenplate")}
          className={[
            "col-span-2 md:col-span-1 inline-flex items-center justify-between md:justify-start gap-2",
            "text-[11px] md:text-xs font-black uppercase tracking-[0.22em] italic",
            "text-slate-500 hover:text-slate-900 transition-colors",
            filters.screenplateId !== "ALL" ? "text-slate-900" : "",
          ].join(" ")}
        >
          {filters.screenplateId === "ALL"
            ? "COMPATIBILITY"
            : screenplates.find((s) => s.id === filters.screenplateId)?.plate_name}
          <ChevronDown
            size={14}
            className={[
              "transition-transform duration-200 ease-in-out",
              activeDropdown === "screenplate" ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>
      </div>

      {/* Bottom Container (expandable): inline dropdown content */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-x-10">
        {activeDropdown === "category" && (
          <div className="col-span-2 md:col-span-1 filter-inline-drop">
            <div className="max-h-64 overflow-y-auto pr-2">
              <div className="grid gap-1">
                <button
                  onClick={() => updateFilters("category", "ALL")}
                  className={[
                    "text-left py-1.5",
                    "text-[10px] font-black uppercase tracking-widest",
                    filters.category === "ALL" ? "text-slate-900" : "text-slate-500",
                    "hover:text-slate-900 transition-colors",
                  ].join(" ")}
                >
                  ALL DIVISIONS
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateFilters("category", cat.id)}
                    className={[
                      "text-left py-1.5",
                      "text-[10px] font-black uppercase tracking-widest",
                      filters.category === cat.id ? "text-slate-900" : "text-slate-500",
                      "hover:text-slate-900 transition-colors",
                    ].join(" ")}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeDropdown === "price" && (
          <div className="col-span-2 md:col-span-1 md:col-start-3 filter-inline-drop">
            <div className="grid gap-1">
              <button
                onClick={() => updateFilters("priceSort", "LOW_TO_HIGH")}
                className={[
                  "text-left py-1.5",
                  "text-[10px] font-black uppercase tracking-widest",
                  filters.priceSort === "LOW_TO_HIGH" ? "text-slate-900" : "text-slate-500",
                  "hover:text-slate-900 transition-colors",
                ].join(" ")}
              >
                PRICE LOW → HIGH
              </button>
              <button
                onClick={() => updateFilters("priceSort", "HIGH_TO_LOW")}
                className={[
                  "text-left py-1.5",
                  "text-[10px] font-black uppercase tracking-widest",
                  filters.priceSort === "HIGH_TO_LOW" ? "text-slate-900" : "text-slate-500",
                  "hover:text-slate-900 transition-colors",
                ].join(" ")}
              >
                PRICE HIGH → LOW
              </button>
            </div>
          </div>
        )}

        {activeDropdown === "screenplate" && (
          <div className="col-span-2 md:col-span-1 md:col-start-5 filter-inline-drop">
            <div className="max-h-64 overflow-y-auto pr-2">
              <div className="grid gap-1">
                <button
                  onClick={() => updateFilters("screenplateId", "ALL")}
                  className={[
                    "text-left py-1.5",
                    "text-[10px] font-black uppercase tracking-widest",
                    filters.screenplateId === "ALL" ? "text-slate-900" : "text-slate-500",
                    "hover:text-slate-900 transition-colors",
                  ].join(" ")}
                >
                  SHOW ALL
                </button>
                {screenplates.map((sp) => (
                  <button
                    key={sp.id}
                    onClick={() => updateFilters("screenplateId", sp.id)}
                    className={[
                      "text-left py-1.5",
                      "text-[10px] font-black uppercase tracking-widest",
                      filters.screenplateId === sp.id ? "text-slate-900" : "text-slate-500",
                      "hover:text-slate-900 transition-colors",
                    ].join(" ")}
                  >
                    {sp.plate_name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
