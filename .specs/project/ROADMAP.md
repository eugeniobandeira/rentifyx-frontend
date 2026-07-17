# Roadmap

## Phase 1 - Foundation
- [x] Initialize Angular workspace shell.
- [x] Create project spec files.
- [ ] Scaffold core, shared, and feature placeholders.
- [ ] Verify build and tests.

## Phase 2 - Feature Expansion
- Add domain-specific feature modules and UI components.
- Add shared layout and state-management patterns.
- Color design system (spec + design done, see `.specs/features/color-system/`): Tailwind v4 tokens, light/dark mode, rental-status colors, category badges — implementation pending.
- Identity feature (spec + context + design + tasks done, see `.specs/features/identity/`): register, verify-email, login, refresh, logout, forgot/reset password, profile, LGPD data export/delete — 21 tasks planned, implementation pending. Blocked on one open decision (token storage mechanism) for task T6 only.
- Backend integration alignment (2026-07-17): mapped real `rentifyx-identity-api`/`rentifyx-communications-api` contracts (`.specs/codebase/INTEGRATIONS.md`). `IDENT-10` — fix `iUserResponse`/`iDataExportResponse` consent-field drift + build `GET/PUT /users/me/consent` UI — task breakdown "Consent Alignment" (C1–C6) in `.specs/features/identity/tasks.md`, **implemented and verified**. `communications-api` direct integration explicitly deferred (unsafe `X-Api-Key` in an SPA, no HTTP send endpoint, no real-time channel) until a BFF exists.
