---
name: design-system-pixs
description: Creates implementation-ready design-system guidance
  with tokens, component behavior, and accessibility standards for
  PIXS Printing Shop. Use when creating or updating UI rules,
  component specifications, design-system documentation, or
  reviewing component implementations for token compliance.
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

<!-- PIXS_DS_MANAGED_START -->

# PIXS Printing Shop — Design System

## Mission

Deliver implementation-ready design-system guidance for PIXS
Printing Shop that is applied consistently across the
customer-facing React SPA: Homepage, DiscoveryModal,
ProductDetailPage, AddToCartPage, and CheckoutPage.

## Brand

- Product/brand: PIXS Printing Shop
- URL: http://localhost:5173 (local dev) / pixs.ph (production)
- Audience: business owners and brand managers ordering bulk
  printed packaging (milk tea cups, lids, boxes)
- Product surface: customer-facing React 18 + TypeScript SPA
  (Vite · TailwindCSS · Framer Motion · GSAP
  · lucide-react · lottie-web)
- Design character: Industrial Editorial — precision printing,
  premium craft, B2B confidence

## Style Foundations

- Visual style: light mode only, warm white surface, near-black
  type hierarchy, electric mint accent
- Display font: Syne (weight 700–900) — headings, labels, badges
- Body font: Plus Jakarta Sans (weight 400–700) — descriptions,
  body copy, UI labels
- Mono font: JetBrains Mono — prices, IDs, stock numbers

- font.size.base = 16px
- font.weight.base = 400
- font.lineHeight.base = 1.7
- font.size.xs = 9px
- font.size.sm = 11px
- font.size.md = 13px
- font.size.lg = 16px
- font.size.xl = 20px
- font.size.2xl = 28px
- font.size.3xl = 40px
- font.size.4xl = 56px

- color.text.primary = #0f172a (slate-900)
- color.text.secondary = #94a3b8 (slate-400)
- color.text.muted = #cbd5e1 (slate-300)
- color.text.accent = #16a34a (green-600 — accessible on white)
- color.text.danger = #f43f5e (rose-500)
- color.text.on-dark = #ffffff

- color.surface.page = #f8fafc (slate-50)
- color.surface.card = #ffffff
- color.surface.input = #f8fafc
- color.surface.overlay = #0f172a (slate-900)
- color.surface.skeleton= #f1f5f9 (slate-100)

- color.border.default = #f1f5f9 (slate-100)
- color.border.input = #e2e8f0 (slate-200)
- color.border.focus = #75EEA5 (pixs-mint)
- color.border.selected = #75EEA5 (pixs-mint)
- color.border.error = #f43f5e (rose-500)

- color.accent.primary = #75EEA5 (pixs-mint — borders, glows, hovers)
- color.accent.glow = rgba(117,238,165,0.25)

- space.1 = 4px | space.2 = 8px | space.3 = 12px
- space.4 = 16px | space.5 = 20px | space.6 = 24px
- space.7 = 32px | space.8 = 48px | space.9 = 64px | space.10 = 96px

- radius.xs = 12px | radius.sm = 16px | radius.md = 24px
- radius.lg = 32px | radius.xl = 44px | radius.2xl = 64px
- radius.full = 9999px

- shadow.sm = 0 1px 3px rgba(15,23,42,0.08)
- shadow.md = 0 4px 16px rgba(15,23,42,0.08)
- shadow.lg = 0 8px 32px rgba(15,23,42,0.10)
- shadow.xl = 0 16px 48px rgba(15,23,42,0.12)
- shadow.inner = inset 0 2px 8px rgba(15,23,42,0.06)
- shadow.mint = 0 0 16px rgba(117,238,165,0.30)

- motion.duration.instant = 150ms
- motion.duration.fast = 300ms
- motion.duration.normal = 500ms
- motion.duration.slow = 800ms
- motion.easing.spring = cubic-bezier(0.16, 1, 0.3, 1)
- motion.easing.standard = cubic-bezier(0.4, 0, 0.2, 1)

## Accessibility

- Target: WCAG 2.2 AA — light mode only
- Keyboard-first interactions required
- Focus-visible: 2px solid color.border.focus (pixs-mint) offset 2px
- Contrast rules:
  color.text.primary on color.surface.page → 16.3:1 ✓ PASS
  color.text.secondary on color.surface.card → 4.6:1 ✓ PASS
  color.text.accent on color.surface.card → 5.1:1 ✓ PASS
  color.accent.primary as TEXT on white → 1.7:1 ✗ FAIL
  → pixs-mint (#75EEA5) must never be used as text color on white
  → Use color.text.accent (#16a34a) for green accessible text
  color.text.danger on color.surface.card → 5.2:1 ✓ PASS
- Touch targets: 44×44px minimum
- Color must never be the sole state indicator
- Stock status must use text + color (not color alone)
- Price displays must use font-mono for screen-reader clarity

## Writing Tone

Concise. Confident. Industrial. Every label uppercase.
Every action decisive. No softening language.

Examples:
✓ "Add to Cart" ✗ "Add item to your cart"
✓ "Out of Stock" ✗ "This item is currently unavailable"
✓ "Remove" ✗ "Remove this item"
✓ "Proceed to Checkout" ✗ "Continue to checkout page"
✓ "500 Units Available" ✗ "500 in stock"
✓ "Locked Rate" ✗ "Please log in to see price"
✓ "Null Sequence Found" ✗ "No results found"

## Rules: Do

- Use semantic tokens. Zero raw hex values in component files.
- Every component must define:
  default · hover · focus-visible · active · disabled · loading · error
- All display/heading text: uppercase + italic + font-black (Syne 900)
- All micro-labels: uppercase + tracking-widest + font-black
- All prices: font-mono + font-black + italic
- All stock indicators: color.accent.stock-ok/low + text description
- Responsive behavior must be specified at every breakpoint:
  mobile: 320px–767px | tablet: 768px–1023px | desktop: 1024px+
- Touch targets must be minimum 44×44px
- Scroll animations must use IntersectionObserver (never scroll listeners)
- Skeleton loading must use Lottie (skeleton-loading.json)
  NOT CSS animate-pulse (unless Lottie is unavailable)
- ProductImage component must be used for all product/category images
  (handles failedSrcs Set + Lottie skeleton + error state)
- Multi-table API calls in Laravel must use DB::transaction() + rollback

## Rules: Don't

- Do not use pixs-mint (#75EEA5) as body/label text on white — contrast fail
- Do not use pure white (#fff) as page bg — use color.surface.page
- Do not use pure black (#000) — use color.text.primary
- Do not use Inter, Roboto, Open Sans, Arial as display fonts
- Do not use purple gradient on any surface
- Do not animate layout-triggering CSS properties (top, width, height)
  — only transform and opacity
- Do not remove focus-visible outline without providing equivalent
- Do not use scroll event listeners
- Do not add layout prop to Framer Motion divs in scroll areas
- Do not use raw onError src-swap on <img> tags
- Do not define component-level spacing with magic numbers
- Do not ship a component without all 7 state definitions
- Do not introduce competing libraries when existing ones cover the need

## Guideline Authoring Workflow

1. Restate design intent in one sentence.
2. Define foundations and semantic tokens used by this component.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with testable pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Required Output Structure

- Context and goals
- Design tokens and foundations
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- QA checklist

## Component Rule Expectations

- Include keyboard, pointer, and touch behavior
- Include spacing and typography token requirements
- Include long-content, overflow, and empty-state handling
- Include known page component density:
  Homepage:
  HeroSlides (3) · CategoryCards (5) · FilterDropdowns (5)
  SearchBar (1) · ProductCards (20 max) · PaginationButtons (~10)
  AddToCartPage:
  CartCards (variable) · ColorSwatches (1–3 per card)
  QuantitySteppers (1 per card) · SummaryPanel (1)
  DiscoveryModal:
  CategoryCards (all) · ProductResultCards (≤50) · SearchInput (1)
  ProductDetailPage:
  VariantSelector · ColorChannelPicker · QuantityStepper
  ScreenplateSelector · AddToCartButton
- Component interaction contracts:
  DiscoveryModal ← CustomerNavbar (search icon)
  DiscoveryModal ← Homepage CategoryCard (cat.id = CT001 format)
  ProductDetailPage → cart_items + cart_item_colors (CREATE)
  AddToCartPage → cart_items + cart_item_colors (READ/UPDATE/DELETE)

## Quality Gates

- Every non-negotiable rule must use "must"
- Every recommendation should use "should"
- Every accessibility rule must be testable in implementation
- Teams must prefer system consistency over local visual exceptions
- Raw hex values in component files are a build-blocking violation
- Missing state definitions are a build-blocking violation
- Using pixs-mint as text on white is a build-blocking contrast violation
- Missing failedSrcs guard on image components is a build-blocking
  performance violation (causes infinite network retry loop)

<!-- PIXS_DS_MANAGED_END -->
