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

## rentifyx-asset-registry-api

Repo: `C:\Users\Eugenio\Projects\study\rentifyx-asset-registry-api` (separate repo, not a submodule).

- **Mapped 2026-07-25.** No `docs/api-contracts.md` in this repo (unlike identity-api) — the
  authoritative sources are the endpoint files under
  `02-src/01-Api/RentifyxAssetRegistry.Api/Endpoints/{Assets,Categories}/` plus, critically, an
  **in-flight feature spec**: `.specs/features/e05-security-hardening-authz/{spec.md,design.md}`.
  This frontend must integrate against the contract **e05 produces**, not the `AllowAnonymous`
  contract currently in the working tree — e05 is being implemented in parallel with this mapping
  and the body shapes below reflect the *post-e05* target.
- Base URL: `{host}/api/v1` (same convention as identity-api).
- Auth: same JWT as identity-api — RS256, validated against identity-api's public key (no shared
  secret, ADR-AR-001). **Claims are `sub` (user GUID), `email`, `role` (bare `"role"` claim type —
  not `ClaimTypes.Role`, must set `RoleClaimType="role"` — irrelevant to this frontend, but explains
  why the backend enforces roles the way it does).** This is the exact same access token
  `SessionService` already holds after login — no second login/token exchange needed. Reuse
  `SessionService.accessToken()` / the existing `authInterceptor` unchanged; asset-registry calls
  are Bearer-token calls, never `withCredentials` cookie calls (that pattern is auth-endpoint-only,
  identity-api-specific).
- **Pre-e05 (current code) vs. post-e05 (target contract) — do not build against the former:**
  today all 10 endpoints are `AllowAnonymous` and 7 of them take `ownerId`/`isAdmin` as plain JSON
  body fields (spoofable, temporary since F-13). Post-e05: `ownerId`/`isAdmin` are removed from
  every request body and derived server-side from the JWT's `sub`/`role` claims; every endpoint
  except `GetAssetById`, `SearchAssets`, `ListCategories` requires `Authorization: Bearer`; `GetAssetById`
  additionally requires auth (was fully public) and gates non-`Active` assets to owner-or-admin.
  `SearchAssets`/`ListCategories` stay public, no request/response change.
- Error shape: same `ErrorOr`→`ProblemDetails` pattern as identity-api (`errors.ToProblem(httpContext)`).
  401 for missing/invalid/expired JWT, 403 (`ErrorType.Forbidden`) for authenticated-but-wrong-owner
  or non-admin-on-admin-endpoint, 404 for missing resources, 422 for validation, plus per-handler
  business errors (e.g. wrong asset status for a transition).
- **10 endpoints, all under `/api/v1`** (method — route — auth post-e05 — notes):
  | Endpoint | Method/Route | Auth (post-e05) | Body change from today |
  |---|---|---|---|
  | CreateAsset | `POST /assets` | Bearer (any role) | body loses `ownerId`; `title`(3-100)/`description`(10-2000)/`price`/`categoryId`/`idempotencyKey` unchanged |
  | GetAssetById | `GET /assets/{id}` | Bearer (any role) — 403 if non-`Active` and caller is neither owner nor admin | no body; response shape unchanged |
  | SearchAssets | `GET /assets?pageSize&nextPageToken&categoryId&minPrice&maxPrice&keyword` | **Public, unchanged** | none |
  | RequestMediaUpload | `POST /assets/{id}/media/upload-request` | Bearer (owner) | body loses `ownerId`; keeps `mimeType`/`sizeBytes` |
  | ConfirmMediaUpload | `POST /assets/{id}/media/confirm` | Bearer (owner) | body loses `ownerId`; keeps `s3Key`/`mimeType`/`sizeBytes` |
  | SubmitForModeration | `POST /assets/{id}/submit-for-moderation` | Bearer (owner) | body loses `ownerId` entirely — becomes an empty-body POST |
  | AdminReviewAsset | `POST /assets/{id}/admin-review` | Bearer + `role=Admin` | body loses `isAdmin`; keeps `approve`/`reason` |
  | CreateCategory | `POST /categories` | Bearer + `role=Admin` | body loses `isAdmin`; keeps `name`/`parentCategoryId` |
  | UpdateCategory | `PATCH /categories/{id}` | Bearer + `role=Admin` | body loses `isAdmin`; keeps `newName`/`newParentCategoryId` |
  | ListCategories | `GET /categories` | **Public, unchanged** | none |
- **Open risk (flagged in e05's own spec, not this frontend's invention):** the JWT claims shape
  (`sub`/`email`/`role` as bare strings) is **not a documented, versioned contract** on identity-api's
  side — no ADR or `docs/contracts/` file enumerates it; asset-registry-api's own e05 spec calls this
  out explicitly as "if identity-api renames/removes a claim later without coordination, this repo's
  authorization breaks silently." This frontend depends on the same claims shape only indirectly
  (it never reads JWT claims itself, just forwards the opaque token), but a claim rename would still
  surface here as unexplained 401/403s from asset-registry-api with no frontend-side bug.
- **Do not start implementation against this backend until e05 is merged and its task list is
  fully verified** (build/test green) — integrating against the current `AllowAnonymous` shape
  would require an immediate rework the moment e05 lands, including the request-body shrinkage on
  7 endpoints. Watch that repo's `.specs/project/STATE.md`/`ROADMAP.md` for the "e05 done" marker.

## rentifyx-communications-api

Repo: `C:\Users\Eugenio\Projects\study\rentifyx-communications-api` (separate repo, not a submodule).

- **Decision (2026-07-17): this frontend does not integrate with this service directly.** See the Out of Scope table in `.specs/features/identity/spec.md`. Reason: every endpoint requires a static `X-Api-Key` header, explicitly documented in that repo as "no identity-api/JWT coupling this cycle" (their AD-011) — embedding that key in an Angular SPA would expose a service-to-service secret client-side. Revisit only once a BFF/proxy exists to hold the key server-side.
- What it actually does: channel-agnostic notification service, v1 = email-only delivery via AWS SES, triggered by a `NotificationRequested` Kafka event produced by other backends (including identity-api). **Notification dispatch is Kafka-only — there is no HTTP endpoint to request a notification be sent**, and no real-time channel (no SignalR/WebSocket/SSE) to push delivery status to a frontend; status can only be polled.
- The 4 HTTP endpoints that exist (`GET notifications/{id}`, `GET notifications/recipient/{recipientId}`, `GET/PUT consent/{recipientId}`) are backend-facing per the `X-Api-Key` scheme above, not meant for direct browser consumption as currently built.
- Its consent model is per-**channel** (Email/SMS/Push opt-in per recipient) — a distinct concept from identity-api's per-**purpose** consent (Essential/Marketing) that this frontend does surface (`IDENT-10`). Don't conflate the two if this integration is revisited later.
- Kafka (topics: `notification-requested` + retry/DLQ variants) is entirely backend-to-backend. The frontend must never talk to Kafka directly, and nothing in that repo suggests otherwise.
