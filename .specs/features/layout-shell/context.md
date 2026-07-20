# Layout Shell Context

**Gathered:** 2026-07-17
**Spec:** `.specs/features/layout-shell/spec.md`
**Status:** Ready for design

---

## Feature Boundary

A single reusable header+footer shell in `core/layout/`, wrapping every route (including auth pages), replacing `home.html`'s inline header and closing the "no footer anywhere" gap.

---

## Implementation Decisions

### Shell scope

- The shell wraps **all routes**, including `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` — not just `/` and `/account`. Chosen over leaving auth pages chrome-less, for visual consistency across the whole product.

### Header content

- **Authenticated**: logo (links to `/`) + "Minha conta" link (`routerLink="/account"`) + "Sair" (logout) button + theme toggle.
- **Unauthenticated**: logo + "Entrar" + "Criar conta" links + theme toggle. No account/logout controls.
- "Sair" calls `SessionService.logout()` directly — no navigation call in the header itself; the existing `App`-level `effect()` (H4 in the identity feature) already redirects to `/login` on the `isAuthenticated()` `true → false` transition. This is the first real caller of `SessionService.logout()`.
- Theme toggle relocates from `home.html` into the shared header, same `ThemeService.toggle()` call, same visual toggle behavior — just one instance instead of one per page.

### Footer content

- "© RentityX {current year}" (computed at render time, not hardcoded) + "Termos" and "Privacidade" labels.
- **Agent's discretion applied**: since no Terms/Privacy pages or routes exist yet, these two labels render as plain, non-interactive text (not `<a href="#">` placeholders) — avoids shipping dead links or fake anchors. Revisit once those pages are actually built (tracked as a deferred idea below).

### Agent's Discretion

- Exact header/footer visual styling (spacing, borders, sticky vs static header) — follow the color-system's existing tokens (`bg-bg-surface`, `border-border-default`, `text-text-secondary`, etc.) and the mobile-first convention already used in `home.html`; no new tokens needed.
- Whether the header is `position: sticky` or scrolls with the page — not specified by the user, agent's call during implementation (lean toward static/non-sticky to keep this minimal, since sticky-header scroll-shadow behavior is its own small design surface not discussed here).

---

## Specific References

No specific visual reference given (no "make it look like X" moment) — user was reacting to the *absence* of a footer/shared header, not to a specific competing design. Build using the existing color-system tokens and the header markup already prototyped in `home.html` (logo left, controls right, `flex items-center justify-between`) as the starting point.

---

## Deferred Ideas

- Full site navigation (categories, search, listings) — explicitly out of scope in `spec.md`, revisit once browsing/listing features exist.
- Mobile hamburger/drawer nav — revisit if the header's item count grows past what fits inline at ~360px.
- Actual Terms/Privacy/LGPD pages with real routes — once built, the footer's plain-text labels should become real `routerLink`s.
- `not-found`/`access-denied` pages (mentioned in `CLAUDE.md`, never built) — the shell will wrap them once they exist, but building them wasn't discussed here and isn't part of this feature.
