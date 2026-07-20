# Roadmap

## Phase 1 - Foundation
- [x] Initialize Angular workspace shell.
- [x] Create project spec files.
- [x] Scaffold core, shared, and feature placeholders. — superseded, see `STATE.md` Todos.
- [x] Verify build and tests. — superseded, see `STATE.md` Todos (verified per task list since).

## Phase 2 - Feature Expansion
- Add domain-specific feature modules and UI components.
- Add shared layout and state-management patterns.
- Color design system (spec + design done, see `.specs/features/color-system/`): Tailwind v4 tokens, light/dark mode, rental-status colors, category badges — implementation pending.
- Identity feature (spec + context + design + tasks done, see `.specs/features/identity/`): register, verify-email, login, refresh, logout, forgot/reset password, profile, LGPD data export/delete — 21 tasks planned, implementation pending. Blocked on one open decision (token storage mechanism) for task T6 only.
- Backend integration alignment (2026-07-17): mapped real `rentifyx-identity-api`/`rentifyx-communications-api` contracts (`.specs/codebase/INTEGRATIONS.md`). `IDENT-10` — fix `iUserResponse`/`iDataExportResponse` consent-field drift + build `GET/PUT /users/me/consent` UI — task breakdown "Consent Alignment" (C1–C6) in `.specs/features/identity/tasks.md`, **implemented and verified**. `communications-api` direct integration explicitly deferred (unsafe `X-Api-Key` in an SPA, no HTTP send endpoint, no real-time channel) until a BFF exists.
- Layout shell (2026-07-17 planned, 2026-07-20 implemented, see `.specs/features/layout-shell/`): shared header+footer (`SHELL-01`–`SHELL-03`) wrapping every route, closing the "no footer, no shared nav" gap noticed after the identity work. Task breakdown L1–L4, **implemented and verified**.
