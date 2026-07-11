# Identity Tasks

**Design**: `.specs/features/identity/design.md`
**Status**: T1–T21 implemented (see `.specs/project/STATE.md`). Migration section (M1–M4, httpOnly refresh-cookie contract revision) implemented and verified 2026-07-11 — full suite (91/92, sole failure pre-existing/unrelated) + build green. Hardening section (H1–H12, state ownership/routing decoupling/composable extraction/listener cleanup) implemented and verified 2026-07-11 — full suite (125/125, the previously-known `app.spec.ts` failure no longer exists — superseded by an earlier router-outlet-based test), build green (7 prerendered routes), lint green. Uncommitted, per `CLAUDE.md`'s Git policy (commits only on explicit request).

---

## Test Coverage Matrix (derived from `CLAUDE.md` — no `.specs/codebase/TESTING.md` exists yet)

This project has no e2e/integration harness configured (`CLAUDE.md`: "There is no e2e framework configured yet"). Test tooling is Angular's Vitest-based unit-test builder, colocated `*.spec.ts`, matching the precedent already set by `theme.service.spec.ts` and `category-color.map.spec.ts`.

| Code Layer | Test Type | Parallel-Safe | Notes |
|---|---|---|---|
| TypeScript interfaces/DTOs (no runtime logic) | none | Yes | Verified by the compiler (`ng build`), nothing to unit test |
| Pure utility functions | unit | Yes | e.g. `decodeJwtExpiry` |
| Services (`@Injectable`) | unit | Yes | Vitest + `HttpTestingController`/mocked deps |
| Guards (`CanActivateFn`) | unit | Yes | Vitest, mock `Router`/`SessionService` |
| Interceptors (`HttpInterceptorFn`) | unit | Yes | Vitest, mock `HttpHandlerFn` |
| Standalone page components | unit | Yes | Vitest + `TestBed`, mock services; no e2e exists to cover full navigation flows |
| `app.config.ts` / `app.routes.ts` wiring | none (build+full suite as the gate) | **No** | Single shared file, not parallel-safe; verified by the full suite + build, not a dedicated spec |

**Gate check commands**:
- `quick`: `ng test --include='**/<file>.spec.ts'` (the file the task touches)
- `full`: `npm test` (whole suite) followed by `npm run build`
- `build`: `npm run build` only (interfaces with no test type)

---

## Execution Plan

### Phase 1: Foundation DTOs (Parallel, then one sequential)

```
T1 [P] ─┐
T2 [P] ─┼──→ T4
T3 [P] ─┘
```

### Phase 2: Core Services (Parallel, then sequential integration)

```
T5 [P] ─┐
T6      ─┼──→ T9
T7 (needs T2,T3,T4) ─┤
T8 (needs T2)        ─┘
```

### Phase 3: App-Shell Infrastructure

```
T9 ──→ T10 [P] ─┐
       T11 [P] ─┼──→ T12
```

### Phase 4: P1 Pages — vertical slice (register → verify-email → login)

```
T7 ──→ T13 [P] ─┐
T7 ──→ T14 [P] ─┼──→ T16
T9 ──→ T15 [P] ─┤
T10 ────────────┘
```

### Phase 5: P2 — forgot/reset password, profile view

```
T7 ──→ T17 [P] ─┐
T7 ──→ T18 [P] ─┤
T8,T10 → T19 [P]─┼──→ T20
T16 ─────────────┘
```

### Phase 6: P3 — LGPD self-service (Sequential, single file)

```
T8,T9,T19 ──→ T21
```

---

## Task Breakdown

### T1: Create shared API error-envelope interfaces [P]

**What**: `ValidationErrorResponse` (422 shape) and `ApiErrorResponse` (400/401/404/409/429/500 shape), one file each, matching `api-contracts.md`'s "Response Format" section exactly.
**Where**: `src/app/shared/interfaces/validation-error-response.ts`, `src/app/shared/interfaces/api-error-response.ts`
**Depends on**: None
**Reuses**: None — first shared interfaces in the app
**Requirement**: IDENT-01, IDENT-06 (validation display), applies app-wide

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `ValidationErrorResponse` has `title: string`, `status: 422`, `errors: Record<string, string[]>`, `extensions: { correlationId: string | null }`
- [ ] `ApiErrorResponse` has `title: string`, `status: number`, `extensions: { correlationId: string | null }`
- [ ] `npm run build` compiles with no errors

**Tests**: none
**Gate**: build

---

### T2: Create User response DTOs [P]

**What**: `UserResponse` (+ `UserRole`/`UserStatus` types), `AuditLogEntryRecord`, `DataExportResponse` — one file each, matching `api-contracts.md`'s `UserResponse`/`AuditLogEntryRecord`/data-export shapes exactly.
**Where**: `src/app/features/identity/user/interfaces/user-response.ts`, `.../audit-log-entry-record.ts`, `.../data-export-response.ts`
**Depends on**: None
**Reuses**: None
**Requirement**: IDENT-03, IDENT-07, IDENT-08

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `UserResponse` fields: `id`, `email`, `role: 'Owner' | 'Renter' | 'Admin'`, `status: 'PendingVerification' | 'Active' | 'Deleted'`, `createdAt`
- [ ] `AuditLogEntryRecord` fields: `eventType`, `occurredAt`
- [ ] `DataExportResponse` fields match `GET /users/me/data-export`'s body exactly, including `auditHistory: AuditLogEntryRecord[]` imported from the sibling file (not redeclared)
- [ ] `npm run build` compiles with no errors

**Tests**: none
**Gate**: build

---

### T3: Create Auth request DTOs [P]

**What**: `RegisterRequest`, `LoginRequest`, `RefreshRequest`, `LogoutRequest`, `VerifyEmailRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest` — one file each, matching each `/auth/*` endpoint's request body in `api-contracts.md`.
**Where**: `src/app/features/identity/auth/interfaces/*.ts` (7 files, see design.md Data Models)
**Depends on**: None
**Reuses**: None
**Requirement**: IDENT-01, IDENT-02, IDENT-03, IDENT-04, IDENT-06

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] Each interface's fields and literal types match `api-contracts.md` exactly (e.g. `RegisterRequest.role` is `'Owner' | 'Renter' | 'Admin'`, `consentGiven: true`)
- [ ] `npm run build` compiles with no errors

**Tests**: none
**Gate**: build

---

### T4: Create LoginResponse interface

**What**: `LoginResponse` DTO (`accessToken`, `refreshToken`, `user: UserResponse`).
**Where**: `src/app/features/identity/auth/interfaces/login-response.ts`
**Depends on**: T2 (imports `UserResponse` via `@features/identity/user/interfaces/user-response`)
**Reuses**: `UserResponse` from T2
**Requirement**: IDENT-03, IDENT-04

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `LoginResponse` imports `UserResponse` by path alias, not a re-declared shape
- [ ] `npm run build` compiles with no errors

**Tests**: none
**Gate**: build

---

### T5: Create `decodeJwtExpiry` utility [P]

**What**: Pure function that base64url-decodes a JWT's payload segment and returns its `exp` claim (seconds) or `null` on malformed input — no signature verification, no dependency.
**Where**: `src/app/shared/utils/decode-jwt-expiry.util.ts` (+ colocated `decode-jwt-expiry.util.spec.ts`)
**Depends on**: None
**Reuses**: None — no JWT library added (see design.md Tech Decisions)
**Requirement**: IDENT-04

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] Returns the correct `exp` for a well-formed JWT (test with a hand-built token string, not a real secret)
- [ ] Returns `null` for a malformed/truncated token, never throws
- [ ] `ng test --include='**/decode-jwt-expiry.util.spec.ts'` passes
- [ ] Test count: at least 3 tests pass (valid token, malformed token, missing `exp` claim)

**Tests**: unit
**Gate**: quick — `ng test --include='**/decode-jwt-expiry.util.spec.ts'`

---

### T6: Create `TokenStorageService`

**What**: `get/set/clear` abstraction over the browser storage mechanism for the access/refresh tokens, SSR-safe (no-op on server).
**Where**: `src/app/core/services/token-storage.service.ts` (+ colocated spec)
**Depends on**: None
**Reuses**: `ThemeService`'s `PLATFORM_ID`-guarded SSR pattern
**Requirement**: IDENT-03 (session persistence)

**⚠️ BLOCKED on an open decision** (`context.md` → "Open Decision: Token storage strategy"): the user explicitly deferred choosing between (a) access-in-memory + refresh-in-`localStorage`, (b) both in `localStorage`, (c) both in `sessionStorage`. **Do not default silently when this task is picked up — re-ask the user which mechanism to implement before writing the concrete storage calls.** The public interface (`getAccessToken`/`getRefreshToken`/`setTokens`/`clear`) is fixed regardless of the answer, so every other task in this plan is unblocked and can proceed against that interface via a stub/in-memory implementation if needed to keep moving.

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] Concrete storage mechanism confirmed with the user (not defaulted)
- [ ] `getAccessToken()`/`getRefreshToken()` return `null` when nothing is stored
- [ ] `setTokens()` persists both tokens; `clear()` removes both
- [ ] No storage API is touched when `!isPlatformBrowser(platformId)`
- [ ] `ng test --include='**/token-storage.service.spec.ts'` passes
- [ ] Test count: at least 4 tests pass (set+get roundtrip, clear, missing tokens, SSR no-op)

**Tests**: unit
**Gate**: quick — `ng test --include='**/token-storage.service.spec.ts'`

---

### T7: Create `AuthService`

**What**: Stateless HTTP wrapper for the 7 `/auth/*` endpoints.
**Where**: `src/app/features/identity/auth/services/auth.service.ts` (+ colocated spec)
**Depends on**: T2, T3, T4
**Reuses**: `HttpClient` directly (no `BaseHttpService` yet, per design.md Tech Decisions)
**Requirement**: IDENT-01, IDENT-02, IDENT-03, IDENT-04, IDENT-06

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] All 7 methods (`register`, `login`, `refresh`, `logout`, `verifyEmail`, `forgotPassword`, `resetPassword`) call the exact URL/verb from `api-contracts.md`
- [ ] Return types match design.md exactly (`void` for `204` endpoints, typed body otherwise)
- [ ] `ng test --include='**/auth.service.spec.ts'` passes using `HttpTestingController`
- [ ] Test count: at least 7 tests pass (one happy-path per method)

**Tests**: unit
**Gate**: quick — `ng test --include='**/auth.service.spec.ts'`

---

### T8: Create `UserService`

**What**: Stateless HTTP wrapper for the 3 `/users/me*` endpoints.
**Where**: `src/app/features/identity/user/services/user.service.ts` (+ colocated spec)
**Depends on**: T2
**Reuses**: `HttpClient` directly, same pattern as T7
**Requirement**: IDENT-07, IDENT-08

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `getMe`, `deleteMe`, `exportMyData` call the exact URL/verb from `api-contracts.md`
- [ ] `ng test --include='**/user.service.spec.ts'` passes using `HttpTestingController`
- [ ] Test count: at least 3 tests pass

**Tests**: unit
**Gate**: quick — `ng test --include='**/user.service.spec.ts'`

---

### T9: Create `SessionService`

**What**: Signal-based session orchestration — `currentUser`, `isAuthenticated`, `accessToken()`, `bootstrap()`, `login()`, `logout()`, `refresh()` (deduplicated), `clearSession()`.
**Where**: `src/app/core/services/session.service.ts` (+ colocated spec)
**Depends on**: T5, T6, T7, T2
**Reuses**: `ThemeService`'s signal/SSR-guard structure
**Requirement**: IDENT-03, IDENT-04, IDENT-05

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `login()` persists tokens via `TokenStorageService`, sets `currentUser`, schedules refresh via `decodeJwtExpiry`
- [ ] `refresh()` deduplicates concurrent callers (single in-flight `Observable`)
- [ ] `logout()` calls `AuthService.logout` then clears state regardless of the response
- [ ] `bootstrap()` restores a session from a persisted refresh token, or stays logged out; no-ops on server (`isPlatformBrowser` guard)
- [ ] A failed `refresh()` clears the session (does not loop/retry)
- [ ] `ng test --include='**/session.service.spec.ts'` passes with `AuthService`/`TokenStorageService`/`Router` mocked
- [ ] Test count: at least 8 tests pass (login, logout, bootstrap-with-token, bootstrap-without-token, proactive schedule, dedup refresh, failed refresh, SSR no-op)

**Tests**: unit
**Gate**: quick — `ng test --include='**/session.service.spec.ts'`

---

### T10: Create `authGuard` [P]

**What**: `CanActivateFn` that blocks unauthenticated navigation, redirecting to `/login?returnUrl=...`.
**Where**: `src/app/core/guards/auth.guard.ts` (+ colocated spec)
**Depends on**: T9
**Reuses**: `SessionService.isAuthenticated`
**Requirement**: IDENT-05

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] Returns `true` when `SessionService.isAuthenticated()` is `true`
- [ ] Returns a `UrlTree` to `/login` with `returnUrl` set to the attempted URL when not authenticated
- [ ] `ng test --include='**/auth.guard.spec.ts'` passes
- [ ] Test count: at least 2 tests pass

**Tests**: unit
**Gate**: quick — `ng test --include='**/auth.guard.spec.ts'`

---

### T11: Create `authInterceptor` [P]

**What**: `HttpInterceptorFn` that attaches the bearer token to authenticated requests and handles reactive refresh-and-retry on `401`.
**Where**: `src/app/core/interceptors/auth.interceptor.ts` (+ colocated spec)
**Depends on**: T9
**Reuses**: `SessionService`
**Requirement**: IDENT-04

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] Attaches `Authorization: Bearer {token}` to requests, except the 7 unauthenticated `/auth/*` endpoints
- [ ] On `401` from a non-refresh request, calls `SessionService.refresh()` once and retries the original request on success
- [ ] On `401` from `/auth/refresh` itself, does NOT retry (avoids infinite loop) and lets `SessionService` clear the session
- [ ] `ng test --include='**/auth.interceptor.spec.ts'` passes with `HttpHandlerFn` mocked
- [ ] Test count: at least 4 tests pass (token attached, token skipped for auth endpoints, 401 refresh+retry succeeds, 401 refresh fails)

**Tests**: unit
**Gate**: quick — `ng test --include='**/auth.interceptor.spec.ts'`

---

### T12: Wire session bootstrap + interceptor into the app shell

**What**: Register `authInterceptor` in `provideHttpClient(withInterceptors([...]))` (`app.config.ts`); call `inject(SessionService).bootstrap()` from the root `App` component's constructor, browser-only.
**Where**: `src/app/app.config.ts` (modify), `src/app/app.ts` (modify)
**Depends on**: T9, T11
**Reuses**: Existing `app.config.ts`/`app.ts` shell
**Requirement**: IDENT-03, IDENT-04

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `authInterceptor` is registered and observed to run (via existing/adjusted `app.spec.ts` or a smoke assertion)
- [ ] `SessionService.bootstrap()` is invoked once at startup, does not block first paint, no-ops during SSR render
- [ ] `npm test` (full suite) passes, no regressions in existing specs
- [ ] `npm run build` succeeds (client + server bundles)

**Tests**: none (wiring)
**Gate**: full — `npm test && npm run build`

---

### T13: Create `RegisterPage` [P]

**What**: Standalone reactive-form component implementing IDENT-01 — submits to `AuthService.register`, shows the local "check your email" confirmation state on `201`, renders `422`/`409` errors per design.md's Error Handling Strategy.
**Where**: `src/app/core/pages/register/register.ts` (+ `.html`, `.spec.ts`)
**Depends on**: T7
**Reuses**: Color-system semantic tokens; no shared UI kit yet (plain Tailwind-styled native inputs, per design.md)
**Requirement**: IDENT-01

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] Form fields: email, taxId, password, role (select), consentGiven (checkbox), matching contract validation rules for immediate client-side feedback where reasonable (e.g. consent required) without duplicating every server rule
- [ ] `201` response swaps to the confirmation view (no route change)
- [ ] `422` maps field errors onto the matching control; unmapped fields go to a summary banner
- [ ] `409` shows which field conflicted (email vs taxId)
- [ ] `ng test --include='**/register.spec.ts'` passes
- [ ] Test count: at least 4 tests pass

**Tests**: unit
**Gate**: quick — `ng test --include='**/register.spec.ts'`

---

### T14: Create `VerifyEmailPage` [P]

**What**: Standalone component implementing IDENT-02 — reads `email`/`token` query params, calls `AuthService.verifyEmail` on load, renders success/error state.
**Where**: `src/app/core/pages/verify-email/verify-email.ts` (+ `.html`, `.spec.ts`)
**Depends on**: T7
**Reuses**: Color-system tokens
**Requirement**: IDENT-02

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] Calls `verifyEmail` automatically using `ActivatedRoute` query params
- [ ] `200` renders a success view with a link to `/login`
- [ ] `400`/`404` render the generic "link no longer valid" view (no enumeration detail)
- [ ] `ng test --include='**/verify-email.spec.ts'` passes
- [ ] Test count: at least 3 tests pass

**Tests**: unit
**Gate**: quick — `ng test --include='**/verify-email.spec.ts'`

---

### T15: Create `LoginPage` [P]

**What**: Standalone reactive-form component implementing IDENT-03 — submits to `SessionService.login`, navigates to `returnUrl` or home on success, renders the three distinct `401` messages.
**Where**: `src/app/core/pages/login/login.ts` (+ `.html`, `.spec.ts`)
**Depends on**: T9
**Reuses**: Color-system tokens; existing `login` placeholder if `estrutura.md`-inspired scaffolding left one (check first — none currently exists in `src/app/core/pages`, confirmed empty except `home`)
**Requirement**: IDENT-03, IDENT-05 (consumes `returnUrl`)

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] Reads `returnUrl` query param; on successful login navigates there if it's a safe same-origin relative path, else home
- [ ] Renders the backend's exact `401` `title` text for invalid credentials / not active / locked
- [ ] `429` shows the shared rate-limit message
- [ ] `ng test --include='**/login.spec.ts'` passes
- [ ] Test count: at least 4 tests pass

**Tests**: unit
**Gate**: quick — `ng test --include='**/login.spec.ts'`

---

### T16: Wire P1 routes into `app.routes.ts`

**What**: Add lazy `loadComponent` routes for `register`, `verify-email`, `login`; confirm the existing `home` route and wildcard redirect are untouched.
**Where**: `src/app/app.routes.ts` (modify)
**Depends on**: T10, T13, T14, T15
**Reuses**: Existing `routes` array structure
**Requirement**: IDENT-01, IDENT-02, IDENT-03, IDENT-05

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `/register`, `/verify-email`, `/login` routes resolve to their pages via lazy `loadComponent`
- [ ] Wildcard route still redirects to `''`
- [ ] `npm test` (full suite) passes
- [ ] `npm run build` succeeds
- [ ] Manual smoke check: `npm start`, navigate to `/register` → submit → confirmation view; open `/login`, attempt bad credentials → error message renders

**Tests**: none (routing wiring)
**Gate**: full — `npm test && npm run build`

**Commit**: `feat(identity): wire P1 auth vertical slice (register, verify-email, login)`

---

### T17: Create `ForgotPasswordPage` [P]

**What**: Standalone component implementing IDENT-06 (forgot half) — submits email, always shows the same confirmation on `204`.
**Where**: `src/app/core/pages/forgot-password/forgot-password.ts` (+ `.html`, `.spec.ts`)
**Depends on**: T7
**Reuses**: Color-system tokens
**Requirement**: IDENT-06

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] Confirmation view is identical regardless of whether the backend "found" the email (never branches on response content)
- [ ] `422` (invalid email format) shows inline field error
- [ ] `ng test --include='**/forgot-password.spec.ts'` passes
- [ ] Test count: at least 2 tests pass

**Tests**: unit
**Gate**: quick — `ng test --include='**/forgot-password.spec.ts'`

---

### T18: Create `ResetPasswordPage` [P]

**What**: Standalone component implementing IDENT-06 (reset half) — reads `email`/`token` query params, submits `newPassword`.
**Where**: `src/app/core/pages/reset-password/reset-password.ts` (+ `.html`, `.spec.ts`)
**Depends on**: T7
**Reuses**: Color-system tokens; password validation pattern shared conceptually with `RegisterPage` (T13) — not extracted into a shared validator yet (single duplication across 2 forms is acceptable; extract only if a third form needs it)
**Requirement**: IDENT-06

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `204` shows success with a link to `/login`
- [ ] `422` on `newPassword` shows the same rule set as registration
- [ ] `400`/`404` render the generic "link no longer valid" view
- [ ] `ng test --include='**/reset-password.spec.ts'` passes
- [ ] Test count: at least 3 tests pass

**Tests**: unit
**Gate**: quick — `ng test --include='**/reset-password.spec.ts'`

---

### T19: Create `AccountPage` — profile view [P]

**What**: Authenticated component implementing IDENT-07 — renders `UserService.getMe()`.
**Where**: `src/app/features/identity/user/pages/account/account.ts` (+ `.html`, `.spec.ts`)
**Depends on**: T8, T10
**Reuses**: Color-system tokens
**Requirement**: IDENT-07

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] Renders `email`, `role`, `status`, `createdAt` from `GET /users/me`
- [ ] A `401` here is handled transparently by `authInterceptor` (test confirms the page doesn't need its own refresh logic)
- [ ] `ng test --include='**/account.spec.ts'` passes
- [ ] Test count: at least 2 tests pass

**Tests**: unit
**Gate**: quick — `ng test --include='**/account.spec.ts'`

---

### T20: Wire P2 routes into `app.routes.ts`

**What**: Add `forgot-password`, `reset-password` public routes and a `authGuard`-protected `account` route.
**Where**: `src/app/app.routes.ts` (modify)
**Depends on**: T16, T17, T18, T19
**Reuses**: Existing routes array (extends T16's result)
**Requirement**: IDENT-06, IDENT-07

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `/forgot-password`, `/reset-password` resolve publicly
- [ ] `/account` resolves only when authenticated (`canActivate: [authGuard]`), else redirects per T10
- [ ] `npm test` (full suite) passes
- [ ] `npm run build` succeeds
- [ ] Manual smoke check: full loop — register → verify (mock/real token) → login → `/account` shows profile → logout → `/account` redirects to `/login`

**Tests**: none (routing wiring)
**Gate**: full — `npm test && npm run build`

**Commit**: `feat(identity): wire P2 password recovery + protected account routes`

---

### T21: Extend `AccountPage` with LGPD self-service

**What**: Add "Export my data" (calls `UserService.exportMyData`, downloads the JSON) and "Delete my account" (type-to-confirm dialog, then `UserService.deleteMe` → `SessionService.clearSession()` → redirect `/login`) to the existing `AccountPage`.
**Where**: `src/app/features/identity/user/pages/account/account.ts` (modify, from T19)
**Depends on**: T8, T9, T19
**Reuses**: `UserService`, `SessionService.clearSession()`
**Requirement**: IDENT-08

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] "Export my data" triggers a client-side JSON file download of the exact `DataExportResponse` payload
- [ ] "Delete my account" is disabled until the user types the required confirmation text
- [ ] On successful deletion (`204`), session is cleared and the user is redirected to `/login` immediately
- [ ] `ng test --include='**/account.spec.ts'` passes (updated)
- [ ] Test count: at least 5 tests pass total for `account.spec.ts` (2 from T19 + 3 new)

**Tests**: unit
**Gate**: quick — `ng test --include='**/account.spec.ts'`

**Commit**: `feat(identity): add LGPD data export and account deletion self-service`

---

## Parallel Execution Map

```
Phase 1 (Foundation):
  T1 [P] ─┐
  T2 [P] ─┼──→ T4
  T3 [P] ─┘

Phase 2 (Core Services):
  T5 [P], T6 (needs nothing but flags open decision) ─┐
  T7 (needs T2,T3,T4)                                  ─┼──→ T9
  T8 (needs T2)                                         ─┘

Phase 3 (App Shell):
  T9 complete, then:
    ├── T10 [P]
    └── T11 [P]
  T10, T11 complete, then:
    T12 (sequential — shared app.config.ts/app.ts)

Phase 4 (P1 Pages):
  T7, T9, T10 complete, then:
    ├── T13 [P]
    ├── T14 [P]
    └── T15 [P]
  T13, T14, T15 complete, then:
    T16 (sequential — shared app.routes.ts)

Phase 5 (P2):
  T7, T8, T10, T16 complete, then:
    ├── T17 [P]
    ├── T18 [P]
    └── T19 [P]
  T17, T18, T19 complete, then:
    T20 (sequential — shared app.routes.ts)

Phase 6 (P3):
  T8, T9, T19 (via T20) complete, then:
    T21 (sequential — same file as T19)
```

**Parallelism constraint reminder**: All `[P]` tasks above are unit-tested with mocked dependencies and touch only their own new file(s) — no shared mutable state. Every task that touches `app.config.ts`/`app.ts`/`app.routes.ts` (T12, T16, T20) is sequential by construction, matching the Test Coverage Matrix's "Parallel-Safe: No" for that layer.

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1 | 2 cohesive interface files (shared error envelope) | ✅ Granular (cohesive group) |
| T2 | 3 cohesive interface files (User resource DTOs) | ✅ Granular (cohesive group) |
| T3 | 7 cohesive interface files (Auth request DTOs) | ✅ Granular (cohesive group) |
| T4 | 1 interface file | ✅ Granular |
| T5 | 1 utility function | ✅ Granular |
| T6 | 1 service (interface fixed, mechanism pending) | ✅ Granular |
| T7 | 1 service, 7 methods | ✅ Granular (cohesive — one HTTP wrapper) |
| T8 | 1 service, 3 methods | ✅ Granular |
| T9 | 1 service | ✅ Granular |
| T10 | 1 guard | ✅ Granular |
| T11 | 1 interceptor | ✅ Granular |
| T12 | 2 file modifications, 1 concern (wiring) | ✅ Granular (cohesive) |
| T13–T15, T17–T19 | 1 component each | ✅ Granular |
| T16, T20 | 1 file modification each (routes) | ✅ Granular |
| T21 | 1 component modification, 1 concern (LGPD actions) | ✅ Granular (cohesive) |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | None | None | ✅ Match |
| T2 | None | None | ✅ Match |
| T3 | None | None | ✅ Match |
| T4 | T2 | T2 → T4 | ✅ Match |
| T5 | None | None | ✅ Match |
| T6 | None | None | ✅ Match |
| T7 | T2, T3, T4 | T2/T3/T4 → T7 | ✅ Match |
| T8 | T2 | T2 → T8 | ✅ Match |
| T9 | T5, T6, T7, T2 | T5/T6/T7/T8-branch → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T9 | T9 → T11 | ✅ Match |
| T12 | T9, T11 | T10/T11 → T12 | ✅ Match |
| T13 | T7 | T7 → T13 | ✅ Match |
| T14 | T7 | T7 → T14 | ✅ Match |
| T15 | T9 | T9 → T15 | ✅ Match |
| T16 | T10, T13, T14, T15 | T13/T14/T15/T10 → T16 | ✅ Match |
| T17 | T7 | T7 → T17 | ✅ Match |
| T18 | T7 | T7 → T18 | ✅ Match |
| T19 | T8, T10 | T8/T10 → T19 | ✅ Match |
| T20 | T16, T17, T18, T19 | T17/T18/T19/T16 → T20 | ✅ Match |
| T21 | T8, T9, T19 | T19(→T20) → T21 | ✅ Match |

No mismatches. No task marked `[P]` depends on another task in its same parallel group (T1/T2/T3 are mutually independent; T13/T14/T15 all depend only on already-complete T7/T9/T10, not on each other; same for T17/T18/T19).

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1 | Interfaces | none | none | ✅ OK |
| T2 | Interfaces | none | none | ✅ OK |
| T3 | Interfaces | none | none | ✅ OK |
| T4 | Interface | none | none | ✅ OK |
| T5 | Pure utility | unit | unit | ✅ OK |
| T6 | Service | unit | unit | ✅ OK |
| T7 | Service | unit | unit | ✅ OK |
| T8 | Service | unit | unit | ✅ OK |
| T9 | Service | unit | unit | ✅ OK |
| T10 | Guard | unit | unit | ✅ OK |
| T11 | Interceptor | unit | unit | ✅ OK |
| T12 | app.config.ts/app.ts wiring | none (full-suite gate) | none | ✅ OK |
| T13 | Component | unit | unit | ✅ OK |
| T14 | Component | unit | unit | ✅ OK |
| T15 | Component | unit | unit | ✅ OK |
| T16 | app.routes.ts wiring | none (full-suite gate) | none | ✅ OK |
| T17 | Component | unit | unit | ✅ OK |
| T18 | Component | unit | unit | ✅ OK |
| T19 | Component | unit | unit | ✅ OK |
| T20 | app.routes.ts wiring | none (full-suite gate) | none | ✅ OK |
| T21 | Component (modify) | unit | unit | ✅ OK |

No violations. No task defers its own tests to a later task.

---

## Before Execute: open items to resolve first

1. ~~T6 was blocked on the token-storage decision~~ — **resolved** by the 2026-07-11 `api-contracts.md` revision (see Migration section below). No longer applicable.
2. **Tools per task**: this plan assumes no MCP/skill beyond the standard file/test tools already used to build it (no Context7 lookups were needed — Angular 22 standalone/signals/HttpInterceptorFn APIs were already confirmed against this codebase's existing `ThemeService`/`app.config.ts` patterns, not fabricated). Confirm before Execute whether any additional MCP (e.g. Context7 for a specific Angular API check) should be used per task, per the skill's standard pre-execute question.

---

# Migration: httpOnly Refresh-Token Cookie (2026-07-11)

**Trigger**: `api-contracts.md` was revised — `refreshToken` is no longer returned in any JSON response body; it's now set by the server as an `httpOnly`/`Secure`/`SameSite=Strict` cookie (`Path=/api/v1/auth`), invisible to JavaScript. `POST /auth/refresh`/`POST /auth/logout` request bodies drop `refreshToken` (now just `{ email }`); `POST /auth/refresh` now fails with `422` instead of `401`. Frontend requests to `/api/v1/auth/*` must be made with `withCredentials: true`. Full diff analysis in `context.md` → "Resolved Decisions (2026-07-11 revision)" and `design.md` (updated throughout).

**Scope**: T1–T21's implementation predates this contract revision. This migration touches only the files that reference the old `refreshToken`-in-body shape — confirmed via `grep -r "refreshToken|LoginResponse|setSession" src/app` against the current codebase: 8 files. `authGuard`, `authInterceptor`, `UserService`, and all 6 page components (`RegisterPage`, `LoginPage`, `VerifyEmailPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `AccountPage`) do **not** reference these shapes directly and are unaffected — do not touch them.

**Requirement**: IDENT-03, IDENT-04 (see `spec.md`'s revised acceptance criteria — status changed to "Needs rework")

```
M1 [P] ─┐
M2 [P] ─┼──→ M3 ──→ M4
```

---

### M1: Update Auth DTOs + `AuthService` for the cookie-based contract [P]

**What**:
- `iRefreshRequest` (`refresh-request.ts`) and `iLogoutRequest` (`logout-request.ts`) drop the `refreshToken` field — both become `{ email: string }` only.
- Rename `login-response.ts` → `auth-token-response.ts`; rename `iLoginResponse` → `iAuthTokenResponse` (matches `api-contracts.md`'s "Shared Types" naming); drop its `refreshToken` field — becomes `{ accessToken: string; user: iUserResponse }`.
- `AuthService.login`/`refresh`/`logout` return `Observable<iAuthTokenResponse>` (login/refresh) — update the type import. All 7 `AuthService` methods pass `{ withCredentials: true }` as `HttpClient`'s options argument (per `api-contracts.md`: "every request to `/api/v1/auth/*` must be made with `credentials: 'include'`" — not just login/refresh/logout).

**Where**:
- `src/app/features/identity/auth/interfaces/refresh-request.ts` (modify)
- `src/app/features/identity/auth/interfaces/logout-request.ts` (modify)
- `src/app/features/identity/auth/interfaces/login-response.ts` → delete, replaced by `src/app/features/identity/auth/interfaces/auth-token-response.ts` (new)
- `src/app/features/identity/auth/services/auth.service.ts` (modify)
- `src/app/features/identity/auth/services/auth.service.spec.ts` (modify — update mock response shapes, assert `withCredentials: true` on all 7 requests via `HttpTestingController`'s captured request)

**Depends on**: None
**Reuses**: existing `iUserResponse` import, existing `AUTH_BASE_URL` constant, existing test structure in `auth.service.spec.ts`
**Requirement**: IDENT-03, IDENT-04

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `iRefreshRequest`/`iLogoutRequest` have exactly `{ email: string }`, no `refreshToken` field anywhere
- [ ] `iAuthTokenResponse` exists at `auth-token-response.ts` with `{ accessToken, user }`; `login-response.ts`/`iLoginResponse` no longer exist anywhere in the codebase
- [ ] All 7 `AuthService` methods' `HttpClient` calls pass `{ withCredentials: true }`
- [ ] `ng test --include='**/auth.service.spec.ts'` passes, including new assertions that `req.request.withCredentials` is `true` for all 7 requests
- [ ] Test count: still ≥7 (one per method), each now also asserting `withCredentials`

**Tests**: unit
**Gate**: quick — `ng test --include='**/auth.service.spec.ts'`

---

### M2: Update `TokenStorageService` for memory-only accessToken + persisted email [P]

**What**: Remove all refresh-token storage (nothing left to store — the cookie owns it). Keep `accessToken` in memory only (unchanged from before). Add persistence of `email` to `localStorage` (browser-only, `PLATFORM_ID`-guarded like `ThemeService`), since `bootstrap()` needs it to call `POST /auth/refresh` after a reload (see `context.md`).

**Where**:
- `src/app/core/services/token-storage.service.ts` (modify)
- `src/app/core/services/token-storage.service.spec.ts` (modify — drop refresh-token assertions, add `localStorage` persistence assertions, add an SSR/`PLATFORM_ID`-guard test matching `ThemeService.spec.ts`'s pattern)

**Depends on**: None
**Reuses**: `ThemeService`'s `PLATFORM_ID`/`isPlatformBrowser` + `localStorage` guard pattern (`src/app/core/services/theme.service.ts`) — this is the first *other* service in the codebase to touch `localStorage`, follow that established precedent exactly (same guard shape, same `DOCUMENT`-via-`defaultView` access style if consistent, or plain `isPlatformBrowser(inject(PLATFORM_ID))` + global `localStorage` — match whichever `ThemeService` actually does)
**Requirement**: IDENT-03, IDENT-04

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `getRefreshToken()` and any refresh-token storage field are removed entirely
- [ ] `getAccessToken()` remains in-memory only (unchanged behavior)
- [ ] `getEmail()` reads from `localStorage`; returns `null` when nothing stored or `!isPlatformBrowser`
- [ ] `setSession(accessToken: string, email: string): void` — note the signature drops the `refreshToken` parameter — persists `accessToken` in memory and `email` to `localStorage`
- [ ] `clear()` clears both the in-memory `accessToken` and the persisted `email` (removes the `localStorage` key)
- [ ] No `localStorage` API is touched when `!isPlatformBrowser(platformId)`
- [ ] `ng test --include='**/token-storage.service.spec.ts'` passes
- [ ] Test count: at least 5 (set+get roundtrip for both accessToken and email, clear removes both, missing values return null, SSR no-op doesn't touch `localStorage`)

**Tests**: unit
**Gate**: quick — `ng test --include='**/token-storage.service.spec.ts'`

---

### M3: Update `SessionService` — bootstrap on persisted email, drop refresh-token plumbing

**What**: Rewrite `bootstrap()` to gate on `TokenStorageService.getEmail()` (not a refresh token, which is no longer observable) — if an email is persisted, unconditionally call `refresh()` to attempt restoration via the `httpOnly` cookie; `200` restores the session, `422` clears it. Add a new `isRestoringSession: Signal<boolean>`, `true` only while this specific bootstrap-triggered refresh call is in flight (stays `false` — no flash — for anonymous visitors with no persisted email, since no API call happens for them). Update `login()`/`logout()`/`refresh()` to use `AuthService`'s new signatures (`{ email }` only) and `iAuthTokenResponse`. `clearSession()` now clears the persisted email too (via `TokenStorageService.clear()`, already handled if M2 lands first).

**Where**:
- `src/app/core/services/session.service.ts` (modify)
- `src/app/core/services/session.service.spec.ts` (modify — update all mock `AuthService`/`TokenStorageService` shapes; rewrite the two `bootstrap()` tests since the gating condition changed from "refresh token present" to "email present"; add a new test for `isRestoringSession` toggling true→false around the bootstrap refresh call; update the "failed refresh clears session" test to reflect a `422` response instead of a generic error, if the existing test's mock status mattered)

**Depends on**: M1 (needs `iAuthTokenResponse`/updated `AuthService` signatures), M2 (needs `TokenStorageService.getEmail()`/new `setSession` signature)
**Reuses**: existing `decodeJwtExpiry`-based proactive-refresh-timer logic (unchanged), existing dedup-via-`shareReplay` pattern (unchanged)
**Requirement**: IDENT-03, IDENT-04

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `bootstrap()` calls `TokenStorageService.getEmail()`; if `null`, stays logged out with **no** API call and `isRestoringSession` stays `false`
- [ ] `bootstrap()` with a persisted email sets `isRestoringSession(true)`, calls `refresh()`, and sets `isRestoringSession(false)` when that call settles (success or failure) — verify via a test that reads the signal mid-flight (e.g. a `Subject`-backed mock, matching the existing dedup test's pattern)
- [ ] `login()`/`refresh()` no longer read/write a refresh token anywhere; `logout()`/`refresh()` call `AuthService` with `{ email }` only
- [ ] A `422` (or any error) from `refresh()` clears the session, including the persisted email (`TokenStorageService.clear()`)
- [ ] `ng test --include='**/session.service.spec.ts'` passes
- [ ] Test count: at least 9 (existing 9, with the two bootstrap tests rewritten for the new gating condition, plus 1 new `isRestoringSession` test — net same-or-higher count, none silently dropped)

**Tests**: unit
**Gate**: quick — `ng test --include='**/session.service.spec.ts'`

---

### M4: Wire `isRestoringSession` into the app shell's loading state

**What**: `App`'s template shows a minimal "Restoring session…" state while `SessionService.isRestoringSession()` is `true`, instead of rendering `<router-outlet />` — avoids a logged-out→logged-in flash for returning users on reload (anonymous first-time visitors never see this, since `isRestoringSession` never flips `true` for them per M3).

**Where**:
- `src/app/app.html` (modify — `@if (isRestoringSession()) { ... } @else { <router-outlet /> }`)
- `src/app/app.ts` (modify — expose `isRestoringSession` from the injected `SessionService` as a protected/public signal for the template to read)
- `src/app/app.spec.ts` (modify only if the existing "should create the app"/"should render title" tests need a `SessionService` mock to control `isRestoringSession` deterministically in tests — check whether the real `SessionService` with a real in-memory `TokenStorageService` already defaults `isRestoringSession` to `false` with no persisted email, which it should, making a mock likely unnecessary; only add one if the real dependency chain causes flakiness)

**Depends on**: M3
**Reuses**: existing minimal `app.html` structure, Tailwind semantic tokens (`bg-bg-canvas`, `text-text-secondary`) for the loading state markup, matching the style already used in `VerifyEmailPage`'s `loading` case

**Requirement**: IDENT-03

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `isRestoringSession() === true` renders the loading state, not `<router-outlet />`
- [ ] `isRestoringSession() === false` (the default/common case) renders `<router-outlet />` exactly as before — no regression for anonymous visitors or any existing page
- [ ] `npm test` (full suite) passes — **including the pre-existing `app.spec.ts` "should render title" failure remaining exactly as-is** (do not attempt to fix it as part of this task — out of scope, already tracked in `STATE.md` as a known, unrelated issue)
- [ ] `npm run build` succeeds (client + server bundles)
- [ ] Manual smoke check (see note below): log in, reload the tab, confirm the protected `/account` route is still reachable without a login prompt and without a visible flash

**Tests**: none (template/wiring — verified by the full-suite + build gate, consistent with how `app.config.ts`/`app.routes.ts` wiring tasks were gated in the original T12/T16/T20)
**Gate**: full — `npm test && npm run build`

**Commit**: `fix(identity): migrate to httpOnly refresh-token cookie contract`

---

## Migration Test Coverage Note

Since this backend now sets real cookies, the **manual smoke check** for M4 requires a running backend that actually implements the revised contract (issues the `Set-Cookie` header, honors `withCredentials`, enforces `SameSite=Strict`/CORS with the exact frontend origin). Automated unit tests mock `AuthService`/`HttpClient` and don't exercise real cookie behavior — a manual/E2E check against a real backend is the only way to catch a CORS or cookie-attribute misconfiguration (e.g. frontend origin not matching `Cors:AllowedOrigins` exactly, which would silently drop the cookie). Flag this explicitly since automated coverage cannot fully verify this migration's core premise.

---

# Hardening: State Ownership, Composable Extraction & Cleanup (2026-07-11)

**Trigger**: A state-management audit of the implemented identity feature (T1–T21 + M1–M4) found six issues, none of them contract-breaking but all worth fixing before more features build on top of this pattern: (1) `AccountPage` keeps its own copy of the current user instead of reading `SessionService.currentUser`; (2) `TokenStorageService` keeps a dead in-memory `_accessToken` field/getter that `SessionService` never reads (the token's single real owner is `SessionService._accessTokenSignal`); (3) `SessionService.refresh()`/`logout()` call `Router.navigateByUrl()` from inside state-mutation methods, coupling state to routing and making the service hard to unit-test in isolation; (4) `isInvalid`/`fieldErrorMessage`/`_handleValidationError`/`submitting`/`banner`/`isRateLimit` are copy-pasted near-identically across `LoginPage`/`RegisterPage`/`ForgotPasswordPage`/`ResetPasswordPage` and have already drifted (`RegisterPage` handles a `pattern` validation case `ForgotPasswordPage` doesn't); (5) `AccountPage` uses a separate `status: 'loading'|'loaded'|'error'` vocabulary for the same submitting/error concept the four auth pages already standardized on; (6) `ThemeService._watchSystemPreference()` registers a `matchMedia` `'change'` listener with `addEventListener` and never removes it — a real (if low-impact, since it's a root singleton) memory leak with no established cleanup convention to copy from elsewhere in the codebase.

**Scope**: Confirmed via direct file reads (not grep-only) of every file this section touches — `session.service.ts`, `token-storage.service.ts`, `theme.service.ts`, `account.ts`, and all four auth page components (`login.ts`, `register.ts`, `forgot-password.ts`, `reset-password.ts`). `SessionService.logout()` currently has **zero callers** anywhere in the app (no logout button exists in any template) — out of scope to add one here, but flagged since it means the `Router` side-effect removed from `logout()` in H3 has no behavioral impact today, only `refresh()`'s does.

**Requirement**: IDENT-09 (new — see `spec.md` traceability table)

```
H1 [P] ─┐
H2 [P] ─┤
H5 [P] ─┼──→ H3 ──→ H4 ─┐
        │               ├──→ H10 ──→ H11 ──→ H12
        └──→ H6[P],H7[P],H8[P],H9[P] ─┘
```

(H1, H2 are independent leaves feeding only H12. H5 gates H6–H9 and, together with H3, gates H10.)

---

### H1: `TokenStorageService` — remove the dead access-token field [P]

**What**: Delete `_accessToken`, `getAccessToken()`, and the `setSession()`/`clear()` lines that touch it. `SessionService` never calls `getAccessToken()` — it keeps its own `_accessTokenSignal` and only ever calls `_tokenStorage.setSession()`/`.clear()` for the `email` side. `TokenStorageService` becomes email-persistence-only; update its class doc comment to say so plainly (the existing comment already explains the token is memory-only/never persisted, but still implies the service holds it — correct that). `setSession(accessToken: string, email: string)` keeps its two-arg signature unless callers only need `email` — check `SessionService._applySession`'s call site before deciding whether to narrow the signature to `setSession(email: string)`; narrowing is preferred if `accessToken` is provably unused after this change, but don't narrow if it turns out something else still reads it.

**Where**:
- `src/app/features/identity/auth/session/services/token-storage.service.ts` (modify)
- `src/app/features/identity/auth/session/services/token-storage.service.spec.ts` (modify — drop `accessToken` get/set assertions)
- `src/app/features/identity/auth/session/services/session.service.ts` (modify only if `setSession`'s signature narrows)

**Depends on**: None
**Reuses**: existing `PLATFORM_ID`/`DOCUMENT` guard pattern already in the file (unchanged)
**Requirement**: IDENT-09

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `TokenStorageService` has no field or method that stores/returns an access token
- [ ] `SessionService` still compiles and owns the access token exclusively via `_accessTokenSignal`
- [ ] `ng test --include='**/token-storage.service.spec.ts'` passes
- [ ] `ng test --include='**/session.service.spec.ts'` passes (no regression from the signature check)

**Tests**: unit
**Gate**: quick — `ng test --include='**/token-storage.service.spec.ts' --include='**/session.service.spec.ts'`

---

### H2: `ThemeService` — fix the `matchMedia` listener leak [P]

**What**: `_watchSystemPreference()` calls `mediaQuery?.addEventListener('change', ...)` with no corresponding `removeEventListener`. Fix by injecting `DestroyRef` and registering `mediaQuery?.removeEventListener('change', handler)` in `destroyRef.onDestroy(...)` — this is the standard Angular cleanup primitive for a `providedIn: 'root'` service reacting to a native browser API, and (since no listener/subscription cleanup convention exists anywhere else in this codebase yet) becomes the reference example future services should copy. Keep the named handler function (not an inline arrow) so the same reference can be passed to both `addEventListener` and `removeEventListener`.

**Where**:
- `src/app/core/services/theme.service.ts` (modify)
- `src/app/core/services/theme.service.spec.ts` (modify — add a test asserting `removeEventListener` is called with the same handler on service destruction, e.g. via `TestBed.inject(DestroyRef)`-driven teardown or `fixture.destroy()`/`TestBed.resetTestingModule()` depending on how the existing spec constructs the service)

**Depends on**: None
**Reuses**: N/A — first use of `DestroyRef` in the codebase; keep it minimal, don't introduce a wrapper/composable for a single call site
**Requirement**: IDENT-09

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `addEventListener`'s handler is a named function reused for `removeEventListener`
- [ ] `removeEventListener` is called exactly once when the service is destroyed
- [ ] Existing dark-mode/system-preference behavior is unchanged (all current `theme.service.spec.ts` assertions still pass)
- [ ] `ng test --include='**/theme.service.spec.ts'` passes, including the new cleanup test

**Tests**: unit
**Gate**: quick — `ng test --include='**/theme.service.spec.ts'`

---

### H3: `SessionService` — remove `Router` side effects from state mutation

**What**: Delete the two `void this._router.navigateByUrl('/login')` calls inside `refresh()`'s `catchError` and `logout()`. `SessionService` stops injecting `Router` entirely. State mutation (`clearSession()`) is all `refresh()`/`logout()` do now; navigation becomes the caller's responsibility (see H4 for where it moves). Also add `updateCurrentUser(user: iUserResponse): void` — a small setter for `_currentUserSignal` that callers use to sync freshly-fetched profile data into the session's single source of truth (needed by H10) without going through a full `login()`/`refresh()` cycle.

**Where**:
- `src/app/features/identity/auth/session/services/session.service.ts` (modify)
- `src/app/features/identity/auth/session/services/session.service.spec.ts` (modify — remove `Router`/`navigateByUrl` mocks and assertions from the `refresh()`-failure and `logout()` tests; add a test for `updateCurrentUser()`)

**Depends on**: None
**Reuses**: existing `_applySession`/`clearSession` structure, existing `shareReplay`-based dedup (unchanged)
**Requirement**: IDENT-09

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `SessionService` no longer imports or injects `Router`
- [ ] `refresh()`/`logout()` only mutate state (via `clearSession()`/`_applySession()`) — no navigation call anywhere in the file
- [ ] `updateCurrentUser(user)` sets `_currentUserSignal` and is covered by a test
- [ ] `ng test --include='**/session.service.spec.ts'` passes
- [ ] Test count: unchanged or higher, none silently dropped (only the now-irrelevant `Router` assertions are removed, not the whole test case)

**Tests**: unit
**Gate**: quick — `ng test --include='**/session.service.spec.ts'`

---

### H4: `App` — signal-driven redirect on session end

**What**: `SessionService.isAuthenticated` already flips to `false` whenever `clearSession()` runs (via H3's now-navigation-free `refresh()`/`logout()`, and via `AccountPage.deleteAccount()`'s existing direct call). Add an `effect()` in `App`'s constructor that watches `isAuthenticated()` and calls `this._router.navigateByUrl('/login')` on a `true → false` transition — skip the transition check while `isRestoringSession()` is `true` (the initial bootstrap correctly starts unauthenticated; that's not a "session end", it's a session that was never restored) and skip the very first effect run (Angular runs a new `effect()` once immediately; there's no prior "true" to transition from). Track "was previously authenticated" with a plain local variable closed over by the effect, matching how `_refreshTimer` etc. are held as plain instance fields elsewhere in this codebase — no need for a second signal. This centralizes the one remaining navigation side-effect at the app's composition root instead of leaving it caller-scattered, and is the first real use of Angular's `effect()` in the codebase (mirrors the cleanup precedent set in H2, but for reacting to signal changes rather than a native listener).

**Where**:
- `src/app/app.ts` (modify — inject `Router`, add the `effect()`)
- `src/app/app.spec.ts` (modify only if the new effect requires a `Router`/`SessionService` mock the existing tests don't already provide — check first; the existing `isRestoringSession` wiring already needed comparable setup)

**Depends on**: H3
**Reuses**: existing `isRestoringSession`/`isAuthenticated` signals, existing `bootstrap()` call site in the constructor
**Requirement**: IDENT-09

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] A background `refresh()` failure (proactive timer or interceptor-triggered) now redirects to `/login` via `App`'s effect, not from inside `SessionService`
- [ ] No redirect fires on initial app load for an anonymous visitor (no prior `true` to transition from)
- [ ] No redirect fires while `isRestoringSession()` is `true`
- [ ] `AccountPage.deleteAccount()`'s existing direct `clearSession()` + `navigateByUrl('/login')` still works (the effect firing a second, idempotent `navigateByUrl('/login')` alongside it is acceptable — same destination, no user-visible difference; do not special-case it)
- [ ] `ng test --include='**/app.spec.ts'` passes
- [ ] `npm run build` succeeds

**Tests**: unit
**Gate**: quick — `ng test --include='**/app.spec.ts'`

---

### H5: Create `shared/composables/use-form-submission.ts` [P]

**What**: First file in `shared/composables/` (folder doesn't exist yet — CLAUDE.md has documented this convention since the identity feature was planned, but nothing has used it until now). Extract the state and logic duplicated across `LoginPage`/`RegisterPage`/`ForgotPasswordPage`/`ResetPasswordPage`:
1. `submitting`, `banner`, `isRateLimit` signals (readonly-exposed the same way `SessionService` exposes its state).
2. `reset(): void` — clears `banner`/`isRateLimit`, called at the top of every `onSubmit()`.
3. `fieldErrorMessage(control: AbstractControl | null): string` — the `required`/`email`/`maxlength`/`minlength`/`pattern`/`server` message ladder. Union the superset actually used across all four components (register's `pattern` case included) rather than the lowest common denominator — a component that never triggers `pattern` on its own controls simply never hits that branch, which is safe and removes the drift the audit found.
4. `isInvalid(control: AbstractControl | null): boolean` — the `invalid && (dirty || touched)` check.
5. `applyValidationErrors(error: iClassifiedHttpError, form: FormGroup, fieldNames: readonly string[]): string[]` — for a `kind: 'validation'` error, matches each server field name against `fieldNames` case-insensitively, calls `setErrors({ server: ... })` + `markAsTouched()` on matched controls, and returns the array of messages for fields that matched nothing (the "summary" list `RegisterPage` shows and the other three currently drop on the floor).
6. `handleError(error: iClassifiedHttpError, form: FormGroup, fieldNames: readonly string[]): string[]` — orchestrates: validation-kind delegates to `applyValidationErrors`; everything else sets `isRateLimit`/`banner` from `error.kind`/`error.message`. Returns the same unmatched-summary array as `applyValidationErrors` (empty for non-validation errors), so every caller can adopt the summary display uniformly if it chooses to.

Callers that need a branch `handleError` can't express (e.g. `ResetPasswordPage`'s `bad-request`/`not-found` → `invalid-link` viewState transition) still write their own `_handleError` wrapper that checks that one case first, then calls `useFormSubmission()`'s `handleError` for everything else — the composable is a toolkit, not a rigid controller, matching how `create<Name>FormControl()` composes rather than owns the whole component.

**Where**:
- `src/app/shared/composables/use-form-submission.ts` (new)
- `src/app/shared/composables/use-form-submission.spec.ts` (new)

**Depends on**: None
**Reuses**: `iClassifiedHttpError` (`@shared/interfaces/classified-http-error`), Angular's `AbstractControl`/`FormGroup` types — no new dependencies
**Requirement**: IDENT-09

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `useFormSubmission()` is a plain function (not a class), matching the "composable" naming/shape convention CLAUDE.md documents, callable as a component field initializer (valid injection-context-free — this composable injects nothing, so it works even outside DI context)
- [ ] `submitting`/`banner`/`isRateLimit` are exposed readonly (`.asReadonly()`), with separate internal setters the composable's own methods use
- [ ] `fieldErrorMessage` covers `server`/`required`/`email`/`maxlength`/`minlength`/`pattern`, falling back to a generic "This field is invalid." message, exactly matching the union of all four existing components' branches (verified by comparing against the four files read during this audit)
- [ ] `applyValidationErrors` returns unmatched messages instead of silently dropping them (fixes the gap where `ForgotPasswordPage`/`ResetPasswordPage` currently ignore unmatched server validation errors)
- [ ] `ng test --include='**/use-form-submission.spec.ts'` passes
- [ ] Test count: at least 8 (submitting/banner/isRateLimit toggle via reset+handleError, each fieldErrorMessage branch, isInvalid true/false, applyValidationErrors matched+unmatched cases)

**Tests**: unit
**Gate**: quick — `ng test --include='**/use-form-submission.spec.ts'`

---

### H6: Migrate `LoginPage` to `useFormSubmission` [P]

**What**: Replace the component's own `banner`/`submitting`/`isRateLimit` signals and `_handleError` with `useFormSubmission()`. `LoginPage` has no per-field validation-error mapping today (its `_handleError` just sets banner/rate-limit), so this is the simplest of the four migrations — mostly deletion.

**Where**:
- `src/app/features/identity/auth/login/components/login.ts` (modify)
- `src/app/features/identity/auth/login/components/login.html` (modify only if template bindings to `banner`/`submitting`/`isRateLimit` need to reference the composable's return object instead of component fields — keep the same field names on the component by re-exposing them, e.g. `protected readonly formSubmission = useFormSubmission();` and update template bindings from `banner()` to `formSubmission.banner()` etc., OR keep flat re-exports (`readonly banner = this.formSubmission.banner;`) if that avoids template churn — prefer flat re-exports to minimize `.html` diffs)
- `src/app/features/identity/auth/login/components/login.spec.ts` (modify only if it asserts on internals that moved)

**Depends on**: H5
**Reuses**: `use-form-submission.ts`
**Requirement**: IDENT-09

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `LoginPage` has no local `banner`/`submitting`/`isRateLimit` signal declarations — all sourced from `useFormSubmission()`
- [ ] Existing login behavior (success navigation, error banner, rate-limit flag) is unchanged
- [ ] `ng test --include='**/login.spec.ts'` passes with no dropped test cases

**Tests**: unit
**Gate**: quick — `ng test --include='**/login.spec.ts'`

---

### H7: Migrate `RegisterPage` to `useFormSubmission` [P]

**What**: Replace `banner`/`submitting`/`isRateLimit`/`summaryErrors`, `isInvalid`, `fieldErrorMessage`, `_handleError`, `_handleValidationError` with `useFormSubmission()`. `summaryErrors` becomes the return value of `handleError`/`applyValidationErrors` instead of hand-rolled duplication of `applyValidationErrors`'s matching loop.

**Where**:
- `src/app/features/identity/auth/register/components/register.ts` (modify)
- `src/app/features/identity/auth/register/components/register.html` (modify — update bindings per H6's flat-re-export approach)
- `src/app/features/identity/auth/register/components/register.spec.ts` (modify only if it asserts on internals that moved)

**Depends on**: H5
**Reuses**: `use-form-submission.ts`, existing `FORM_FIELD_NAMES` constant (passed as `fieldNames` to `handleError`)
**Requirement**: IDENT-09

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `RegisterPage` has no local `isInvalid`/`fieldErrorMessage`/`_handleError`/`_handleValidationError` implementations — all delegate to `useFormSubmission()`
- [ ] The `pattern` validation-message case still fires correctly (this is the case that motivated including it in H5's union)
- [ ] `ng test --include='**/register.spec.ts'` passes with no dropped test cases

**Tests**: unit
**Gate**: quick — `ng test --include='**/register.spec.ts'`

---

### H8: Migrate `ForgotPasswordPage` to `useFormSubmission` [P]

**What**: Same migration as H7, for `ForgotPasswordPage`. Note this component's current `_handleValidationError` silently drops unmatched server validation errors (no summary display) — after migration it receives `applyValidationErrors`'s unmatched-message array; decide whether to surface it (add a summary UI element, consistent with `RegisterPage`) or intentionally ignore the return value with a comment explaining why. Prefer surfacing it — dropping validation feedback the backend sent is a latent UX bug, not a deliberate design choice, per the audit.

**Where**:
- `src/app/features/identity/auth/forgot-password/components/forgot-password.ts` (modify)
- `src/app/features/identity/auth/forgot-password/components/forgot-password.html` (modify — add summary-errors display if adopted, matching `RegisterPage`'s existing markup/`data-testid` pattern)
- `src/app/features/identity/auth/forgot-password/components/forgot-password.spec.ts` (modify)

**Depends on**: H5
**Reuses**: `use-form-submission.ts`, existing `FORM_FIELD_NAMES` constant, `RegisterPage`'s summary-error markup as a template reference if adopted
**Requirement**: IDENT-09

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `ForgotPasswordPage` has no local `isInvalid`/`fieldErrorMessage`/`_handleError`/`_handleValidationError` implementations
- [ ] A decision on unmatched-validation-message display is made and applied consistently (not silently left unhandled)
- [ ] `ng test --include='**/forgot-password.spec.ts'` passes with no dropped test cases

**Tests**: unit
**Gate**: quick — `ng test --include='**/forgot-password.spec.ts'`

---

### H9: Migrate `ResetPasswordPage` to `useFormSubmission` [P]

**What**: Same migration, adapted for `ResetPasswordPage`'s two extra wrinkles: (a) it has only one form control (`newPassword`), so `isInvalid()`/`fieldErrorMessage()` become thin no-arg wrappers calling the composable's versions with `this.form.get('newPassword')`; (b) its `_handleError` must keep its own first branch (`bad-request`/`not-found` → `viewState.set('invalid-link')`) before falling through to `useFormSubmission()`'s `handleError` for everything else, per H5's "toolkit, not controller" design; (c) its existing `_handleValidationError` has a fallback generic banner ("Something went wrong, try again") when no `newPassword`-keyed message is found — decide whether that's still needed once `applyValidationErrors`'s unmatched-summary return value is available, or whether it's now redundant with a summary display.

**Where**:
- `src/app/features/identity/auth/reset-password/components/reset-password.ts` (modify)
- `src/app/features/identity/auth/reset-password/components/reset-password.html` (modify only if a summary display is added)
- `src/app/features/identity/auth/reset-password/components/reset-password.spec.ts` (modify)

**Depends on**: H5
**Reuses**: `use-form-submission.ts`
**Requirement**: IDENT-09

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `ResetPasswordPage` has no local `fieldErrorMessage`/duplicate validation-ladder logic — delegates to `useFormSubmission()`
- [ ] The `bad-request`/`not-found` → `invalid-link` branch still fires correctly (this is the one case `useFormSubmission()` deliberately does not own)
- [ ] `ng test --include='**/reset-password.spec.ts'` passes with no dropped test cases

**Tests**: unit
**Gate**: quick — `ng test --include='**/reset-password.spec.ts'`

---

### H10: `AccountPage` — single source of truth + composable adoption

**What**: Two changes to the same file, done together since both touch the same signals:
1. Delete the local `user = signal<iUserResponse | null>(null)`. Read `SessionService.currentUser` directly for display. After `_userService.getMe()` resolves, call `this._sessionService.updateCurrentUser(user)` (from H3) instead of setting a local copy — this is also what keeps `SessionService.currentUser` fresh after a profile fetch, which nothing currently does.
2. Replace the `status: 'loading'|'loaded'|'error'` signal with `useFormSubmission()`'s `submitting`/`banner` vocabulary (from H5) for the `getMe()` load itself, so all five identity-feature components (four auth pages + this one) speak the same loading/error vocabulary. `exporting`/`exportBanner` and `deleting`/`deleteBanner` (the two LGPD actions) can either stay as dedicated local signals (they're not form submissions, `useFormSubmission()` is form-shaped) or become two more `useFormSubmission()` instances if that reads more consistently — pick whichever keeps the template simplest; both are acceptable, this is not a hard requirement, just don't leave the third (`status`) vocabulary in place.

**Where**:
- `src/app/features/identity/user/pages/account/account.ts` (modify)
- `src/app/features/identity/user/pages/account/account.html` (modify — update bindings for whichever signals are renamed/removed)
- `src/app/features/identity/user/pages/account/account.spec.ts` (modify)

**Depends on**: H3, H5
**Reuses**: `SessionService.currentUser`/`updateCurrentUser()`, `use-form-submission.ts`
**Requirement**: IDENT-09

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `AccountPage` has no local `user` signal — template reads `SessionService.currentUser()` (injected, exposed as a protected field)
- [ ] `updateCurrentUser()` is called after a successful `getMe()`
- [ ] The `status: 'loading'|'loaded'|'error'` type and signal no longer exist
- [ ] `ng test --include='**/account.spec.ts'` passes with no dropped test cases

**Tests**: unit
**Gate**: quick — `ng test --include='**/account.spec.ts'`

---

### H11: Update `CLAUDE.md`

**What**: Document the patterns this hardening pass establishes, so future features follow them instead of re-diverging:
- Add `shared/composables/use-form-submission.ts` as the first concrete example under the existing `composables/` bullet in the Folder convention section (currently only names hypothetical examples).
- Add a short note to the "Guards and async app state" section (or a new adjacent bullet) about the `DestroyRef`-based cleanup convention for native listeners (`ThemeService`'s `matchMedia` fix, H2) and the `effect()`-based convention for reacting to cross-service signal changes at the composition root (`App`'s session-end redirect, H4).
- Note in the `SessionService` description (wherever `_API_URL`/session state is currently documented) that it is the sole owner of both the access token and the current-user object — `TokenStorageService` persists only `email`; nothing else should keep a parallel copy of user/session data (point at `updateCurrentUser()` as the sanctioned way to refresh it).

**Where**:
- `CLAUDE.md` (modify)

**Depends on**: H1–H10 (documents the landed state, written last so it doesn't describe an aspirational design that changed mid-implementation)
**Reuses**: N/A
**Requirement**: IDENT-09

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `composables/` bullet references `use-form-submission.ts` as a real, existing example
- [ ] Cleanup conventions (`DestroyRef` for listeners, `effect()` for cross-service reactions) are documented with their concrete file references
- [ ] `SessionService`'s single-source-of-truth responsibility (token + current user) is stated explicitly

**Tests**: none (documentation)
**Gate**: none

---

### H12: Full suite + build gate

**What**: Run the complete verification pipeline after all H1–H11 changes land, matching how the original T-series and M-series phases were closed out.

**Where**: N/A (verification only)

**Depends on**: H1–H11
**Requirement**: IDENT-09

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [ ] `npm test` passes in full (same known baseline: only the pre-existing unrelated `app.spec.ts` "should render title" failure, if it's still unfixed — do not let any *new* failure hide behind that baseline)
- [ ] `npm run build` succeeds (client + server bundles)
- [ ] `npm run lint` passes with no new violations
- [ ] Manual smoke check: log in, view/edit account (confirm profile data matches what login returned), reload while logged in (session restores via `bootstrap()`, no flash), let a token approach expiry or force a `401` (confirm redirect to `/login` still happens via `App`'s effect), export data, attempt delete-account cancel + confirm flows

**Tests**: full suite
**Gate**: full — `npm test && npm run build && npm run lint`

**Commit**: `refactor(identity): fix state duplication, decouple routing from session state, extract shared form-submission composable, fix ThemeService listener leak`
