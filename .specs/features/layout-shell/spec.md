# Layout Shell Specification

## Problem Statement

Every page in the app renders in isolation today. `home.html` has its own inline `<header>` (logo + theme toggle) that no other page shares; every auth page (login/register/forgot-password/reset-password/verify-email/account) has zero chrome — just a centered form on a blank canvas. There is no footer anywhere. `CLAUDE.md`'s Folder convention already documents "the layout shell" as a `core/`-owned concern (alongside guards and interceptors) but it was never built. This makes the product feel inconsistent and unfinished, and gives users no persistent way to navigate (to account, to log out, back to home) outside whatever one page happens to render.

## Goals

- [ ] Ship a single reusable layout shell (`core/layout/`) — header + `<router-outlet>` + footer — that wraps every route, so navigation/branding/theme-toggle are consistent app-wide instead of duplicated or missing per page.
- [ ] Give authenticated users a persistent way to reach their account and log out from any page, not just by navigating to `/account` directly (first real caller of `SessionService.logout()`, which currently has none).
- [ ] Add a footer with copyright + legal-page links, present everywhere, closing the "no footer at all" gap.
- [ ] Remove the header duplication in `home.html` without breaking its existing guest/authenticated hero content or its test suite.

## Out of Scope

| Feature | Reason |
|---|---|
| Actual Terms / Privacy / LGPD policy pages | No content/copy exists yet and no one has been asked to write it. The footer surfaces the links now (per user decision) but they render as non-navigating placeholders until real pages/routes exist — building the pages themselves is separate work. |
| Full site navigation / mega-menu (categories, search, listings) | No other feature (browsing, listings) exists yet to link to. The header nav is intentionally minimal — logo, account, logout, theme — until there's actual product surface to navigate to. |
| Mobile hamburger/drawer navigation | Nav is currently 2–4 items (fits inline at all breakpoints per the mobile-first/360px convention). Revisit only once nav item count grows enough to need collapsing. |
| `not-found`/`access-denied` pages | Mentioned in `CLAUDE.md` as future `core/pages/` residents but not part of this feature — the wildcard route still redirects to `/`. The shell will wrap them once they exist, but building them is separate. |

---

## User Stories

### P1: Consistent header across every page ⭐ MVP

**User Story**: As any visitor, I want the same header (logo, theme toggle, and — once logged in — account/logout) on every page, so the app feels like one product instead of a set of disconnected screens.

**Why P1**: This is the core of the feature — without it there's nothing to demo.

**Acceptance Criteria**:
1. WHEN any route renders (home, auth pages, account) THEN the system SHALL render the same header component above the routed content.
2. WHEN the visitor is not authenticated THEN the header SHALL show the logo, "Entrar" and "Criar conta" links, and the theme toggle — no account/logout controls.
3. WHEN the visitor is authenticated THEN the header SHALL show the logo, a "Minha conta" link (`routerLink="/account"`), a "Sair" (logout) button, and the theme toggle — no "Entrar"/"Criar conta" links.
4. WHEN the user clicks "Sair" THEN the system SHALL call `SessionService.logout()`; once it completes, the existing `App`-level `effect()` (already watching `isAuthenticated()` for a `true → false` transition, see `.specs/features/identity/tasks.md` H4) SHALL redirect to `/login` — the header itself does not navigate.
5. WHEN the theme toggle is clicked THEN the system SHALL call `ThemeService.toggle()`, identical behavior to today's `home.html` toggle, just relocated.

**Independent Test**: Load any route logged out and confirm the header shows logo/Entrar/Criar conta/theme toggle; log in, confirm it switches to logo/Minha conta/Sair/theme toggle on every route including auth-page URLs typed directly; click Sair and confirm redirect to `/login`.

---

### P1: Footer on every page ⭐ MVP

**User Story**: As any visitor, I want to see a footer with copyright and legal links, so the site doesn't feel like it's missing basic chrome.

**Why P1**: Directly closes the gap that prompted this feature (no footer existed at all); trivial to ship alongside the header since both live in the same shell component.

**Acceptance Criteria**:
1. WHEN any route renders THEN the system SHALL render a footer below the routed content showing "© RentityX {current year}".
2. WHEN the footer renders THEN it SHALL also show "Termos" and "Privacidade" as visible but non-interactive text (not `<a>` tags, since no such routes/pages exist yet) — see `context.md` for why plain text was chosen over dead links.

**Independent Test**: Load any route and confirm the footer is present with the current year and both legal labels visible (not clickable).

---

### P1: Shell wraps every route, including auth pages ⭐ MVP

**User Story**: As a visitor filling out login/register/forgot-password/reset-password/verify-email, I want the same header/footer as the rest of the site, so the auth flow doesn't feel like a separate, unbranded product.

**Why P1**: User decision (confirmed): the shell wraps all routes, not just home/account. Without this, half the app would still be chrome-less.

**Acceptance Criteria**:
1. WHEN a visitor navigates to `/login`, `/register`, `/forgot-password`, `/reset-password`, or `/verify-email` THEN the system SHALL render the shared header and footer around the existing centered-form layout of each page, with no change to the forms themselves.

**Independent Test**: Visit each auth route directly by URL and confirm header+footer render around the existing form.

---

## Edge Cases

- WHEN the app is restoring a session on bootstrap (`SessionService.isRestoringSession()` is `true`) THEN the header SHALL render in its logged-out state (no flash of account/logout controls that then disappear) until restoration resolves — matching the existing `app.html` restoring-session guard, not duplicating a second loading state inside the shell itself.
- WHEN the app is server-rendering (SSR) THEN the shell SHALL render without error for both authenticated and unauthenticated states (no browser-only API called outside a browser-guard, matching `ThemeService`'s existing `PLATFORM_ID` check).
- WHEN `SessionService.logout()`'s network call fails THEN the session SHALL still clear locally (already `SessionService`'s existing behavior — `catchError` swallows the failure) and the header SHALL not show an error state; logout is treated as always-succeeds from the UI's perspective, matching `IDENT-04`'s existing idempotent-logout behavior.
- WHEN the footer's current year is computed THEN it SHALL use the browser's actual current date, not a hardcoded value that goes stale.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| SHELL-01 | P1: Consistent header across every page | Pending | New feature, spawned from a design-gap conversation (2026-07-17) — no footer, no shared header existed anywhere in the app. |
| SHELL-02 | P1: Footer on every page | Pending | Same origin as SHELL-01. |
| SHELL-03 | P1: Shell wraps every route, including auth pages | Pending | Same origin as SHELL-01; scope confirmed via user decision (all routes, not just non-auth). |

**ID format:** `SHELL-[NUMBER]`
**Status values:** Pending → In Design → In Tasks → Implementing → Verified
**Coverage:** 3 total, 0 implemented.

---

## Success Criteria

- [ ] Every route (including auth pages) renders the same header and footer, sourced from one shared component — no page defines its own header/footer markup.
- [ ] `home.html`'s inline header is removed with no loss of existing tested behavior (theme toggle still works, `home.spec.ts` still passes with updated assertions if needed).
- [ ] `SessionService.logout()` has a real caller for the first time, reachable from any authenticated page.
- [ ] No new lint violations; strict TypeScript compiles; mobile-first at ~360px (header/footer don't overflow or break at narrow viewports).
