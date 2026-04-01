# PIXS UI Architecture & Style Guide

This document defines the strict UI standards for the **PIXS Printing Shop** frontend. All agents must follow these patterns to ensure a consistent "Heavy Industrial / Lazada-style" aesthetic.

---

## 1. Component Hierarchy & Layout

Use a consistent container strategy for all pages.

### Page Container
Every page must have a top-level wrapper with `min-h-screen`.
```tsx
<div className="[PageName]Page min-h-screen bg-slate-50 pb-32">
  {/* Content here */}
</div>
```

### Sticky Top Bar (Navigation/Breadcrumb)
Follow AntiGravity's "Identity Terminal" layout for sub-headers.
- **Classes**: `sticky top-24 z-30 bg-white/60 backdrop-blur-3xl border-b border-slate-100 px-6 md:px-16 py-5`

### Main Content Area
Limit the width and center content using a master logic area.
- **Classes**: `max-w-[1400px] mx-auto px-6 md:px-16 pt-12`

---

## 2. ClassName Conventions

We use **PascalCase** for the primary component wrapper and descriptive **kebab-case** for internal utility-like classes.

| Element Type | ClassName Pattern | Example |
| :--- | :--- | :--- |
| **Page Wrapper** | `[PageName]Page` | [SettingsPage](file:///home/jason/Documents/PIXS/frontend/src/views/customer/SettingsPage.tsx#145-302), [ProductDetailPage](file:///home/jason/Documents/PIXS/frontend/src/views/product/ProductDetailPage.tsx#231-284) |
| **Section** | `[Name]Section` | `AccountInfoSection`, [MyOrdersSection](file:///home/jason/Documents/PIXS/frontend/src/pages/Settings/MyOrders/MyOrdersSection.tsx#71-146) |
| **Card** | `[Name]Card` | [OrderCard](file:///home/jason/Documents/PIXS/frontend/src/pages/Settings/MyOrders/MyOrdersSection.tsx#37-70), `ProductCard` |
| **Button** | `[Action]Button` | `RedeemButton`, `SaveButton` |
| **Input Group** | `[Field]InputGroup` | `PhoneInputGroup` |
| **Icon** | `[Component]Icon` | `SettingsAccountInfoIcon` |

---

## 3. Spacing & Padding Rules

Avoid ad-hoc spacing. Use these "Industrial Node" standard units:

- **Page-level Padding**: `pt-28` (if no sticky bar) or `pt-12` (below sticky bar).
- **Vertical spacing between sections**: `space-y-12` or `space-y-24` (Homepage style).
- **Section Inner Padding**: `p-5 md:p-8`.
- **Gaps in Grids**: `gap-6` (cards), `gap-20` to `gap-32` (large split layouts).
- **Rounded Corners**: `rounded-[24px]` (small), `rounded-[44px]` (medium), `rounded-[64px]` (large).

---

## 4. Typography & Branding

The PIXS "Industrial Node" font style is essential.

- **Headings**: `font-black uppercase italic tracking-tighter`.
- **Subtitles/Labels**: `font-black uppercase tracking-widest text-[10px] text-slate-400`.
- **Monospace (Rates/SKUs)**: `font-mono font-black italic`.

**Buttons Style**:
```tsx
className="bg-slate-900 text-white text-[10px] font-black rounded-3xl px-8 py-4 uppercase tracking-[4px] border border-white/10 italic shadow-2xl transition-all hover:scale-105 active:scale-95"
```

---

## 5. Responsiveness Protocol

Always develop **Mobile-First**.
- **Grids**: `grid-cols-1 lg:grid-cols-2` for large details; `grid-cols-2 md:grid-cols-4` for marketplace cards.
- **Sidebar**: Hide on mobile (`hidden lg:block`), use an `AnimatePresence` drawer for mobile navigation.

---

## 6. Golden Template (JSX Pattern)

Use this structure when creating a new settings-style or detail-style page.

```tsx
const NewFeaturePage: React.FC = () => {
  return (
    <div className="NewFeaturePage min-h-screen bg-slate-50">
      {/* 1. Header Protocol */}
      <div className="sticky top-24 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-[1400px] mx-auto h-16 flex items-center px-6">
          <button className="BackButton flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <FiArrowLeft /> Back
          </button>
        </div>
      </div>

      {/* 2. Content Matrix */}
      <main className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Navigation/Sidebar (optional) */}
          <aside className="lg:col-span-3 hidden lg:block">
             <div className="NavCard bg-white border border-slate-100 rounded-[24px] p-6">
                {/* Nav items */}
             </div>
          </aside>

          {/* Functional Node */}
          <section className="lg:col-span-9 space-y-6">
            <div className="ContentCard bg-white border border-slate-100 rounded-[24px] p-8 shadow-sm">
               <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Feature Node</h2>
               <p className="text-[10px] font-bold uppercase tracking-[4px] text-slate-400 mb-8">System Instruction Fragment</p>
               {/* Body Content */}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};
```

> [!WARNING]
> **No Inline Styles**: Use Tailwind classes only.
> **No Generic Names**: Avoid `<div className="card">`. Use `<div className="ProductCard">`.
> **Consistent Shadows**: Use `shadow-sm` for normal cards, `shadow-2xl` for overlays/modals.
