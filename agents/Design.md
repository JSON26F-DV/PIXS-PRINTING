# PIXS — Design System Agent Prompt v1.0

# File: .typeui/config.yml OR /myagents/design-system-pixs.md

# ─────────────────────────────────────────────────────────────

# PROMPT 1 — Mission Config (typeui-style, equivalent to Maya–E block)

# ─────────────────────────────────────────────────────────────

## Mission

Create implementation-ready, token-driven UI guidance for PIXS
Printing Shop that is optimized for consistency, accessibility,
and fast delivery across the customer-facing web app
(Homepage, Cart, Product Detail, Discovery Modal).

## Brand

- Product/brand: PIXS Printing Shop
- Audience: business owners, milk tea franchise operators,
  local brand managers ordering bulk printed packaging
- Product surface: customer-facing React SPA
  (Homepage · DiscoveryModal · ProductDetail
  · AddToCartPage · CheckoutPage)
- Design character: Industrial Editorial — precision, craft,
  premium manufacturing. Not playful. Not SaaS.

## Style Foundations

- Visual style: light mode only — warm white base, near-black
  type, electric mint accent
- Main font style:
  font.family.display = Syne, sans-serif
  font.family.body = Plus Jakarta Sans, sans-serif
  font.family.mono = JetBrains Mono, monospace
  font.size.base = 16px
  font.weight.base = 400
  font.lineHeight.base = 1.7

- Typography scale:
  font.size.xs = 9px (badge labels, micro-captions)
  font.size.sm = 11px (card sub-labels, timestamps)
  font.size.md = 13px (body copy, descriptions)
  font.size.lg = 16px (default body)
  font.size.xl = 20px (section sub-headings)
  font.size.2xl = 28px (card headings)
  font.size.3xl = 40px (section titles)
  font.size.4xl = 56px (hero display)

- Typography modifiers (PIXS-specific):
  text.transform.display = uppercase
  text.style.display = italic
  text.tracking.display = tracking-tighter
  text.tracking.label = tracking-widest
  text.weight.display = 900 (font-black)
  text.weight.label = 900 (font-black)

- Color palette (LIGHT MODE ONLY):
  color.text.primary = #0f172a (slate-900 — headings, body)
  color.text.secondary = #94a3b8 (slate-400 — labels, captions)
  color.text.muted = #cbd5e1 (slate-300 — italic descriptions)
  color.text.accent = #16a34a (green-600 — accessible mint on light)
  color.text.danger = #f43f5e (rose-500 — low stock, errors)
  color.text.on-dark = #ffffff (white — text on slate-900 surfaces)

  color.surface.page = #f8fafc (slate-50 — page background)
  color.surface.card = #ffffff (white — card background)
  color.surface.input = #f8fafc (slate-50 — input background)
  color.surface.overlay = #0f172a (slate-900 — modal/button dark bg)
  color.surface.skeleton = #f1f5f9 (slate-100 — skeleton/pulse bg)

  color.border.default = #f1f5f9 (slate-100 — card borders)
  color.border.input = #e2e8f0 (slate-200 — input borders)
  color.border.focus = #75EEA5 (pixs-mint — focus ring)
  color.border.selected = #75EEA5 (pixs-mint — selected state)
  color.border.error = #f43f5e (rose-500)

  color.accent.primary = #75EEA5 (pixs-mint — CTA hover, glow, accents)
  color.accent.glow = rgba(117,238,165,0.25) (mint glow shadow)
  color.accent.stock-ok = #0f172a (slate-900 bg — in-stock badge)
  color.accent.stock-low = #f43f5e (rose-500 bg — low stock badge)

  color.status.success = #16a34a (green-600)
  color.status.error = #f43f5e (rose-500)
  color.status.warning = #f59e0b (amber-500)

- Spacing scale:
  space.1 = 4px
  space.2 = 8px
  space.3 = 12px
  space.4 = 16px
  space.5 = 20px
  space.6 = 24px
  space.7 = 32px
  space.8 = 48px
  space.9 = 64px
  space.10 = 96px

- Radius tokens:
  radius.xs = 12px (badges, tags)
  radius.sm = 16px (buttons, inputs, small cards)
  radius.md = 24px (inner image containers)
  radius.lg = 32px (product cards — mobile)
  radius.xl = 44px (product cards — desktop)
  radius.2xl = 64px (hero container, modal)
  radius.full = 9999px (color swatches, avatar circles)

- Shadow tokens:
  shadow.sm = 0 1px 3px rgba(15,23,42,0.08)
  shadow.md = 0 4px 16px rgba(15,23,42,0.08)
  shadow.lg = 0 8px 32px rgba(15,23,42,0.10)
  shadow.xl = 0 16px 48px rgba(15,23,42,0.12)
  shadow.inner = inset 0 2px 8px rgba(15,23,42,0.06)
  shadow.mint = 0 0 16px rgba(117,238,165,0.30)

- Motion tokens:
  motion.duration.instant = 150ms
  motion.duration.fast = 300ms
  motion.duration.normal = 500ms
  motion.duration.slow = 800ms
  motion.easing.standard = cubic-bezier(0.4, 0, 0.2, 1)
  motion.easing.exit = cubic-bezier(0.4, 0, 1, 1)
  motion.easing.enter = cubic-bezier(0, 0, 0.2, 1)
  motion.easing.spring = cubic-bezier(0.16, 1, 0.3, 1)

- Z-index scale:
  z.base = 0
  z.raised = 10
  z.dropdown = 100
  z.sticky = 200
  z.overlay = 300
  z.modal = 400
  z.toast = 500
  z.tooltip = 600

## Accessibility

- Target: WCAG 2.2 AA
- Keyboard-first interactions required
- Focus-visible rules required (color.border.focus ring, 2px solid)
- Contrast constraints:
  Normal text: min 4.5:1 against surface
  Large text (≥18px bold or ≥24px): min 3:1
  color.text.primary on color.surface.page = 16.3:1 ✓
  color.accent.primary on color.surface.card = 1.7:1 ✗
  → NEVER use pixs-mint as text color on white
  → Only use as border, background, or decorative element
  color.text.accent on color.surface.card = 5.1:1 ✓
  → Use color.text.accent for accessible green text labels

## Writing Tone

Concise. Confident. Industrial. Technical precision without cold
sterility. Every label is uppercase. Every action is decisive.
No softening words. No "please" or "perhaps."

## Rules: Do

- Use semantic tokens, not raw hex values, in all component guidance
- Every component must define states:
  default · hover · focus-visible · active · disabled · loading · error
- Responsive behavior must be specified for every component family
- Interactive components must document keyboard, pointer, and touch behavior
- Accessibility acceptance criteria must be testable in implementation
- All display text must be uppercase + italic + font-black
- All label text must be uppercase + tracking-widest + font-black
- Touch targets must be minimum 44×44px
- Color swatches must show hex value in tooltip (accessibility)
- Prices must use font-mono + font-black + italic
- Stock indicators must use both color AND text (never color alone)

## Rules: Don't

- Never use pixs-mint (#75EEA5) as body text color on white — fails contrast
- Never use pure white (#fff) as page background — use color.surface.page
- Never use pure black (#000) — use color.text.primary (#0f172a)
- Never use Inter, Roboto, or Arial as display fonts
- Never use purple gradient on any background
- Never use layout-triggering CSS animations (top, left, width, height)
  — only animate transform and opacity
- Never remove focus-visible outline without providing an equivalent
- Never use color as the sole state indicator
- Never use scroll event listeners — use IntersectionObserver
- Never define raw margin/padding values — use space tokens
- Never add a layout prop to Framer Motion divs inside scroll areas
- Never use onError src-swap on img elements — use ProductImage component
- Never use inline arrow functions as JSX props passed to React.memo children

## Guideline Authoring Workflow

1. Restate design intent in one sentence.
2. Define foundations and semantic tokens used by this component.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
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
  Homepage: ProductCards (20 max), CategoryCards (5),
  FilterDropdowns (5), HeroSlides (3),
  SearchBar (1), PaginationButtons (~10)
  AddToCartPage: CartCards (variable), ColorSwatches (1–3 per card),
  QuantitySteppers (1 per card), OrderSummary (1)
  DiscoveryModal: CategoryCards (all), ProductResultCards (≤50),
  SearchInput (1)

## Quality Gates

- Every non-negotiable rule must use "must"
- Every recommendation should use "should"
- Every accessibility rule must be testable in implementation
- Teams must prefer system consistency over local visual exceptions
- Raw hex values in component files are a build-blocking violation
- Missing state definitions (hover/focus/disabled) are a build-blocking violation
