import type { PriceSort, ProductFilters, RatingFilter, Screenplate } from "../types";

function FieldLabel(props: { children: string }) {
  return (
    <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-500">
      {props.children}
    </div>
  );
}

export function FilterPanel(props: {
  filters: ProductFilters;
  onChange: (next: ProductFilters) => void;
  screenplates: Screenplate[];
  totalShown: number;
}) {
  const { filters, onChange, screenplates, totalShown } = props;

  const set = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const toggle = (key: "inStockOnly" | "favoritesOnly") =>
    set(key, !(filters[key] ?? false));

  const nextPriceSort: PriceSort =
    filters.priceSort === "LOW_TO_HIGH" ? "HIGH_TO_LOW" : "LOW_TO_HIGH";

  const ratingOptions: Array<{ id: RatingFilter; label: string }> = [
    { id: "ANY", label: "ANY" },
    { id: "4_UP", label: "4★+" },
    { id: "3_UP", label: "3★+" },
  ];

  return (
    <div className="rounded-[24px] bg-white border border-slate-200 p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-mountain font-black uppercase tracking-tighter text-slate-900">
            CALIBRATE VIEW
          </div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.28em] text-slate-500">
            RESULTS: {totalShown}
          </div>
        </div>
        <span className="w-2 h-2 rounded-full bg-[#75EEA5] animate-pulse shadow-[0_0_10px_#75EEA5]" />
      </div>

      <div className="mt-6 grid gap-5">
        <div>
          <FieldLabel>PRICE RANGE</FieldLabel>
          <button
            type="button"
            onClick={() => set("priceSort", nextPriceSort)}
            className={[
              "mt-2 w-full rounded-[18px] px-4 py-3",
              "bg-[#0f172a] text-slate-50 border border-slate-800",
              "font-mono text-[11px] uppercase tracking-[0.28em]",
              "hover:border-[#75EEA5] transition",
            ].join(" ")}
          >
            {filters.priceSort === "LOW_TO_HIGH" ? "LOW → HIGH" : "HIGH → LOW"}
          </button>
        </div>

        <div>
          <FieldLabel>RATINGS</FieldLabel>
          <div className="mt-2 flex gap-2">
            {ratingOptions.map((opt) => {
              const active = (filters.rating ?? "ANY") === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => set("rating", opt.id)}
                  className={[
                    "flex-1 rounded-[18px] px-3 py-3 border",
                    "font-mono text-[11px] uppercase tracking-[0.28em]",
                    active
                      ? "bg-[#0f172a] text-[#75EEA5] border-[#75EEA5] shadow-[0_0_10px_#75EEA5]"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 transition",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3">
          <FieldLabel>AVAILABILITY</FieldLabel>
          <button
            type="button"
            onClick={() => toggle("inStockOnly")}
            className={[
              "rounded-[18px] px-4 py-3 border text-left",
              "font-mono text-[11px] uppercase tracking-[0.28em]",
              filters.inStockOnly ?? false
                ? "bg-[#0f172a] text-[#75EEA5] border-[#75EEA5] shadow-[0_0_10px_#75EEA5]"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 transition",
            ].join(" ")}
          >
            {(filters.inStockOnly ?? false) ? "IN STOCK ONLY: ON" : "IN STOCK ONLY: OFF"}
          </button>

          <FieldLabel>FAVORITES</FieldLabel>
          <button
            type="button"
            onClick={() => toggle("favoritesOnly")}
            className={[
              "rounded-[18px] px-4 py-3 border text-left",
              "font-mono text-[11px] uppercase tracking-[0.28em]",
              filters.favoritesOnly
                ? "bg-[#0f172a] text-[#75EEA5] border-[#75EEA5] shadow-[0_0_10px_#75EEA5]"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 transition",
            ].join(" ")}
          >
            {filters.favoritesOnly ? "FAVORITED ONLY: ON" : "FAVORITED ONLY: OFF"}
          </button>
        </div>

        <div>
          <FieldLabel>SCREENPLATES</FieldLabel>
          <div className="mt-2">
            <select
              value={filters.screenplateId}
              onChange={(e) =>
                set("screenplateId", (e.target.value || "ANY") as ProductFilters["screenplateId"])
              }
              className={[
                "w-full rounded-[18px] px-4 py-3",
                "bg-white border border-slate-200",
                "font-mono text-[11px] uppercase tracking-[0.22em] text-slate-700",
                "focus:outline-none focus:ring-2 focus:ring-[#75EEA5] focus:ring-offset-2",
              ].join(" ")}
            >
              <option value="ANY">ANY</option>
              {screenplates.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.plate_name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 text-[12px] text-slate-500 leading-snug">
            <span className="font-mono uppercase tracking-[0.22em]">NOTE</span>{" "}
            Compatibility is mocked; join-table uses different product IDs and is normalized.
          </div>
        </div>
      </div>
    </div>
  );
}

