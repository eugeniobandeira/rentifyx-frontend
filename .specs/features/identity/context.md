# Identity Context

**Gathered:** 2026-07-09
**Spec:** `.specs/features/identity/spec.md`
**Status:** Ready for design (one decision left open, see below — does not block design, blocks final token-storage implementation)

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

## Open Decision (not yet made — flagged, does not block Design)

### Token storage strategy

The user explicitly deferred this ("marque isso como pendente") rather than choosing between: (a) access token in memory + refresh token in `localStorage`, (b) both tokens in `localStorage`, (c) both tokens in `sessionStorage`. Backend returns both tokens as plain JSON (no httpOnly cookie), so no option fully eliminates XSS exposure — this is a real security/UX tradeoff the user wants to revisit deliberately, not something to default silently.

**How Design accommodates this**: `SessionService` depends on a small `TokenStorageService` abstraction (get/set/clear access + refresh token) rather than reading `localStorage`/`sessionStorage` directly. Whichever mechanism is chosen later is a change confined to that one file — nothing in guards, interceptors, or pages needs to change. See `design.md` → `TokenStorageService`.

**This must be resolved before `TokenStorageService` is implemented** (Tasks phase should surface it as a blocking question again if still unresolved).

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
- **"Remember me" toggle / variable session length** — blocked on the token-storage open decision above; revisit once that's settled.
- **Role-based route restrictions (Owner/Renter/Admin)** — no permissions matrix defined in the contract yet; separate future RBAC feature.
- **Cross-tab live session sync** (e.g. via `BroadcastChannel` so logging out in one tab instantly clears others) — edge case in spec.md is handled best-effort (next request/refresh detects it), a live push mechanism is a nice-to-have, not required for MVP.
- **Admin user management UI** — no admin user CRUD endpoints exist in the contract.
