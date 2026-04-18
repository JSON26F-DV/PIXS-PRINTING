import transformerAttributifyJsx from "@unocss/transformer-attributify-jsx";
import transformerVariantGroup from "@unocss/transformer-variant-group";
import presetWind4 from "@unocss/preset-wind4";
import { defineConfig, presetAttributify } from "unocss";
import transformerDirectives from "@unocss/transformer-directives";

export default defineConfig({
  theme: {
    colors: {
      "pixs-mint": "#75EEA5",
      "pixs-dark": "#0f172a",
    },
    boxShadow: {
      mint: "0 0 12px #75EEA5",
      "mint-sm": "0 0 6px #75EEA5",
    },
    fontFamily: {
      display: ['"Bebas Neue"', "sans-serif"],
      condensed: ['"Barlow Condensed"', "sans-serif"],
      mono: ['"IBM Plex Mono"', "monospace"],
    },
  },

  shortcuts: [
    {
      flex_centered: "flex flex-col items-center justify-center text-center",
      // Use explicit font family to avoid preset ambiguity
      section_title: "font-['Bebas_Neue'] italic uppercase tracking-tighter font-black",
      // Homepage filter dropdown/button styling
      pill_filter: [
        "flex items-center justify-between gap-2",
        "min-w-[140px] px-5 py-3.5",
        "rounded-2xl border-2 border-slate-100 bg-white",
        "text-[10px] font-black uppercase tracking-widest",
        "text-slate-400 hover:border-slate-200 transition-colors",
      ].join(" "),
    },
  ],

  presets: [presetWind4(), presetAttributify()],
  transformers: [
    transformerVariantGroup(),
    transformerAttributifyJsx(),
    transformerDirectives({
      applyVariable: ["--at-apply", "--uno-apply", "--uno"],
    }),
  ],
});
