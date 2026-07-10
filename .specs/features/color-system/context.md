# Color Design System Context

**Gathered:** 2026-07-09
**Spec:** `.specs/features/color-system/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Define the full color token layer (primitive + semantic) for RentityX, covering brand identity, feedback states, rental/item status, and category color-coding, integrated with Tailwind CSS v4 and supporting light/dark mode with WCAG AA contrast from day one.

---

## Implementation Decisions

### Brand personality

- Personality is **trust & security** — primary brand color is blue-based, supported by neutral grays. This is the standard, proven choice for marketplaces/fintech-adjacent products handling transactions and personal data (reinforced by the LGPD-sensitive auth API in `api-contracts.md`).

### Brand color origin

- No existing brand color/logo guideline exists yet. The agent proposes the primary/secondary palette from scratch, free to choose the specific blue hue and full scale.

### Dark mode priority

- Dark mode is **first-class from day one**, not a later addition. Every semantic token must be specified for both light and dark simultaneously; nothing ships light-only.

### Accessibility target

- **WCAG AA** (4.5:1 normal text, 3:1 large text/icons) is the bar — not AAA. This keeps enough palette flexibility for a vibrant marketplace UI while still being broadly inclusive.

### Rental/item status colors

- Dedicated status tokens are required — NOT a reuse of the generic success/warning/error/info tokens. Statuses: **available, reserved, rented, unavailable, overdue**. Each needs its own recognizable hue, distinct from generic feedback colors, distinct from brand and accent.

### Category color-coding

- Categories (tools, electronics, vehicles, real estate, events, etc.) **do get their own badge colors** — user explicitly chose color-per-category over a neutral/icon-only approach, despite the scalability trade-off flagged during discussion.
- Constraint carried into design: because "de tudo" (rent-everything) implies an open-ended, growing category list, the design must use a **fixed, finite palette of category slots** (not one arbitrary color generated per category name) with a documented assignment/fallback strategy, per spec edge case COLOR-04.

### Secondary accent

- A secondary accent color (distinct from the brand blue) is wanted, reserved for high-conversion CTAs ("Rent now", "Book") and "featured" promo badges — not for routine navigation, links, or chrome.

---

## Agent's Discretion

- Exact hue/value choice for brand blue, accent, category palette, and status colors (within the "trust & security" personality and AA contrast constraints).
- Specific mechanism for dark mode activation (OS-preference-only vs. class-based manual toggle) — not discussed with the user; the agent will pick the standard, most flexible approach (class-based `.dark` toggle that defaults to OS preference) and document the rationale in design.md.
- Token naming conventions and file/folder organization within `src/styles.css` / `shared/`.
- Exact category → color slot assignment algorithm (e.g. round-robin vs. manual curated map).

---

## Specific References

None — no existing brand deck, competitor reference, or specific "make it look like X" request came up. Open to a standard, professional marketplace palette.

---

## Deferred Ideas

- Per-tenant/white-label theming — out of scope per spec.md, noted here only because it's a natural extension of a token-based system if RentityX ever needs multi-brand support.
- Theme picker UI beyond basic light/dark — deferred; today's scope is just making the toggle mechanism exist, not designing a settings UI for it.
