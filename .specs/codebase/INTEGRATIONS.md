# External Backend Integrations

Mapped 2026-07-17 from the actual backend source (not assumed), to keep the frontend's identity feature aligned with reality. Update this file whenever a backend contract changes — treat it as more current than any doc it summarizes if they ever disagree, but re-verify against the live repo before trusting it after a long gap.

## rentifyx-identity-api

Repo: `C:\Users\Eugenio\Projects\study\rentifyx-identity-api` (separate repo, not a submodule).

- **Authoritative contract doc**: `docs/api-contracts.md` in that repo — 533 lines, explicit and implementation-verified. Prefer reading it directly over this summary for anything not covered below.
- Base URL: `{host}/api/v1` (matches `environment.apiUrl` convention already in this repo — no change needed).
- CORS: `Cors:AllowedOrigins` config key in that repo's `appsettings.json`, currently only `http://localhost:3000`. **Confirm this frontend's dev/prod origin is added there** before integration testing — otherwise every request fails at the CORS layer regardless of the frontend code being correct.
- Auth: Bearer JWT (RS256, `sub`/`email`/`role` claims, 15-min expiry, zero clock skew) in the response body as `accessToken`; refresh token is a separate httpOnly, `SameSite=Strict`, `Path=/api/v1/auth`-scoped cookie named `refreshToken` (30-day expiry) — never in any JSON body. This already matches how this frontend's `SessionService`/`auth.interceptor.ts` are built.
- Error shape: RFC7807 ProblemDetails. Validation → `422` with a FluentValidation-keyed `errors` dict. Business errors → `Results.Problem` with a `correlationId` extension. Unhandled exceptions → `500` with `correlationId`+`traceId`+`exceptionType`+`exceptionMessage` extensions (the backend does not scrub exception details per-environment — don't display `exceptionMessage` to end users).
- Endpoints this frontend consumes (all under `/api/v1`): `POST auth/{register,login,refresh,logout,verify-email,forgot-password,reset-password}`, `GET users/me`, `DELETE users/me`, `GET users/me/data-export`, `GET/PUT users/me/consent` (the last pair landed 2026-07-17 as `IDENT-10`, `ConsentService`, task breakdown "Consent Alignment" C1–C6 in `.specs/features/identity/tasks.md` — no longer a gap).
- All endpoints documented in `docs/api-contracts.md` as of the 2026-07-17 mapping are now consumed. No known open gap against this backend.
- Historical drift found 2026-07-17, fixed by `IDENT-10`: `iUserResponse`/`iDataExportResponse` were missing consent fields the backend returns. Three different consent-field naming schemes exist across three backend DTOs (`UserResponse` uses `essentialConsentGranted`/etc., `UserDataExportResponse` uses a plain `consentGivenAt` + `essentialConsentRevokedAt`, `ConsentResponse` for the dedicated consent endpoint uses `essentialGranted`/etc. with no `Consent` infix at all) — mirrored exactly, not unified client-side.
- No committed OpenAPI/Swagger file — spec is generated at runtime only in that repo's Development environment (`/openapi/v1.json`, Scalar UI at `/scalar`). No static artifact to codegen against; `docs/api-contracts.md` is the closest thing.

## rentifyx-communications-api

Repo: `C:\Users\Eugenio\Projects\study\rentifyx-communications-api` (separate repo, not a submodule).

- **Decision (2026-07-17): this frontend does not integrate with this service directly.** See the Out of Scope table in `.specs/features/identity/spec.md`. Reason: every endpoint requires a static `X-Api-Key` header, explicitly documented in that repo as "no identity-api/JWT coupling this cycle" (their AD-011) — embedding that key in an Angular SPA would expose a service-to-service secret client-side. Revisit only once a BFF/proxy exists to hold the key server-side.
- What it actually does: channel-agnostic notification service, v1 = email-only delivery via AWS SES, triggered by a `NotificationRequested` Kafka event produced by other backends (including identity-api). **Notification dispatch is Kafka-only — there is no HTTP endpoint to request a notification be sent**, and no real-time channel (no SignalR/WebSocket/SSE) to push delivery status to a frontend; status can only be polled.
- The 4 HTTP endpoints that exist (`GET notifications/{id}`, `GET notifications/recipient/{recipientId}`, `GET/PUT consent/{recipientId}`) are backend-facing per the `X-Api-Key` scheme above, not meant for direct browser consumption as currently built.
- Its consent model is per-**channel** (Email/SMS/Push opt-in per recipient) — a distinct concept from identity-api's per-**purpose** consent (Essential/Marketing) that this frontend does surface (`IDENT-10`). Don't conflate the two if this integration is revisited later.
- Kafka (topics: `notification-requested` + retry/DLQ variants) is entirely backend-to-backend. The frontend must never talk to Kafka directly, and nothing in that repo suggests otherwise.
