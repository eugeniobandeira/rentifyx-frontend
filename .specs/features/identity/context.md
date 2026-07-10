# Identity Context

**Gathered:** 2026-07-09 (revised 2026-07-11 — `api-contracts.md` changed to httpOnly refresh-token cookies, resolving the token-storage decision)
**Spec:** `.specs/features/identity/spec.md`
**Status:** Token-storage decision RESOLVED by contract change (see below). One new, narrower decision resolved in this revision too (email persistence for bootstrap).

---

## Feature Boundary

Implement the full client-side surface of the RentityX Identity API (`api-contracts.md`): registration, email verification, login, token refresh, logout, forgot/reset password, profile view, and LGPD self-service (data export, account deletion), plus the app-wide session/guard/interceptor infrastructure everything else depends on.

---

## Implementation Decisions

### Token refresh strategy

- **Proactive + reactive.** Decode the JWT's `exp` claim client-side (no signature verification needed on the frontend — that's the backend's job) and schedule a refresh ~60 seconds before expiry. The auth interceptor still handles a `401` reactively as a fallback (clock drift, missed timer, tab woken from sleep) by refreshing once and retrying the original request.

### Route guard behavior

- Unauthenticated access to a protected route redirects to `/login?returnUrl=<attempted path>`. After successful login, navigate to `returnUrl` if present and safe (same-origin relative path only — never redirect to an absolute/external URL from a query param), otherwise fall back to home.

### Post-registration UX

- Dedicated "check your email" confirmation view after a successful `POST /auth/register` (`201`). No separate route — the register page swaps to a confirmation state locally (there's no token/email yet to act on, so a route change would add no value). The user must click the emailed verification link to proceed; there is no resend capability (no such endpoint exists in `api-contracts.md`).

---

## Resolved Decisions (2026-07-11 revision — `api-contracts.md` changed)

### Token storage strategy — RESOLVED by the backend, not by us

`api-contracts.md` was revised: `POST /auth/login` and `POST /auth/refresh` no longer return `refreshToken` in the JSON body — it is now set by the server as an `httpOnly`, `Secure`, `SameSite=Strict` cookie (`Path=/api/v1/auth`), invisible to JavaScript entirely. The contract is now explicit: *"`accessToken` — keep in memory only… never in `localStorage`/`sessionStorage`… `refreshToken` — never touched by frontend code."* This closes the previously-open decision (memory+localStorage / localStorage / sessionStorage) — none of those options apply anymore. `TokenStorageService` no longer stores a refresh token at all (nothing to store — the browser's cookie jar owns it); it keeps `accessToken` in memory only, exactly like before.

### Email persistence for bootstrap — NEW decision, resolved

**The gap this closes**: `POST /auth/refresh`'s request body is `{ email: string }` — the refresh token itself comes from the cookie, but the endpoint still needs to know *whose* cookie to validate against. On a full page reload, all in-memory JS state (including any previously-known email) is wiped, but the httpOnly cookie survives. Without persisting the email somewhere, `bootstrap()` would have no way to call `/auth/refresh` after a reload, silently breaking session persistence (spec.md IDENT-03 AC3) even though the cookie is still valid.

**Decision** (confirmed with the user): persist only the user's **email** (not any token) in `localStorage`, keyed separately from token state. Email is not sensitive — it's already rendered in the UI (`AccountPage`) and isn't itself a bearer credential. On `bootstrap()`:
1. Read the persisted email from `localStorage`. If absent, stay logged out (no API call).
2. If present, unconditionally call `POST /auth/refresh` with `{ email }` and `withCredentials: true` (browser attaches the httpOnly cookie automatically).
3. `200` → restore the session (new `accessToken` + `user`, re-persist email in case it changed). `422` (cookie missing/invalid/expired) → treat as logged out, clear the persisted email too.

**UX requirement surfaced by this**: the root `App` component needs a "restoring session" loading state while this bootstrap call is in flight, so the UI doesn't flash between logged-out and logged-in on every reload — this wasn't needed before (bootstrap was previously synchronous-ish against in-memory-only state that was never actually being restored, since `TokenStorageService` was a non-persistent stub; now it's a real, always-async network round trip on every cold load).

---

## Agent's Discretion

- Exact page layout/wording for register, login, verify-email, forgot-password, reset-password, and account pages (within the mobile-first, Tailwind-token-only conventions already established).
- LGPD account-deletion confirmation UX (e.g. type-to-confirm) — will default to a type-the-word-to-confirm pattern given the action is irreversible and anonymizes PII, documented in `design.md`.
- Exact route paths/naming (e.g. `/verify-email` vs `/auth/verify-email`) and whether pages live under `core/pages` vs a dedicated feature folder — architecture call, resolved in `design.md`.
- Error message copy beyond what the backend returns verbatim (e.g. framing around a `429` rate-limit message).

---

## Specific References

None — no existing auth UI mockup or reference product was named. Open to a standard, professional marketplace auth flow consistent with the color-system's "trust & security" brand personality.

---

## Deferred Ideas

- **Resend verification email** — would require a new backend endpoint not present in `api-contracts.md`. Out of scope until the contract adds it.
- **"Remember me" toggle / variable session length** — the refresh-token cookie is fixed at 30 days server-side with no frontend control over its lifetime per `api-contracts.md`; a "remember me" toggle would need a new backend capability (variable cookie `Max-Age`) that doesn't exist yet.
- **Role-based route restrictions (Owner/Renter/Admin)** — no permissions matrix defined in the contract yet; separate future RBAC feature.
- **Cross-tab live session sync** (e.g. via `BroadcastChannel` so logging out in one tab instantly clears others) — edge case in spec.md is handled best-effort (next request/refresh detects it), a live push mechanism is a nice-to-have, not required for MVP.
- **Admin user management UI** — no admin user CRUD endpoints exist in the contract.
