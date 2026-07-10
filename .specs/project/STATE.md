# State

## Decisions
- Use Angular standalone app architecture.
- Keep the initial structure aligned with the provided blueprint.
- Color system (2026-07-09): trust/security blue brand, orange accent reserved for CTAs, WCAG AA target, first-class dark mode via class-based Tailwind v4 `@custom-variant`, dedicated rental-status tokens (available/reserved/rented/unavailable/overdue), and color-per-category badges using a fixed 8-slot palette + round-robin fallback (accepted scalability trade-off). Full spec/context/design in `.specs/features/color-system/`.
- Identity feature (2026-07-09): full spec + design + 21-task breakdown planned for the auth/session/LGPD surface of `api-contracts.md` (register, verify-email, login, refresh, logout, forgot/reset password, profile, data export/delete). Key decisions: proactive+reactive token refresh (decode `exp`, timer ~60s before expiry, interceptor 401 fallback); route guard redirects to `/login?returnUrl=`; post-register shows a local "check your email" state (no route, no resend — endpoint doesn't exist); no Okta/OAuth reuse from `estrutura.md` (contract is first-party JWT only); auth pages live in `core/pages/*` (register/login/verify-email/forgot-password/reset-password), authenticated profile+LGPD page lives in `features/identity/user/pages/account`; `BaseHttpService`/shared UI kit deliberately NOT built yet (single caller, avoids premature abstraction — revisit when a 2nd feature needs them). **Open/blocking**: token storage mechanism (memory+localStorage vs localStorage vs sessionStorage) was explicitly deferred by the user — flagged in `context.md`, blocks only `TokenStorageService`'s concrete implementation (task T6), everything else in the plan is unblocked. Full spec/context/design/tasks in `.specs/features/identity/`. Not implemented yet (Execute phase not started).

## Todos
- [x] Create project initialization docs.
- [ ] Scaffold placeholder core/shared/feature directories.
- [ ] Verify implementation.
- [x] Implement color-system tokens in `src/styles.css` (`@theme`/`:root`/`.dark`) per `.specs/features/color-system/design.md`. Verified via `npm run build` (compiles, no PostCSS/Tailwind errors).
- [x] Build `ThemeService` (`core/services/theme.service.ts`) for dark-mode toggle + persistence. 3 unit tests passing.
- [x] Build `category-color.map.ts` (`shared/constants/`) for category → color slot assignment. 4 unit tests passing. SPEC_DEVIATION: uses a deterministic slug hash instead of design.md's literal "runningCategoryIndex % 8" round-robin, so the same unmapped category always gets the same slot regardless of fetch order (no shared mutable state needed).
- [ ] Spot-check all status/category/feedback contrast pairs against WCAG AA with a contrast checker before shipping (flagged in design.md as an open verification item — not yet done).
- [ ] Wire `ThemeService`/tokens/category map into an actual component (e.g. a toggle button, a badge component) — nothing consumes them yet, they only exist as the token/service layer.
- [ ] Resolve the open token-storage decision for the identity feature (see `.specs/features/identity/context.md`) before implementing `TokenStorageService` (task T6).
- [ ] Implement the identity feature per `.specs/features/identity/tasks.md` (21 tasks, 6 phases) — planning only done so far, no code written yet.

## Known Issues (not part of color-system scope, found during verification)
- `src/app/app.spec.ts` "should render title" test fails on a clean checkout, unrelated to the color-system work: the test provides `provideRouter([])` (empty routes) instead of the real `routes` from `app.routes.ts`, so `<router-outlet>` never renders `HomePage` and there's no `<h1>` to assert against. Pre-existing, not introduced by this session.
