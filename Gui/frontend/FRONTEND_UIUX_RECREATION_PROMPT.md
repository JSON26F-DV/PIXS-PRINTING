# PIXS Frontend Homepage UI/UX Recreation Prompt

## Overview
The PIXS Homepage is a modern, minimalist industrial marketplace for screenplate printing services. It features bold typography, a mint/slate color palette, and smooth interactive components. The design emphasizes content hierarchy, smooth animations, and intuitive filtering.

---

## 1. HERO SECTION
**File:** `HeroCarousel.tsx`

### Visual Design
- **Dimensions:** Full-width container with dynamic height
  - Mobile: `560px` height
  - Desktop: `680px` height
- **Styling:** 
  - Rounded corners: `40px` (mobile), `64px` (desktop)
  - Box shadow: `shadow-2xl`
  - Overflow: `hidden` (clips content to rounded edges)

### Image Layer
- Full-bleed background image with smooth zoom on hover
- Lazy loading except first slide (eager)
- **Hover effect:** `scale-110` over 10 seconds (`duration-[10000ms]`)
- Gradient overlay: `from-slate-900 via-slate-900/20 to-transparent` (bottom to top)

### Content Positioning
- **Location:** Bottom-left corner with absolute positioning
- **Padding:** `px-8 py-20` (mobile), `px-20 py-20` (desktop)

### Typography
- **Headline:**
  - Font size: `4xl` (mobile), `7xl` (desktop)
  - Weight: `black` (900)
  - Color: `white`
  - Style: `italic uppercase`
  - Tracking: `tighter` (`-0.05em`)
  - Line height: `0.9` (very tight)
  - Font family: Display font (`font-display`)
  - Text shadow: `drop-shadow-2xl`

- **Subheadline:**
  - Font size: `sm` (mobile), `xl` (desktop)
  - Weight: `bold` (700)
  - Color: `white/70` (semi-transparent white)
  - Style: `uppercase`
  - Tracking: `[4px]` (extra wide)
  - Font family: Body font (`font-body`)
  - Text shadow: `drop-shadow-lg`

### Call-to-Action Button
- **Label:** "Browse Products"
- **Background color:** `pixs-mint` (custom color - bright mint/teal)
- **Text color:** `slate-900` (dark)
- **Padding:** `px-8 py-4` (mobile), `px-12 py-6` (desktop)
- **Border radius:** `rounded-2xl` (medium-large)
- **Font:** `uppercase italic text-sm font-black tracking-[4px]`
- **Hover effects:**
  - Scale up: `hover:scale-105`
  - White overlay animation: slides up from bottom
- **Active effect:** `active:scale-95`

### Navigation Controls
**Previous/Next Arrows:**
- Circular buttons: `h-14 w-14`
- Border radius: `rounded-2xl`
- Background: `bg-white/10 backdrop-blur-md border border-white/20`
- Icon color: `text-white`
- **Visibility:** Hidden by default, appear on hover (`opacity-0 group-hover:opacity-100`)
- **Hover state:** 
  - Background: `bg-pixs-mint`
  - Icon color: `text-slate-900`
  - Scale on active: `active:scale-90`
- **Icon:** `ChevronLeft/ChevronRight` size 24, stroke width 3

**Dot Indicators:**
- **Location:** Bottom-right corner
- **Position:** `bottom-8 right-8` (mobile), `bottom-20 right-20` (desktop)
- **Styling:** 
  - Dots: `h-3 w-8 rounded-full` (pill-shaped)
  - Background: `bg-white/20`
  - Hover: `bg-white/40`
  - Gap between: `gap-2`

### Auto-rotation
- **Delay:** 5 seconds between slides
- **Transition duration:** 30ms (smooth)
- **Disable on:**
  - User interaction (manual navigation)
  - Mouse hover
  - Prefers reduced motion setting

---

## 2. PRODUCTION LINE (QUICK CATEGORIES) SECTION
**File:** `QuickCategoryRow.tsx`

### Section Container
- **Padding:** `px-4 py-12` (mobile), `px-20 py-24` (desktop)
- **Background:** `white`

### Header
- **Layout:** Flex with space-between alignment
- **Margin bottom:** `mb-12`

**Main Header (Left side):**
- **Headline:** "Production Line"
- Font size: `3xl` (mobile), `5xl` (desktop)
- Weight: `black` (900)
- Color: `slate-900`
- Style: `uppercase italic`
- Tracking: `tighter`
- Font family: Display font
- Margin bottom: `mb-4`

**Subheader:**
- Font size: `xs` (mobile), `sm` (desktop)
- Weight: `bold` (700)
- Color: `slate-400`
- Style: `uppercase`
- Tracking: `[4px]` (extra wide)
- Font family: Body font

### Category Grid
- **Layout:** Horizontal flex, no-wrap
- **Gap:** `gap-4` (mobile), `gap-8` (desktop)

### Category Cards
- **Aspect ratio:** `4/3` (rectangular)
- **Border radius:** `rounded-[32px]` (mobile), `rounded-[44px]` (desktop)
- **Overflow:** `hidden`
- **Background:** Gradient from category image or solid color
- **Interactive:**
  - Cursor: `pointer`
  - Hover transitions smooth

### "View All" Button
- **Styling:**
  - Border: `2px dashed border-slate-200`
  - Background: `bg-slate-50`
  - Border radius: Same as cards
  - Aspect ratio: `4/3`
- **Content:**
  - Icon: `LayoutGrid` from lucide-react
  - Icon container: `h-10 w-10` (mobile), `h-14 w-14` (desktop)
  - Icon background: `bg-white shadow-xl`
  - Icon color: `text-slate-400`
  - Label: "View All"
  - Label size: `text-[8px]` (mobile), `text-[10px]` (desktop)
  - Label weight: `font-black`
  - Label tracking: `tracking-widest` to `tracking-[4px]`
  - Label style: `uppercase italic`
- **Hover effects:**
  - Border color: `border-pixs-mint`
  - Background: `bg-white`
  - Icon color: `text-pixs-mint`
  - Icon rotation: `rotate-12`
- **Active effect:** `active:scale-95`

### Loading State
- Skeleton cards: `aspect-square rounded-[32px] bg-slate-100 animate-pulse`
- Show 4 skeletons during load

---

## 3. MARKETPLACE SECTION (FILTERS & PRODUCTS)
**File:** `Homepage.tsx` (main section)

### Section Container
- **Padding:** `px-4 py-20` (mobile), `px-20 py-32` (desktop)
- **Background:** `bg-slate-50/50` (subtle light gray)

### Header & Search Row
- **Layout:** Flex column (mobile), flex row with space-between (desktop)
- **Gap:** `gap-8`

**Marketplace Headline:**
- Font size: `4xl` (mobile), `6xl` (desktop)
- Weight: `black` (900)
- Color: `slate-900`
- Style: `uppercase italic`
- Tracking: `tighter`
- Font family: Display font

**Search Container:**
- Max width: `max-w-xl`
- Full width on mobile: `w-full`

### Filter Controls Row
**Grid Layout:**
- Mobile: `grid-cols-2` (2 columns)
- Desktop: Flex wrap (`md:flex md:flex-wrap`)
- Gap: `gap-3`
- Alignment: `items-center`

**Individual Filter Dropdowns:**
- **Component:** `FilterDropdown`
- **Props:**
  1. **Classification** (Category)
     - Icon: `Package`
     - Options: Categories + "All"
  2. **Rate Range** (Price)
     - Icon: `Banknote`
     - Options: Price ranges (All Prices, Under ₱100, ₱100-₱500, ₱500-₱1,000, Over ₱1,000)
  3. **Sort Protocol** (Sort)
     - Icon: `TrendingUp`
     - Options: Price Low-High, Price High-Low, Newest Arrivals, Most Popular
  4. **Active Status** (Stock Status)
     - Icon: `Activity`
     - Options: All Status, In Stock, Out of Stock
  5. **Owned Plate** (Screenplate)
     - Icon: `Printer`
     - Options: All Plates, Requires Plate, Stock Item

### Filter Dropdown Component Details
**Button (Closed State):**
- **Dimensions:** Min width `140px`, flexible
- **Border radius:** `rounded-2xl`
- **Padding:** `px-5 py-3.5`
- **Font size:** `text-[10px]`
- **Font:** `font-black uppercase tracking-widest`
- **Border:** `border-2`

**Default (inactive):**
- Border color: `border-slate-100`
- Background: `bg-white`
- Text color: `text-slate-400`
- Icon color: `text-slate-300`
- Hover: `hover:border-slate-200`

**Active (filtered):**
- Border color: `border-pixs-mint`
- Text color: `text-pixs-mint`
- Background: `bg-white`
- Shadow: `shadow-lg shadow-pixs-mint/5`
- Icon color: `text-pixs-mint`

**Dropdown Icon:**
- Icon: `ChevronDown`
- Size: `14px`
- Rotation on open: `rotate-180` with transition

**Dropdown Menu (Open State):**
- **Position:** Absolute, top-full, right-aligned
- **Z-index:** `z-[100]`
- **Margin:** `mt-2`
- **Border radius:** `rounded-[24px]`
- **Border:** `border border-slate-100`
- **Background:** `bg-white`
- **Shadow:** `shadow-2xl`
- **Max height:** `max-h-64` with scroll
- **Padding:** `p-2`
- **Scroll:** Custom scrollbar styling

**Menu Items:**
- **Padding:** `px-4 py-3`
- **Border radius:** `rounded-xl`
- **Font:** `text-[10px] font-black uppercase tracking-widest`

**Item States:**
- **Default:** `text-slate-500 hover:bg-slate-50`
- **Active:** `bg-pixs-mint text-slate-900`

**Animation:**
- Entry: `initial={{ opacity: 0, y: 10, scale: 0.95 }}`
- Animate: `{{ opacity: 1, y: 0, scale: 1 }}`
- Exit: Same as initial
- Duration: Framer Motion defaults (~300ms)

---

## 4. PRODUCT GRID & CARDS
**File:** `ProductGrid.tsx` and `ProductCard.tsx`

### Grid Container
**Responsive Layout:**
- Mobile: `grid-cols-2` (2 products per row)
- Desktop (lg): `lg:grid-cols-4` (4 products per row)
- Extra large: `xl:grid-cols-5` (5 products per row)
- Gap: `gap-4` (mobile), `gap-10` (desktop)

### Loading State
- Shows 20 skeleton cards
- Skeleton: `aspect-square rounded-[32px] bg-slate-50 border border-slate-100 animate-pulse`

### Empty State
- **Background:** Circular icon container `bg-slate-50 h-24 w-24 rounded-full`
- **Icon:** `LayoutGrid` size 40, color `text-slate-200`
- **Headline:** "No Products Found"
  - Font size: `2xl`
  - Weight: `black`
  - Color: `slate-900`
  - Style: `uppercase italic`
  - Tracking: `tighter`
  - Margin: `mb-2`
- **Subtext:** "Try adjusting your filters or search terms."
  - Font size: `sm`
  - Font family: Body font
  - Color: `slate-400`

### Individual Product Card
**Container:**
- **Border radius:** `rounded-[32px]` (mobile), `rounded-[44px]` (desktop)
- **Border:** `border border-slate-100`
- **Background:** `bg-white`
- **Padding:** `p-2` (mobile), `p-2.5` (desktop)
- **Cursor:** `pointer`
- **Hover animation:**
  - Can be framer motion: `initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}`
  - Translate up on hover: `hover:-translate-y-3`
  - Smooth transitions

**Image Container:**
- **Aspect ratio:** `aspect-square` (perfect square)
- **Border radius:** `rounded-[24px]` (mobile), `rounded-[36px]` (desktop)
- **Border:** `border border-slate-50`
- **Background:** `bg-slate-50 shadow-inner`
- **Content alignment:** Flex center
- **Overflow:** `hidden`

**Product Image:**
- **Hover zoom:** `group-hover:scale-110` over 1 second

**Favorite Button:**
- **Position:** Absolute top-right
- **Dimensions:** `h-8 w-8` (mobile), `h-12 w-12` (desktop)
- **Border radius:** `rounded-xl` (mobile), `rounded-[22px]` (desktop)
- **Positioning:** `top-3 right-3` (mobile), `top-6 right-6` (desktop)
- **Background:** `bg-white/90 border border-white` with `backdrop-blur-xl`
- **Shadow:** `shadow-lg`
- **Icon:** `Heart` (hollow by default)
- **Active state:** `fill-rose-500 text-rose-500`
- **Inactive state:** `text-slate-200`

**Stock Badge:**
- **Position:** Absolute bottom-left
- **Positioning:** `bottom-2 left-2` (mobile), `bottom-6 left-6` (desktop)
- **Border radius:** `rounded-lg` (mobile), `rounded-xl` (desktop)
- **Padding:** `px-2 py-1` (mobile), `px-4 py-2` (desktop)
- **Font:** `text-[8px]` (mobile), `text-[9px]` (desktop), `font-black tracking-widest uppercase`
- **Border:** `border border-white/10`
- **Shadow:** `shadow-2xl`

**Stock Status Colors:**
- **High stock (>50):** `bg-slate-900 text-white`, pulse dot is `bg-pixs-mint`
- **Low stock (≤50):** `bg-rose-500 text-white`, pulse dot is `bg-white`
- **Pulse animation:** `animate-pulse` on dot

**Content Section:**
- **Padding:** `p-3 pb-2` (mobile), `p-6 pb-4` (desktop)

**Product Name:**
- **Font size:** `text-[11px]` (mobile), `text-lg` (desktop)
- **Weight:** `font-black`
- **Color:** `text-slate-900`
- **Style:** `uppercase italic`
- **Tracking:** `tracking-tight`
- **Truncate:** `truncate` (single line ellipsis)
- **Hover color:** `group-hover:text-pixs-mint`
- **Margin bottom:** `mb-2`

**Sold Count Badge:**
- **Font size:** `text-[8px]` (mobile), `text-[9px]` (desktop)
- **Weight:** `font-black`
- **Color:** `text-slate-400`
- **Background:** `bg-slate-50`
- **Padding:** `px-2 py-0.5`
- **Border radius:** `rounded-full`

**Short Description:**
- **Font size:** `text-[8px]` (mobile), `text-[9px]` (desktop)
- **Weight:** `font-bold`
- **Color:** `text-slate-300`
- **Style:** `uppercase italic`
- **Tracking:** `tracking-widest`
- **Opacity:** `opacity-60`
- **Lines:** `line-clamp-2` (max 2 lines)
- **Margin bottom:** `mb-4`

**Price & CTA Container:**
- **Border top:** `border-t border-slate-50`
- **Padding top:** `pt-3`
- **Layout:** Flex with space-between

**Price Section (Left):**
- **Authentication check:** If not logged in, show "Locked Rate"

**If Logged In:**
- **Min order price:**
  - Font size: `text-[9px]` (mobile), `text-sm` (desktop)
  - Weight: `font-black`
  - Color: `text-rose-500`
  - Content: "Min: ₱[amount]"

- **Unit price:**
  - Font size: `text-[10px]` (mobile), `text-lg` (desktop)
  - Font family: `font-mono`
  - Weight: `font-black`
  - Style: `italic`
  - Color: `text-slate-900`
  - Tracking: `tracking-tighter`
  - Content: "₱[price]/pc"

**If Not Logged In:**
- **Badge:** Rounded pill with border
  - Border: `border border-slate-100`
  - Background: `bg-slate-50`
  - Padding: `px-3 py-2`
  - Content: Pulse dot + "Locked Rate" text
  - Text size: `text-[8px]`
  - Text weight: `font-black`
  - Text color: `text-slate-300`

**Add to Cart Button (Right):**
- **Icon:** `Plus` size 18, stroke width 3
- **Dimensions:** `h-8 w-8` (mobile), `h-12 w-12` (desktop)
- **Border radius:** `rounded-xl` (mobile), `rounded-2xl` (desktop)
- **Border:** `border border-slate-100`
- **Background:** `bg-slate-50`
- **Color:** `text-slate-900`
- **Shadow:** `shadow-lg`
- **Hover effects:**
  - Background: `hover:bg-pixs-mint`
  - Border: `hover:border-pixs-mint`
  - Rotation: `group-hover:rotate-12`
- **Active effect:** `active:scale-95`

---

## 5. COLOR PALETTE

| Name | Hex/CSS | Usage |
|------|---------|-------|
| **Primary Mint** | `pixs-mint` | Buttons, active states, highlights |
| **Slate 900** | `#0f172a` | Dark text, backgrounds |
| **Slate 50** | `#f8fafc` | Light backgrounds |
| **Slate 400** | `#cbd5e1` | Secondary text |
| **Rose 500** | `#f43f5e` | Low stock, prices, accents |
| **White** | `#ffffff` | Cards, text |

---

## 6. FONT FAMILIES & WEIGHTS

- **Display Font** (`font-display`): Bold, dramatic headlines (HERO, section titles)
- **Body Font** (`font-body`): Readable body text and descriptions
- **Mono Font** (`font-mono`): Price values (technical/precise appearance)

**Weight Scale:**
- `font-black` (900): Headlines, emphases
- `font-bold` (700): Subheadings, descriptions
- `font-normal` (400): Body text

---

## 7. SPACING & SIZING STANDARDS

### Breakpoints
- **Mobile:** Default
- **Tablet (md):** `768px`
- **Desktop (lg):** `1024px`
- **Large Desktop (xl):** `1280px`

### Border Radius Standards
- **Extra small:** `rounded-xl` (12px)
- **Small:** `rounded-2xl` (16px)
- **Medium:** `rounded-[24px]` (24px)
- **Large:** `rounded-[32px]` (32px)
- **Extra large:** `rounded-[44px]` (44px)
- **Massive:** `rounded-[64px]` (64px)

### Shadows
- `shadow-lg`: Medium depth
- `shadow-2xl`: Large depth (hero, cards)
- `shadow-xl`: Cards and containers

---

## 8. ANIMATIONS & TRANSITIONS

- **Duration standards:**
  - Quick interactions: `300ms`
  - Page transitions: `500ms`
  - Smooth reveals: `1000ms`
  - Hero zoom: `10000ms` (very slow)

- **Easing:**
  - Default: ease-in-out
  - Linear: Scale transitions
  - EaseOut: Entrance animations

- **Common animations:**
  - Fade + scale on mount
  - Slide up + fade on scroll reveal
  - Zoom on hover
  - Smooth height/width changes

---

## 9. INTERACTIVE PATTERNS

### Hover States
- Elevate with `-translate-y-3`
- Scale icons on hover with rotation
- Color shifts to mint for active/hovered states
- Border and shadow enhancements

### Active States
- Scale down: `active:scale-95`
- Immediate feedback

### Loading States
- `animate-pulse` background
- Skeleton matching component shape
- Smooth skeleton loaders

### Authentication Guards
- Hide sensitive prices behind "Locked Rate"
- Require login before actions
- Redirect to login on interaction

---

## 10. Typography Scale

| Element | Mobile | Desktop | Weight | Color |
|---------|--------|---------|--------|-------|
| Hero Title | 4xl | 7xl | black | white |
| Hero Subtitle | sm | xl | bold | white/70 |
| Section Title | 3xl | 5xl | black | slate-900 |
| Section Subtitle | xs | sm | bold | slate-400 |
| Card Title | 11px | lg | black | slate-900 |
| Card Description | 8px | 9px | bold | slate-300 |
| Filter Label | 10px | 10px | black | varies |
| Button Text | xs-base | base | black | varies |

---

## 11. SEARCH BAR STYLING
**File:** `SearchBar.tsx`

- **Placeholder:** "Filter catalog by name, SKU, or tag..."
- **Styling:** Light, minimal with focus states
- **Integration:** Updates search state in real-time with debouncing (350ms)

---

## 12. PAGINATION COMPONENT
**File:** `Pagination.tsx`

- **Items per page:** 10 (mobile), 20 (desktop)
- **Navigation:** Page buttons with current page highlight
- **Scroll behavior:** Smooth scroll to grid on page change

---

## Key Design Principles

1. **Bold, Minimalist:** Large typography, generous whitespace
2. **Industrial aesthetic:** Dark slate base with mint accents
3. **Performance-focused:** Lazy loading, skeleton screens, virtual scrolling
4. **Responsive-first:** Mobile optimized, scales beautifully
5. **Interactive storytelling:** Smooth animations guide user attention
6. **Accessibility:** Semantic HTML, high contrast, motion preferences respected
7. **Micro-interactions:** Hover states, loading states, error states all considered

---

## Implementation Notes

- **Framework:** React 19.2.4 with TypeScript
- **UI Library:** Framer Motion for animations, Lucide React for icons
- **Styling:** Tailwind CSS with custom color tokens
- **Performance:** React.memo for card optimization, virtual scrolling for grids
- **State Management:** React Context for auth, discovery mode
- **API Integration:** Debounced search, paginated product fetching
