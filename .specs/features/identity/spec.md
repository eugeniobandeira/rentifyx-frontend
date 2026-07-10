# Identity Feature Specification

## Problem Statement

RentityX frontend has no authentication or session capability today — `src/app/core` only has a home page and a theming service. Every future feature (listings, bookings, admin) depends on knowing who the user is and gating routes/requests behind a valid session. We need to implement the full client-side surface of the RentityX Identity API described in `api-contracts.md` — registration, email verification, login, token refresh, logout, password recovery, profile, and LGPD self-service (data export / account deletion) — as the foundation every other feature will build on.

## Goals

- [ ] Implement every endpoint under `Auth` and `Users` in `api-contracts.md` as typed Angular services, matching request/response shapes, validation rules, and error handling exactly (no invented endpoints, no assumed fields).
- [ ] Provide an app-wide session/auth-state layer (current tokens + current user) that guards, interceptors, and any future feature can depend on without re-implementing auth logic.
- [ ] Protect authenticated routes with a guard and attach the bearer token to authenticated requests via an interceptor, including silent token refresh.
- [ ] Ship accessible, mobile-first public auth pages (register, login, verify-email landing, forgot-password, reset-password) that map 1:1 to backend validation rules and error responses.
- [ ] Surface LGPD self-service (export my data, delete my account) to authenticated users, matching the exact post-deletion behavior described in the contract.

## Out of Scope

| Feature | Reason |
|---|---|
| Role-based authorization / per-role route restrictions (Owner/Renter/Admin) | `api-contracts.md` returns a `role` field but defines no permissions matrix or role-gated endpoints yet — premature to build a gate for rules that don't exist. Deferred to a future RBAC feature once the backend defines it. |
| "Resend verification email" | No such endpoint exists in `api-contracts.md`. Cannot be built without inventing a backend contract. |
| Social/OAuth login (Okta, Google, etc.) | `estrutura.md`'s sibling project uses an Okta-based `core/features/security/okta/*` pattern, but `api-contracts.md` defines only first-party email/password JWT auth — the Okta pattern is a different auth model and does not apply here. |
| "Remember me" toggle / alternate session lengths | The underlying token-storage strategy is an open decision (see `context.md`) — a remember-me UI can't be designed until that's settled. |
| Admin user management (list/create/edit/deactivate other users) | `api-contracts.md` only exposes `/users/me` (self-service). No admin user CRUD endpoints exist. |
| Multi-factor authentication | Not present in `api-contracts.md`. |
| Account lockout override / unlock UI | Contract states lockout is time-based (15 min, automatic) with no unlock endpoint — nothing to build beyond surfacing the message. |

---

## User Stories

### P1: User registration ⭐ MVP

**User Story**: As a visitor, I want to create an account with my email, tax ID, password, and role, so that I can start using RentityX once verified.

**Why P1**: Entry point to the whole product — nothing else in this feature is reachable without it.

**Acceptance Criteria**:
1. WHEN the user submits the registration form with valid data THEN the system SHALL call `POST /auth/register` and, on `201`, show a confirmation that a verification email was sent (account status is `PendingVerification`).
2. WHEN the backend returns `422` THEN the system SHALL display the field-level errors returned in `errors` next to their corresponding form fields (email, taxId, password, role, consentGiven), matching the contract's validation rules (email format/length/no disposable domains, password 12–128 chars with upper/lower/digit/symbol, role enum, consent must be true).
3. WHEN the backend returns `409` for a duplicate email or duplicate tax ID THEN the system SHALL show a message distinguishing which field conflicted, without retrying automatically.
4. WHEN the user has not checked the consent checkbox THEN the system SHALL block submission client-side before calling the API (fast-fail on `consentGiven`).

**Independent Test**: Submit the registration form with valid data against a running backend and confirm a `201` response renders the "check your email" confirmation view; submit again with the same email and confirm the `409` message appears.

---

### P1: Email verification ⭐ MVP

**User Story**: As a newly registered user, I want to click the verification link from my email and have the app confirm my account, so that I can log in.

**Why P1**: Login is blocked until this step completes (`Account not active` error otherwise) — required for the vertical slice to be demoable end-to-end.

**Acceptance Criteria**:
1. WHEN the user opens the verification link (containing `email` and `token` query params) THEN the system SHALL call `POST /auth/verify-email` automatically on page load and show a success state on `200` (account now `Active`).
2. WHEN the backend returns `400` (token invalid or expired) THEN the system SHALL show an error state explaining the link expired, with a link back to login (no resend capability, per Out of Scope).
3. WHEN the backend returns `404` (user not found) THEN the system SHALL show a generic "this link is no longer valid" message (no user enumeration detail).

**Independent Test**: Simulate navigating to `/verify-email?email=...&token=...` with a valid token from a real registration and confirm the success view renders; repeat with a malformed token and confirm the error view renders.

---

### P1: Login and session bootstrap ⭐ MVP

**User Story**: As a verified user, I want to log in with my email and password and stay logged in across page reloads, so that I don't have to re-authenticate constantly.

**Why P1**: Core of the feature — every other authenticated capability depends on a working session.

**Acceptance Criteria**:
1. WHEN the user submits valid credentials THEN the system SHALL call `POST /auth/login` with `withCredentials: true` and, on `200`, store the returned `accessToken` and `user` in memory (the `refreshToken` is set by the server as an `httpOnly` cookie and is never present in the response body — the frontend never reads or stores it), then navigate to the post-login destination (home, or the preserved `returnUrl` — see `context.md`).
2. WHEN the backend returns `401` for invalid credentials, inactive account, or a locked account THEN the system SHALL display the distinct message returned by the backend (`Invalid credentials` / `Account not active` / `Account locked`) without leaking which case applies beyond what the backend message says.
3. WHEN the app is reloaded (or opened in a new tab) with a previously persisted session THEN the system SHALL restore the session by calling `POST /auth/refresh` with `withCredentials: true` on bootstrap (relying on the browser automatically attaching the `httpOnly` refresh-token cookie) without forcing the user to log in again, unless that cookie itself is invalid/expired/missing (`422`) — see `context.md` for how the frontend knows which `email` to send on a cold reload.
4. WHEN the user is logged in and navigates to a protected route THEN the system SHALL allow access without an extra login prompt.

**Independent Test**: Log in with valid credentials, reload the browser tab, and confirm the session persists (protected route still accessible) without a visible login flash.

---

### P1: Token refresh and logout ⭐ MVP

**User Story**: As a logged-in user, I want my session to renew automatically before my access token expires, and to be able to log out explicitly, so that I have a continuous, secure session.

**Why P1**: Access tokens expire every 15 minutes — without refresh, any session longer than 15 minutes breaks mid-use, making the app unusable for real sessions.

**Acceptance Criteria**:
1. WHEN the access token is close to expiring (proactive) THEN the system SHALL call `POST /auth/refresh` with the current `email` and `withCredentials: true` (the refresh token itself travels via the `httpOnly` cookie, never in the request body) and replace the stored `accessToken`/`user` with the response before the old token expires.
2. WHEN a request is sent with an already-expired access token (reactive fallback, e.g. clock drift or a missed proactive refresh) THEN the interceptor SHALL attempt one refresh and retry the original request before surfacing an error.
3. WHEN `POST /auth/refresh` itself returns `422` (cookie missing, invalid, or expired) THEN the system SHALL clear the session (including the persisted `email`, see `context.md`) and redirect to `/login`.
4. WHEN the user clicks "logout" THEN the system SHALL call `POST /auth/logout` with the current `email` and `withCredentials: true`, clear all local session state (including the persisted `email`) regardless of the response (endpoint is idempotent, always `204`), and redirect to `/login`.

**Independent Test**: Log in, artificially fast-forward/mock the token's `exp`, and confirm a proactive refresh call fires before expiry; then log out and confirm the protected route redirects to `/login`.

---

### P1: Route protection ⭐ MVP

**User Story**: As the app, I want unauthenticated visitors blocked from protected routes and redirected to login, so that account-specific pages are never rendered without a session.

**Why P1**: Security baseline — without this, protected pages would be reachable by URL regardless of session state.

**Acceptance Criteria**:
1. WHEN an unauthenticated visitor navigates to a protected route THEN the system SHALL redirect to `/login?returnUrl=<attempted path>`.
2. WHEN the user completes login from a guard-triggered redirect THEN the system SHALL navigate to the `returnUrl` if present and safe (same-origin relative path), falling back to home otherwise.

**Independent Test**: While logged out, navigate directly to a protected URL, confirm redirect to `/login?returnUrl=...`, log in, and confirm landing back on the original URL.

---

### P2: Forgot / reset password

**User Story**: As a user who forgot my password, I want to request a reset link by email and set a new password from it, so that I can regain access without contacting support.

**Why P2**: Important for real-world usability but not required to demo the core register→verify→login→session loop.

**Acceptance Criteria**:
1. WHEN the user submits their email on the forgot-password form THEN the system SHALL call `POST /auth/forgot-password` and always show the same generic "check your email" confirmation on `204`, regardless of whether the email exists (per contract's anti-enumeration behavior).
2. WHEN the user opens the reset-password link (`email` + `token` query params) and submits a new password THEN the system SHALL call `POST /auth/reset-password` and, on `204`, show a success state with a link to `/login`.
3. WHEN the backend returns `422` for the new password THEN the system SHALL show the field-level password errors (same rule set as registration: 12–128 chars, upper/lower/digit/symbol).
4. WHEN the backend returns `400` (token invalid/expired) or `404` (user not found) THEN the system SHALL show a generic "this link is no longer valid" error with no user enumeration detail.

**Independent Test**: Trigger forgot-password for both an existing and a non-existent email and confirm both show the identical confirmation message; complete a reset with a valid token and confirm login works with the new password.

---

### P2: View profile

**User Story**: As a logged-in user, I want to see my own account details (email, role, status, created date), so that I can confirm my account information.

**Why P2**: Simple read-only view; useful but not required for the core auth loop to function.

**Acceptance Criteria**:
1. WHEN an authenticated user opens the account page THEN the system SHALL call `GET /users/me` and render the returned `UserResponse` fields.
2. WHEN the call returns `401` THEN the system SHALL treat it like any other expired session (attempt refresh via the interceptor; if that also fails, redirect to `/login`).

**Independent Test**: Log in, open the account page, and confirm the displayed email/role/status/createdAt match the authenticated user.

---

### P3: LGPD self-service — data export & account deletion

**User Story**: As a user exercising my LGPD rights, I want to export all personal data held about me and permanently delete my account, so that I control my own data.

**Why P3**: Legally important but not blocking for an initial usable auth loop; can ship once the core session/profile experience is stable.

**Acceptance Criteria**:
1. WHEN the user requests a data export THEN the system SHALL call `GET /users/me/data-export` and present/download the full JSON payload (id, email, taxId, role, status, createdAt, consentGivenAt, auditHistory).
2. WHEN the user initiates account deletion THEN the system SHALL require an explicit confirmation step before calling `DELETE /users/me` (irreversible, anonymizes email/taxId/password and invalidates all refresh tokens per the contract).
3. WHEN the deletion call returns `204` THEN the system SHALL clear all local session state immediately and redirect to a logged-out state, since the backend has already invalidated all refresh tokens.

**Independent Test**: Log in, request a data export and confirm the downloaded/displayed JSON matches the account, then delete the account and confirm the session is cleared and further authenticated calls fail.

---

## Edge Cases

- WHEN any `POST`/`DELETE` auth or user request returns `429` THEN the system SHALL show a rate-limit message ("too many attempts, try again shortly") rather than a generic error, across every form in this feature.
- WHEN a `422` response's `errors` object contains a field name the current form doesn't render THEN the system SHALL still surface it (e.g. in a summary banner) rather than silently dropping it.
- WHEN the refresh token stored locally is missing or already invalidated (e.g. after `DELETE /users/me` or an explicit logout in another tab) THEN any attempted silent refresh SHALL fail cleanly into the logged-out state, never loop or retry indefinitely.
- WHEN two browser tabs are open and the user logs out in one THEN the other tab SHALL detect the cleared session on its next request/refresh attempt and also drop to logged-out (best-effort — no live cross-tab push mechanism is being built, see `context.md` deferred ideas).
- WHEN `X-Correlation-Id` is present on an error response THEN it MAY be surfaced in developer-facing logs/console for support debugging, never shown as user-facing text.
- WHEN the app is server-rendering (SSR) THEN no token storage or refresh logic SHALL execute on the server — session state resolves only in the browser after hydration.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| IDENT-01 | P1: User registration | Verified | Implemented (T1–T4, T7, T13, T16) — unaffected by the 2026-07-11 contract revision |
| IDENT-02 | P1: Email verification | Verified | Implemented (T3, T7, T14, T16) — unaffected by the 2026-07-11 contract revision |
| IDENT-03 | P1: Login and session bootstrap | Needs rework | Originally implemented (T3, T4, T6, T9, T12, T15, T16); acceptance criteria revised 2026-07-11 for the httpOnly-cookie refresh flow — see `.specs/features/identity/tasks.md` → "Migration: httpOnly Refresh-Token Cookie" |
| IDENT-04 | P1: Token refresh and logout | Needs rework | Originally implemented (T3, T5, T7, T9, T11, T12); acceptance criteria revised 2026-07-11 (422 not 401 on refresh failure, no `refreshToken` field) — see migration task list |
| IDENT-05 | P1: Route protection | Verified | Implemented (T9, T10, T15, T16) — unaffected by the 2026-07-11 contract revision |
| IDENT-06 | P2: Forgot / reset password | Verified | Implemented (T3, T7, T17, T18, T20) — unaffected by the 2026-07-11 contract revision |
| IDENT-07 | P2: View profile | Verified | Implemented (T2, T8, T19, T20) — unaffected by the 2026-07-11 contract revision |
| IDENT-08 | P3: LGPD data export & account deletion | Verified | Implemented (T8, T9, T21) — unaffected by the 2026-07-11 contract revision |

**ID format:** `IDENT-[NUMBER]`
**Status values:** Pending → In Design → In Tasks → Implementing → Verified → Needs rework
**Coverage:** 8 total, 8 originally implemented across T1–T21. The 2026-07-11 `api-contracts.md` revision (httpOnly refresh-token cookie) requires rework of IDENT-03/IDENT-04's implementation; the other 6 requirements are unaffected. The previously-blocking token-storage decision (was blocking only T6) is now moot — resolved by the backend contract, not by us. See `.specs/features/identity/tasks.md` → "Migration: httpOnly Refresh-Token Cookie" for the concrete task breakdown.

---

## Success Criteria

- [ ] Every request/response shape in the implementation matches `api-contracts.md` exactly — no extra/missing fields, no invented endpoints.
- [ ] A user can complete register → verify-email → login → view protected content → refresh (automatically) → logout, entirely through the UI, against a running backend.
- [ ] A user can recover a forgotten password end-to-end without developer intervention.
- [ ] A user can export their data and delete their account, with the account rendered unusable immediately after (session cleared, further authenticated calls fail).
- [ ] No raw hex colors or ad-hoc styling — auth pages consume the semantic tokens from the color-system feature (`.specs/features/color-system/`).
- [ ] All new code respects the strict TypeScript flags already enabled in `tsconfig.json` and the one-interface-per-file convention.
