# Identity Design

**Spec**: `.specs/features/identity/spec.md`
**Context**: `.specs/features/identity/context.md`
**Status**: Draft

---

## Architecture Overview

Three layers, split across `core/` (cross-cutting session/route infra, per `CLAUDE.md`) and `features/identity/` (domain services + DTOs matching `api-contracts.md`):

1. **HTTP layer** (`features/identity/auth`, `features/identity/user`) — thin, stateless services that call the 9 endpoints in `api-contracts.md` and return typed Observables. No token/session logic lives here.
2. **Session layer** (`core/services`) — `SessionService` owns the current tokens + current user as signals, orchestrates login/logout/refresh, and schedules the proactive refresh timer. `TokenStorageService` isolates the still-open storage-mechanism decision (`context.md`) behind `get/set/clear`.
3. **App-shell integration** (`core/guards`, `core/interceptors`, `core/pages`) — `authGuard` protects routes, `authInterceptor` attaches the bearer token and handles reactive refresh-on-401, and the public/authenticated pages consume `SessionService` + the HTTP-layer services.

```mermaid
graph TD
    subgraph "features/identity/auth"
        AuthSvc["AuthService<br/>register, login, refresh, logout,<br/>verifyEmail, forgotPassword, resetPassword"]
    end
    subgraph "features/identity/user"
        UserSvc["UserService<br/>getMe, deleteMe, exportMyData"]
    end
    subgraph "core/services"
        SessionSvc["SessionService<br/>accessToken/refreshToken/currentUser signals<br/>login(), logout(), bootstrap(), scheduleRefresh()"]
        TokenStore["TokenStorageService<br/>get/set/clear(access, refresh)<br/>[storage mechanism: OPEN DECISION]"]
    end
    subgraph "core (app shell)"
        Guard["authGuard<br/>CanActivateFn"]
        Interceptor["authInterceptor<br/>HttpInterceptorFn"]
        Pages["Pages: login, register, verify-email,<br/>forgot-password, reset-password, account"]
    end

    Pages --> AuthSvc
    Pages --> UserSvc
    Pages --> SessionSvc
    SessionSvc --> AuthSvc
    SessionSvc --> TokenStore
    Guard --> SessionSvc
    Interceptor --> SessionSvc
    Interceptor -->|attaches Bearer token to| UserSvc
    Interceptor -->|attaches Bearer token to| AuthSvc
```

### Token refresh sequence (proactive + reactive, per `context.md`)

```mermaid
sequenceDiagram
    participant App as App bootstrap
    participant Session as SessionService
    participant Store as TokenStorageService
    participant API as Identity API
    participant Interceptor as authInterceptor

    App->>Session: bootstrap() (app init, browser only)
    Session->>Store: get persisted refreshToken
    alt refresh token present
        Session->>API: POST /auth/refresh
        API-->>Session: 200 LoginResponse (new tokens)
        Session->>Store: persist new tokens
        Session->>Session: decode exp, scheduleRefresh(exp - 60s)
    else no refresh token
        Session->>Session: stay logged out
    end

    Note over Session: later, timer fires ~60s before exp
    Session->>API: POST /auth/refresh
    API-->>Session: 200 LoginResponse
    Session->>Store: persist new tokens
    Session->>Session: reschedule timer

    Note over Interceptor: fallback path, any authenticated request
    Interceptor->>API: request with expired access token
    API-->>Interceptor: 401
    Interceptor->>Session: refresh() (single in-flight, deduped)
    Session->>API: POST /auth/refresh
    alt refresh succeeds
        API-->>Session: 200 LoginResponse
        Interceptor->>API: retry original request with new token
    else refresh fails (401)
        Session->>Session: clear session
        Interceptor->>App: redirect to /login
    end
```

---

## Code Reuse Analysis

### Existing to leverage

| Component | Location | How to Use |
|---|---|---|
| Semantic color tokens (`bg-brand-default`, `text-status-*`, feedback tokens) | `src/styles.css` (color-system feature) | All auth pages/forms/badges use these exclusively — never a raw hex, per `CLAUDE.md` and `COLOR-01` |
| `ThemeService` pattern (`core/services/theme.service.ts`) | `src/app/core/services/` | Structural precedent: `SessionService`/`TokenStorageService` follow the same signal-based, SSR-safe (`PLATFORM_ID`/`DOCUMENT`-guarded) service style already established there |
| Path aliases (`@core/*`, `@features/*`, `@shared/*`) | `tsconfig.json` | All new imports across this feature use aliases, never deep relative paths |
| `noImplicitOverride`, `strictInputAccessModifiers`, etc. | `tsconfig.json` | All new services/components written compatible with strict mode from the start |

### Integration points

| System | Integration Method |
|---|---|
| `api-contracts.md` | Source of truth for every DTO field, validation rule, status code, and error shape below — verified against it, not assumed |
| `app.config.ts` | Register `authInterceptor` via `provideHttpClient(withInterceptors([authInterceptor]))`; trigger `SessionService.bootstrap()` once at startup (browser-only) |
| `app.routes.ts` | Add public auth routes (lazy `loadComponent`) and a protected route group behind `authGuard`; existing `HomePage` route and wildcard redirect untouched |
| SSR (`@angular/ssr`) | `SessionService`/`TokenStorageService` must no-op on the server (guard all `localStorage`/timer code behind `isPlatformBrowser`), same pattern as `ThemeService` |
| Future features (listings, bookings) | Will depend on `SessionService.currentUser()` / `authGuard` / `authInterceptor` exactly as built here — this is intentionally the reusable foundation, not a one-off |

---

## Components

### `AuthService`

- **Purpose**: Stateless HTTP wrapper for the 7 `/auth/*` endpoints.
- **Location**: `src/app/features/identity/auth/services/auth.service.ts`
- **Interfaces**:
  - `register(request: RegisterRequest): Observable<UserResponse>` — `POST /auth/register`
  - `login(request: LoginRequest): Observable<LoginResponse>` — `POST /auth/login`
  - `refresh(request: RefreshRequest): Observable<LoginResponse>` — `POST /auth/refresh`
  - `logout(request: LogoutRequest): Observable<void>` — `POST /auth/logout`
  - `verifyEmail(request: VerifyEmailRequest): Observable<UserResponse>` — `POST /auth/verify-email`
  - `forgotPassword(request: ForgotPasswordRequest): Observable<void>` — `POST /auth/forgot-password`
  - `resetPassword(request: ResetPasswordRequest): Observable<void>` — `POST /auth/reset-password`
- **Dependencies**: `HttpClient`
- **Reuses**: nothing yet — first HTTP service in the app; sets the pattern future feature services will follow (no `BaseHttpService` abstraction yet — see Tech Decisions)

### `UserService`

- **Purpose**: Stateless HTTP wrapper for the 3 `/users/me*` endpoints.
- **Location**: `src/app/features/identity/user/services/user.service.ts`
- **Interfaces**:
  - `getMe(): Observable<UserResponse>` — `GET /users/me`
  - `deleteMe(): Observable<void>` — `DELETE /users/me`
  - `exportMyData(): Observable<DataExportResponse>` — `GET /users/me/data-export`
- **Dependencies**: `HttpClient` (auth header attached by `authInterceptor`, not manually)
- **Reuses**: same pattern as `AuthService`

### `TokenStorageService`

- **Purpose**: Sole point of contact with the browser storage mechanism for tokens — isolates the open decision in `context.md` so it's a one-file change later.
- **Location**: `src/app/core/services/token-storage.service.ts`
- **Interfaces**:
  - `getAccessToken(): string | null`
  - `getRefreshToken(): string | null`
  - `setTokens(accessToken: string, refreshToken: string): void`
  - `clear(): void`
- **Dependencies**: `PLATFORM_ID` (no-op on server)
- **Reuses**: `ThemeService`'s SSR-guard pattern
- **Note**: initial implementation placeholder only persists via a mechanism to be confirmed (see Tech Decisions) — every call site depends on this interface, not the mechanism, so the pending decision cannot leak into guards/interceptors/pages.

### `SessionService`

- **Purpose**: Single source of truth for "am I logged in, as whom, with what token" — orchestrates `AuthService` calls, `TokenStorageService` persistence, and the proactive refresh timer.
- **Location**: `src/app/core/services/session.service.ts`
- **Interfaces**:
  - `currentUser: Signal<UserResponse | null>`
  - `isAuthenticated: Signal<boolean>` (computed from `currentUser`)
  - `accessToken(): string | null` (read for the interceptor; not a signal, read synchronously per-request)
  - `bootstrap(): void` — called once at app start; if a refresh token is persisted, silently refreshes to restore the session, else stays logged out. Browser-only (no-op on server).
  - `login(request: LoginRequest): Observable<UserResponse>` — calls `AuthService.login`, persists tokens, sets `currentUser`, schedules refresh
  - `logout(): Observable<void>` — calls `AuthService.logout` with current email/refreshToken, then clears state regardless of response (endpoint is idempotent per contract)
  - `refresh(): Observable<UserResponse>` — used by both the proactive timer and the reactive interceptor fallback; **deduplicated** (concurrent callers share one in-flight refresh instead of firing N parallel `/auth/refresh` calls)
  - `clearSession(): void` — internal, used by `logout()` and by refresh-failure paths
- **Dependencies**: `AuthService`, `TokenStorageService`, `Router` (for logout/refresh-failure redirects), `PLATFORM_ID`
- **Reuses**: `ThemeService`'s signal + SSR-guard structure as the established precedent for `core/services`

### `authGuard`

- **Purpose**: Blocks unauthenticated navigation to protected routes.
- **Location**: `src/app/core/guards/auth.guard.ts`
- **Interfaces**: `authGuard: CanActivateFn` — returns `true` if `SessionService.isAuthenticated()`, else `router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })`
- **Dependencies**: `SessionService`, `Router`
- **Reuses**: none yet — first guard in the app

### `authInterceptor`

- **Purpose**: Attaches `Authorization: Bearer {accessToken}` to outgoing requests targeting the API, and handles the reactive refresh-and-retry fallback on `401`.
- **Location**: `src/app/core/interceptors/auth.interceptor.ts`
- **Interfaces**: `authInterceptor: HttpInterceptorFn`
- **Behavior**:
  - Skips attaching a token for the unauthenticated auth endpoints (`register`, `login`, `refresh`, `logout`, `verify-email`, `forgot-password`, `reset-password`) — these never need a bearer token.
  - For all other requests, attaches the current access token if present.
  - On `401` from an authenticated request (not from `/auth/refresh` itself, to avoid infinite loop), calls `SessionService.refresh()` once, retries the original request on success, or propagates the error (triggering `SessionService.clearSession()` + redirect) on failure.
- **Dependencies**: `SessionService`
- **Reuses**: none yet — first interceptor in the app

### Pages: `RegisterPage`, `LoginPage`, `VerifyEmailPage`, `ForgotPasswordPage`, `ResetPasswordPage`

- **Purpose**: Public, unauthenticated route components implementing IDENT-01, 02, 03, 06.
- **Location**: `src/app/core/pages/{register,login,verify-email,forgot-password,reset-password}/`
- **Rationale for `core/pages` (not `features/identity/*/pages`)**: `CLAUDE.md` explicitly lists `login` among `core`'s "top-level pages (home, login, not-found, access-denied)" — register/verify-email/forgot-password/reset-password are the same category of unauthenticated, app-shell-level route, not per-entity CRUD pages, so they follow the same placement as `login` for consistency.
- **Interfaces**: standalone components, reactive forms (`ReactiveFormsModule`), each injecting the relevant service(s) (`AuthService` directly for stateless calls like verify/forgot/reset; `SessionService.login()` for the login page; `AuthService.register()` for register since no session exists yet).
- **Dependencies**: Angular reactive forms, `AuthService`, `SessionService` (login only), `ActivatedRoute` (verify-email/reset-password read `email`/`token` query params)
- **Reuses**: color-system semantic tokens for all styling; no shared form/input UI kit exists yet (`shared/ui/input`, `.../button` are `estrutura.md` blueprint aspirations, not built) — this feature builds plain Tailwind-styled native `<input>`/`<button>` elements now; extracting a shared `ui/input`/`ui/button` kit is deferred until a second feature needs the same primitives (see Tech Decisions — avoids a premature abstraction built for a single consumer).

### `AccountPage`

- **Purpose**: Authenticated profile view + LGPD self-service (IDENT-07, IDENT-08).
- **Location**: `src/app/features/identity/user/pages/account/account.ts`
- **Rationale for placement in `features/identity/user/pages`**: unlike the public auth pages, this is authenticated, entity-specific content (the `User` resource) — matches `CLAUDE.md`'s `features/<domain>/<entity>/pages/` convention.
- **Interfaces**: renders `UserService.getMe()` result; "Export my data" triggers `UserService.exportMyData()` and downloads the JSON as a file; "Delete my account" opens a type-to-confirm dialog before calling `UserService.deleteMe()`, then `SessionService.clearSession()` + redirect to `/login`.
- **Dependencies**: `UserService`, `SessionService`, `Router`
- **Reuses**: color-system tokens; no shared dialog/modal component exists yet — a minimal inline confirm (native `<dialog>` or a small local component) is used rather than building a generic `shared/ui/form-dialog` for one caller (same premature-abstraction reasoning as above)

### `decodeJwtExpiry` utility

- **Purpose**: Extract the `exp` (Unix seconds) claim from a JWT's payload segment client-side, no signature verification (verification is the backend's job — this is purely to schedule the proactive refresh timer).
- **Location**: `src/app/shared/utils/decode-jwt-expiry.util.ts`
- **Interfaces**: `decodeJwtExpiry(token: string): number | null` — base64url-decodes the middle JWT segment via `atob`, parses `exp`, returns `null` on any malformed input (never throws)
- **Dependencies**: none (browser-native `atob`; guarded from SSR by only ever being called inside `SessionService` code paths that are already browser-only)
- **Reuses**: none — no JWT-decoding library is added; hand-rolling ~10 lines avoids pulling in a dependency for something this small, per `CLAUDE.md`'s guidance against loading libraries for what a small utility can do

---

## Data Models

One interface per file, under `features/identity/auth/interfaces/` and `features/identity/user/interfaces/`, matching `api-contracts.md` exactly.

```typescript
// features/identity/auth/interfaces/register-request.ts
interface RegisterRequest {
  email: string;
  taxId: string;
  password: string;
  role: 'Owner' | 'Renter' | 'Admin';
  consentGiven: true;
}

// features/identity/auth/interfaces/login-request.ts
interface LoginRequest {
  email: string;
  password: string;
}

// features/identity/auth/interfaces/refresh-request.ts
interface RefreshRequest {
  email: string;
  refreshToken: string;
}

// features/identity/auth/interfaces/logout-request.ts
interface LogoutRequest {
  email: string;
  refreshToken: string;
}

// features/identity/auth/interfaces/verify-email-request.ts
interface VerifyEmailRequest {
  email: string;
  token: string;
}

// features/identity/auth/interfaces/forgot-password-request.ts
interface ForgotPasswordRequest {
  email: string;
}

// features/identity/auth/interfaces/reset-password-request.ts
interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

// features/identity/auth/interfaces/login-response.ts
// imports UserResponse from '@features/identity/user/interfaces/user-response'
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

// features/identity/user/interfaces/user-response.ts
type UserRole = 'Owner' | 'Renter' | 'Admin';
type UserStatus = 'PendingVerification' | 'Active' | 'Deleted';

interface UserResponse {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string; // ISO 8601 with offset
}

// features/identity/user/interfaces/audit-log-entry-record.ts
interface AuditLogEntryRecord {
  eventType: string;
  occurredAt: string; // ISO 8601 with offset
}

// features/identity/user/interfaces/data-export-response.ts
// imports AuditLogEntryRecord from './audit-log-entry-record'
interface DataExportResponse {
  id: string;
  email: string;
  taxId: string;
  role: string;
  status: string;
  createdAt: string;
  consentGivenAt: string | null;
  auditHistory: AuditLogEntryRecord[];
}

// shared/interfaces/validation-error-response.ts (422 shape, reused by every feature hitting this API)
interface ValidationErrorResponse {
  title: string;
  status: 422;
  errors: Record<string, string[]>;
  extensions: { correlationId: string | null };
}

// shared/interfaces/api-error-response.ts (400/401/404/409/429/500 shape, reused app-wide)
interface ApiErrorResponse {
  title: string;
  status: number;
  extensions: { correlationId: string | null };
}
```

**Relationships**: `LoginResponse.user` is a `UserResponse`. `DataExportResponse.auditHistory` is `AuditLogEntryRecord[]`. `ValidationErrorResponse`/`ApiErrorResponse` are not identity-specific — they're the backend's universal error envelope, so they live in `shared/interfaces/` (per `CLAUDE.md`'s `shared/interfaces` convention) since every future feature calling this same API will hit the same two shapes; putting them under `features/identity` would force a duplicate later.

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
|---|---|---|
| `422` on register/login/reset-password forms | Map `errors[field]` to the matching form control's error state | Field-level red text under each invalid input, matching backend wording |
| `422` field not present in the rendered form | Collected into a summary banner at the top of the form | User still sees the error, just not inline |
| `409` on register (duplicate email or tax ID) | Show a message identifying which field conflicted, focus that field | User can correct just that field and resubmit |
| `401` "Invalid credentials" / "Account not active" / "Account locked" on login | Render the backend's exact `title` text in an inline form-level error | User sees precisely why login failed, per contract wording |
| `401` on any authenticated request (expired token) | `authInterceptor` attempts one silent refresh + retry before this ever reaches the UI | Invisible to the user in the common case |
| `401` on `/auth/refresh` itself | `SessionService.clearSession()`, redirect to `/login` (optionally with a "session expired" query flag) | User is logged out and told to sign in again |
| `429` on any form in this feature | Generic rate-limit banner: "Too many attempts — try again shortly" | Consistent messaging across register/login/forgot-password/reset-password |
| `400`/`404` on verify-email or reset-password (invalid/expired token, user not found) | Generic "this link is no longer valid" error view | No user-enumeration detail leaked, per contract's anti-enumeration intent |
| `204` on forgot-password (always, regardless of email existence) | Always show the same "check your email" confirmation | Enumeration-safe by construction — UI never branches on this response |
| Network/timeout error (no HTTP response) | Generic "couldn't reach the server, check your connection" banner | Distinguished from a `4xx`/`5xx` business error |
| `500` | Generic "something went wrong, try again" banner | No internal detail exposed |

---

## Tech Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Token storage mechanism | **Open — not decided.** `TokenStorageService` built as an abstraction now; concrete mechanism (memory+localStorage / localStorage / sessionStorage) chosen later per `context.md`. | User explicitly deferred this real security tradeoff rather than accepting a default; the abstraction means Tasks/Execute can proceed on everything else without blocking on it. |
| JWT expiry reading | Hand-rolled `decodeJwtExpiry()` util (base64url decode + JSON parse of the payload segment), no library | Reading one numeric claim doesn't justify a dependency; `CLAUDE.md` explicitly discourages pulling in libraries for what a small utility can do |
| Refresh deduplication | `SessionService.refresh()` shares one in-flight `Observable` (e.g. via a stored `Observable` reference cleared on completion) across concurrent callers | Both the proactive timer and multiple parallel `401`s from the interceptor could otherwise fire simultaneous `/auth/refresh` calls, which is wasteful and could race on token persistence |
| `BaseHttpService` / shared HTTP abstraction | **Not built yet.** `AuthService`/`UserService` call `HttpClient` directly. | `estrutura.md` shows `shared/services/base-http.service.ts` in the aspirational blueprint, but with only one feature (`identity`) consuming HTTP so far, extracting a base class now is a premature abstraction for a single caller — build it when a second feature needs the same pattern, per `CLAUDE.md`'s root guidance against speculative abstractions |
| Shared UI kit (`shared/ui/input`, `button`, `form-dialog`) | **Not built yet.** Auth pages use plain Tailwind-styled native elements. | Same reasoning — `estrutura.md`'s `shared/ui/*` kit is blueprint-aspirational; building a generic kit for this feature's exact needs alone risks guessing wrong about the API a second consumer will need |
| Auth page placement | `core/pages/*` for register/login/verify-email/forgot-password/reset-password; `features/identity/user/pages/account` for the authenticated profile/LGPD page | Follows `CLAUDE.md`'s explicit split: `core` owns top-level/public shell pages (login named explicitly), `features/<domain>/<entity>` owns authenticated entity-specific pages |
| Session bootstrap trigger | Called once from the root `App` component's constructor (via `inject(SessionService).bootstrap()`), not `APP_INITIALIZER` | Keeps it simple and colocated with the shell component that already exists; `APP_INITIALIZER` would delay first paint waiting on a network call, which conflicts with SSR/hydration — bootstrap should happen post-hydration, browser-only, without blocking initial render |
| Account deletion confirmation | Type-to-confirm pattern (user types a confirmation word/their email before the delete button enables) | Action is irreversible and anonymizes PII/invalidates all sessions per the contract — a single "are you sure?" click is too easy to hit by accident for a destructive LGPD action |
| Okta pattern from `estrutura.md` | **Not reused.** No Okta/OAuth code, no `okta-callback` page. | `api-contracts.md` defines only first-party email/password JWT auth; the sibling project's Okta pattern is a different auth model entirely and would be fabricating capability the backend doesn't have |

---

## Open Verification Item

`TokenStorageService`'s concrete storage mechanism is unresolved (see `context.md`). Before Tasks defines the implementation task for that file, re-surface the three options to the user for a final decision — do not default silently.

---

## Tips carried into next phase

- Natural task breakdown: (1) shared error-envelope interfaces, (2) identity DTOs + `AuthService`/`UserService`, (3) `TokenStorageService` (blocked on open decision) + `decodeJwtExpiry` util, (4) `SessionService`, (5) `authGuard` + `authInterceptor` + `app.config.ts`/`app.routes.ts` wiring, (6) public pages (register → verify-email → login → forgot/reset password), (7) `AccountPage` (profile + LGPD export/delete).
- P1 stories (IDENT-01 through 05) form one coherent vertical slice and should likely be one task group; P2 (IDENT-06, 07) and P3 (IDENT-08) can follow as separate, smaller groups — large enough overall that Tasks should NOT be skipped for this feature.
