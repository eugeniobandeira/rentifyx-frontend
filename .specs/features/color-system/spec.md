# Color Design System Specification

## Problem Statement

RentityX has no defined color system today — `src/styles.css` only imports Tailwind's defaults and the one existing page (`HomePage`) uses ad-hoc inline hex colors. As real features (auth, listings, bookings, admin, security) are built out per `estrutura.md`, every new component would otherwise invent its own colors, producing visual inconsistency, broken dark mode, and accessibility regressions. We need a token-based color system, integrated with Tailwind CSS v4, that every future feature consumes instead of hardcoding hex values.

## Goals

- [ ] Define a layered token system (primitive → semantic) covering brand, accent, neutrals, feedback states, rental-domain status, and item categories.
- [ ] Guarantee WCAG AA contrast (4.5:1 text / 3:1 large text & icons) for every text/background pairing, in both light and dark mode.
- [ ] Support marketplace-specific semantics — rental/item status (available, reserved, rented, unavailable, overdue) and category color-coding — without unbounded token growth.
- [ ] Integrate natively with Tailwind CSS v4's CSS-first `@theme` model so tokens are consumable as ordinary utility classes (`bg-brand-500`, `text-status-available`, etc.), matching the Tailwind-first convention already documented in `CLAUDE.md`.
- [ ] Make dark mode a first-class, from-day-one target — no token may be defined for light mode only.

## Out of Scope

| Feature | Reason |
|---|---|
| Typography scale, spacing/elevation tokens | Separate design-system concerns, not color |
| Logo/brand mark design | No brand designer input yet; this spec only defines the color palette |
| Actual page/component visual redesign | This spec defines the token layer only; consuming it in real features happens per-feature later |
| Theme picker UI (beyond a basic light/dark toggle mechanism) | No multi-theme (e.g. brand skins) requirement today |
| Per-tenant/white-label theming | Not a current product requirement |

---

## User Stories

### P1: Consistent semantic tokens for developers ⭐ MVP

**User Story**: As a developer building any feature, I want a documented set of semantic color tokens (surface, text, border, brand, accent, feedback) exposed as Tailwind utilities, so that I never hardcode a hex value in a component.

**Why P1**: Every subsequent feature (auth pages, listings, dashboards) depends on this existing first — retrofitting hardcoded colors later is expensive.

**Acceptance Criteria**:
1. WHEN a developer needs a background, text, or border color THEN the system SHALL expose a semantic Tailwind utility class for it (no raw hex in component code).
2. WHEN a new semantic need arises that isn't covered THEN the design SHALL document how to extend the semantic layer without touching primitives.
3. WHEN two different semantic tokens happen to resolve to the same primitive value THEN this SHALL be allowed (tokens decouple meaning from value).

**Independent Test**: Inspect `src/styles.css` `@theme` block and confirm every color used across the app resolves to a named CSS custom property, never a bare hex.

---

### P1: Light/dark mode parity ⭐ MVP

**User Story**: As a user, I want the app to look correct and legible whether I'm in light or dark mode, so that my system preference is respected without broken contrast.

**Why P1**: Dark mode was explicitly requested as first-class from the start (see context.md); shipping light-only now means a full re-audit later.

**Acceptance Criteria**:
1. WHEN the OS/user preference is dark THEN all semantic tokens SHALL resolve to dark-mode-safe values automatically.
2. WHEN a component is styled using only semantic tokens THEN it SHALL require zero `dark:` overrides in component templates (the swap happens centrally in `styles.css`).
3. WHEN contrast is measured for any text/background semantic pair THEN it SHALL meet WCAG AA in both modes.

**Independent Test**: Toggle OS/system dark mode (or the app's `.dark` class) and confirm the Home page and any UI kit components re-render with correct contrast with no additional per-component code changes.

---

### P1: Rental/item status color coding ⭐ MVP

**User Story**: As a user browsing or managing listings, I want an item or booking's status (available, reserved, rented, unavailable, overdue) to be visually distinguishable at a glance via consistent color coding, so I can scan listings quickly.

**Why P1**: This is the core domain of the product (rentals) — status legibility is a functional requirement, not just aesthetic.

**Acceptance Criteria**:
1. WHEN an item/booking has a status THEN the system SHALL render it with a dedicated status token (not reused ad hoc from generic feedback colors) with a defined background + foreground pair.
2. WHEN status colors are displayed as a badge/chip THEN the text/icon on top SHALL meet WCAG AA contrast against the badge background.
3. WHEN a status has no mapped token (future new status) THEN the system SHALL fall back to the neutral/unavailable token rather than an undefined color.

**Independent Test**: Render a mock list of items with all 5 statuses and confirm each renders a visually distinct, accessible badge in both light and dark mode.

---

### P2: Category color-coding

**User Story**: As a user browsing a marketplace that rents "everything," I want each item category (tools, electronics, vehicles, real estate, events...) to have a recognizable color badge, so I can visually scan and filter listings faster.

**Why P2**: Valuable for scanability at scale, but the app doesn't have real category data or listing UI yet — can ship after P1 status colors land.

**Acceptance Criteria**:
1. WHEN a category is assigned a color THEN it SHALL come from a fixed, finite palette of category tokens (not an arbitrary/generated color per category name).
2. WHEN more categories exist than color slots THEN the system SHALL define a documented fallback/reuse strategy (round-robin or neutral fallback) rather than growing the token set indefinitely.
3. WHEN a category badge is rendered THEN its text/icon SHALL meet WCAG AA contrast against its background in both light and dark mode.

**Independent Test**: Map 12+ hypothetical categories against the fixed palette and confirm the assignment strategy resolves for all of them without inventing new tokens.

---

### P3: Secondary accent for conversion moments

**User Story**: As a product owner, I want a secondary accent color reserved for high-conversion CTAs and "featured" badges, distinct from the primary brand color, so key actions stand out from routine brand-colored chrome.

**Why P3**: Nice-to-have hierarchy improvement; the app has no checkout/CTA flows built yet to consume it.

**Acceptance Criteria**:
1. WHEN a component needs a primary conversion CTA (e.g. "Rent now", "Book") THEN it SHALL use the accent token, not the brand token.
2. WHEN accent is used THEN it SHALL be visually reserved for high-intent actions — the design SHALL document guidance against overuse (e.g. not for routine navigation/links).

**Independent Test**: Review a mock listing page with a primary brand header/nav and one accent-colored "Rent now" button; confirm visual hierarchy separates brand chrome from the conversion action.

---

## Edge Cases

- WHEN text is placed on any brand/accent/status/category colored background THEN system SHALL automatically resolve to a pre-defined "on-color" foreground (black or white variant) guaranteeing AA contrast — never computed at runtime.
- WHEN a component is disabled THEN system SHALL use the dedicated disabled text/border/background tokens, not a lowered-opacity hack applied ad hoc per component.
- WHEN the user's OS has no color-scheme preference (or an unsupported browser) THEN system SHALL default to light mode.
- WHEN a developer is tempted to reference a primitive color directly in a component (e.g. `bg-blue-500`) THEN this SHALL be discouraged in favor of the semantic token (e.g. `bg-brand-default`) so a future rebrand only touches the token layer.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| COLOR-01 | P1: Consistent semantic tokens | Implementing | `src/styles.css` tokens done; no component consumes them yet |
| COLOR-02 | P1: Light/dark mode parity | Implementing | tokens + `ThemeService` done; contrast spot-check pending |
| COLOR-03 | P1: Rental/item status color coding | Implementing | tokens done; no status badge component built yet |
| COLOR-04 | P2: Category color-coding | Implementing | tokens + `category-color.map.ts` done; no chip component built yet |
| COLOR-05 | P3: Secondary accent for conversion | Implementing | tokens done; no CTA component built yet |

**Coverage:** 5 total, 5 mapped to design, 0 unmapped. All 5 have their token layer implemented; none are "Verified" yet since no consuming UI component exists to validate against.

---

## Success Criteria

- [ ] Every color token (primitive + semantic) is documented with its light and dark hex/oklch value.
- [ ] All semantic text/background pairs pass WCAG AA contrast in both modes (spot-checked with contrast ratios in the design doc).
- [ ] The token layer integrates with Tailwind v4's `@theme` directive in `src/styles.css` with zero `tailwind.config.js` needed.
- [ ] A new developer can style a component using only documented semantic classes, without asking "what color do I use here?".
