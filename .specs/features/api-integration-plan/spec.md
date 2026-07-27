# Plan: Full Backend HTTP Contract Inventory & Frontend Evolution

Survey document, not an implementation spec — no code was written for this. Produced 2026-07-25 by
reading all 5 RentifyX backend repos (`rentifyx-identity-api`, `rentifyx-communications-api`,
`rentifyx-asset-registry-api`, `rentifyx-ai-services`, `rentifyx-platform`) plus this repo's current
state, to give a single place that lists every HTTP contract this frontend either already consumes
or will need to, in priority order, with the gaps/risks called out explicitly. Supersedes nothing —
extends `.specs/codebase/INTEGRATIONS.md` (contract detail lives there; this file is the roadmap/plan
view) and `.specs/project/ROADMAP.md`/`STATE.md` (unchanged, still the source of truth for what's
actually implemented).

## Services in scope

| Repo | HTTP contract for this frontend? | Status |
|---|---|---|
| `rentifyx-identity-api` | Yes | **Fully consumed already** (auth, session, LGPD) — see `.specs/features/identity/`. No open gap. |
| `rentifyx-asset-registry-api` | Yes | **Not yet consumed. In-flight backend migration (e05) must land first.** This is the actual new work this plan targets. |
| `rentifyx-communications-api` | No (by explicit decision) | 4 HTTP endpoints exist but require a static `X-Api-Key` unsafe in an SPA; no send-notification endpoint (Kafka-only intake); no realtime channel. Revisit only if a BFF/proxy is built. |
| `rentifyx-ai-services` | No | Event-only (Kafka consumer of asset media, produces moderation verdicts back to asset-registry-api). No HTTP surface exposed to a frontend at all. |
| `rentifyx-platform` | No | Infra/cross-cutting docs + Kafka topic ownership, not a runtime service with endpoints. |

---

## 1. Full contract inventory

### 1.1 `rentifyx-identity-api` — already implemented (no action needed)

Base `{host}/api/v1`. Bearer JWT (RS256, 15-min access token, `sub`/`email`/`role` claims — **not
formally documented/versioned on identity-api's side**, see Gaps §4); refresh token is a separate
httpOnly/`SameSite=Strict` cookie scoped to `/api/v1/auth`, rotated on every `/auth/refresh` call.

| Endpoint | Method/Route | Auth | Request | Response | Frontend status |
|---|---|---|---|---|---|
| Register | `POST /auth/register` | No | `{email,taxId,password,role,consentGiven}` | `201` `UserResponse` | Done |
| Verify email | `POST /auth/verify-email` | No | `{email,token}` | `200` `UserResponse` | Done |
| Login | `POST /auth/login` | No, `withCredentials` | `{email,password}` | `200` `AuthTokenResponse` (`accessToken`+`user`); `refreshToken` via cookie | Done |
| Refresh | `POST /auth/refresh` | No, `withCredentials` | `{email}` + cookie | `200` `AuthTokenResponse`, rotates cookie | Done |
| Logout | `POST /auth/logout` | No, `withCredentials` | `{email}` | `204`, clears cookie | Done |
| Forgot password | `POST /auth/forgot-password` | No | `{email}` | `204` always | Done |
| Reset password | `POST /auth/reset-password` | No | `{email,token,newPassword}` | `204` | Done |
| Get profile | `GET /users/me` | Bearer | — | `200` `UserResponse` | Done |
| Delete account (LGPD erasure) | `DELETE /users/me` | Bearer | — | `204` | Done |
| Data export (LGPD) | `GET /users/me/data-export` | Bearer | — | `200` export DTO | Done |
| Get consent | `GET /users/me/consent` | Bearer | — | `200` `ConsentResponse` | Done |
| Update consent | `PUT /users/me/consent` | Bearer | `{purpose,granted}` | `200` `ConsentResponse` | Done |

Error shape: RFC7807 ProblemDetails, `422` for validation (FluentValidation-keyed `errors` dict),
`400/401/404/409/429/500` for business/server errors, all with a `correlationId` extension. Already
handled by `core/interceptors/http-error/http-error.interceptor.ts`.

### 1.2 `rentifyx-asset-registry-api` — target contract, **not yet consumed, backend mid-migration**

Base `{host}/api/v1`. Same JWT as identity-api (Bearer, no separate login) — the existing
`SessionService`/`authInterceptor` already produce the correct header; no new auth plumbing needed,
only a new API-client module.

**These are the post-`e05-security-hardening-authz` shapes** (that feature is being implemented in
this backend concurrently with this survey; it removes `AllowAnonymous` and the spoofable
`ownerId`/`isAdmin` body fields). Building against the pre-e05 shape would be immediately obsolete.

| Endpoint | Method/Route | Auth | Request body (post-e05) | Response | Notes |
|---|---|---|---|---|---|
| CreateAsset | `POST /assets` | Bearer, any role | `{title, description, price, categoryId, idempotencyKey}` (no `ownerId`) | `201` `CreateAssetResponse` (`assetId`, ...) | Asset starts `Draft` |
| GetAssetById | `GET /assets/{id}` | Bearer, any role | — | `200` `GetAssetByIdResponse`; `403` if non-`Active` and caller is neither owner nor admin | Auth now required (was public) |
| SearchAssets | `GET /assets?pageSize&nextPageToken&categoryId&minPrice&maxPrice&keyword` | **Public** | query params | `200` `{items[], nextPageToken}` | `pageSize` 1-30, cursor pagination; unchanged by e05 |
| RequestMediaUpload | `POST /assets/{id}/media/upload-request` | Bearer, owner | `{mimeType, sizeBytes}` (no `ownerId`) | `200` `{uploadUrl, s3Key}` | Presigned S3 URL; allowed MIME: image/jpeg,png,webp, video/mp4 |
| ConfirmMediaUpload | `POST /assets/{id}/media/confirm` | Bearer, owner | `{s3Key, mimeType, sizeBytes}` (no `ownerId`) | `200` `ConfirmMediaUploadResponse` | `s3Key` must match a prior upload-request |
| SubmitForModeration | `POST /assets/{id}/submit-for-moderation` | Bearer, owner | *(empty body — `ownerId` removed entirely)* | `200` `AssetModerationResponse` | `Draft` → `PendingModeration` |
| AdminReviewAsset | `POST /assets/{id}/admin-review` | Bearer, `role=Admin` | `{approve, reason?}` (no `isAdmin`) | `200` `AssetModerationResponse` | `PendingModeration` → `Active`/`Draft` |
| CreateCategory | `POST /categories` | Bearer, `role=Admin` | `{name, parentCategoryId?}` (no `isAdmin`) | `201` `CategoryResponse` | max nesting depth 3 |
| UpdateCategory | `PATCH /categories/{id}` | Bearer, `role=Admin` | `{newName?, newParentCategoryId?}` (no `isAdmin`) | `200` `CategoryResponse` | rename and/or re-parent, leaf only |
| ListCategories | `GET /categories` | **Public** | — | `200` `CategoryResponse[]` (flat, `parentCategoryId`+`depth`) | unchanged by e05 |

Error shape: same `ErrorOr`→`ProblemDetails` convention as identity-api. `401` missing/invalid/expired
JWT (all but the 2 public GETs), `403` wrong-owner or non-admin-on-admin-route, `404` not found,
`422` validation, plus business errors (e.g. wrong status for a transition, category depth exceeded).

### 1.3 `rentifyx-communications-api` — out of scope, do not integrate directly

4 HTTP endpoints exist (`GET notifications/{id}`, `GET notifications/recipient/{recipientId}`,
`GET/PUT consent/{recipientId}`) but every one requires a static `X-Api-Key` header — a
service-to-service secret that cannot be safely embedded in an Angular SPA. There is no HTTP
endpoint to trigger a notification (Kafka `NotificationRequested`-only intake) and no realtime
channel (no SignalR/WebSocket/SSE) to push delivery status — status could only be polled, and even
that requires the API key. Its consent model is per-**channel** (Email/SMS/Push), a different
concept from identity-api's per-**purpose** consent this frontend already surfaces. **Do not build
against this service until a BFF/proxy exists server-side to hold the API key.**

### 1.4 `rentifyx-ai-services` / `rentifyx-platform` — not applicable

`rentifyx-ai-services` only consumes/produces Kafka events (asset media moderation) — no HTTP
surface for a frontend at all. `rentifyx-platform` holds cross-repo architecture docs and Kafka
topic ownership, not a runtime API. Neither needs a frontend client.

---

## 2. Frontend API client layer — what needs to be built

The identity feature already established the conventions this should extend, not replace:

- **One module per microservice**, mirrored as one `features/<domain>/` tree — `features/identity/`
  exists; a new `features/assets/` (entities: `asset/`, `media/`, `category/`, matching the
  `features/identity/{auth,user}/` split) is the natural next module. One service per entity/action
  group, not one monolithic `AssetService` (same lesson already learned and undone once in the
  identity feature's `AuthService` → per-entity split, see `STATE.md`).
- **Auth is already solved, reuse it as-is**: `authInterceptor` already attaches
  `Authorization: Bearer {accessToken}` to every non-`/auth/*` request and already retries once on a
  401 via `SessionService.refresh()`. Asset-registry-api calls need zero new interceptor logic —
  they are indistinguishable from `GET /users/me` as far as the interceptor is concerned. The only
  interceptor risk: confirm the `isAuthEndpoint` URL-prefix check (`environment.apiUrl + '/auth/'`)
  still correctly excludes asset-registry calls if `environment.apiUrl` ever needs to point at a
  *different host per service* (see Gaps §4 — today it's a single absolute URL, and if
  asset-registry-api is deployed at a different host than identity-api, `environment.ts`'s current
  single-`apiUrl` shape breaks and needs a per-service base URL, not a single string).
- **Error handling**: reuse `http-error.interceptor.ts`/`HttpErrorKind`/`iClassifiedHttpError`
  unchanged — asset-registry-api uses the identical `ErrorOr`→`ProblemDetails` shape as
  identity-api, no new error-classification branch needed beyond whatever new business-error
  messages the new pages need to display (e.g. "asset must be Draft to submit for moderation").
- **New pieces actually needed**:
  1. `features/assets/asset/` entity — `interfaces/` (`create-asset-request.ts`,
     `asset-response.ts`, `search-assets-request.ts`, `search-assets-response.ts`, one file per
     shape, per this repo's "one interface per file" convention), `services/` (`asset.service.ts`
     for create/get/search, or split further once >1 service is warranted per the identity
     precedent).
  2. `features/assets/media/` entity — upload-request + confirm, plus a client-side direct-to-S3
     `PUT` call (not through this backend) using the presigned `uploadUrl` — this is a new pattern
     this codebase hasn't needed yet (a raw `HttpClient.put` to an external S3 URL, no
     `BaseHttpService` wrapper, no auth header, no `withCredentials`).
  3. `features/assets/moderation/` or folded into `asset/` — submit-for-moderation, admin-review.
  4. `features/assets/category/` entity — create/update/list, admin-gated UI (only render
     create/edit controls when `SessionService.currentUser()?.role === 'Admin'` — client-side
     convenience only, the backend's `AdminOnly` policy is the real gate).
  5. A `RoleGuard`/`CanActivateFn` for admin-only routes (category management, admin review queue) —
     first real use of the `role` claim client-side; today `AuthGuard` only checks
     `isAuthenticated()`, never `role`.

---

## 3. Priority order

1. **P0 — Blocking, must land first, zero new frontend work possible without it**: the backend's
   own `e05-security-hardening-authz` feature must be merged and verified in
   `rentifyx-asset-registry-api`. Confirm via that repo's `STATE.md`/`ROADMAP.md`. Building any
   asset-registry client code against the current `AllowAnonymous` shape is wasted work — 7 of 10
   endpoints' request bodies change shape the moment e05 lands.
2. **P1 — MVP, already done**: identity (login/register/session) — no action, already shipped.
   Restated here only so this document is a complete map, not because it's new work.
3. **P2 — Asset read path (public, no auth complexity, unblocks browsing UI immediately)**:
   `SearchAssets` + `ListCategories` — both stay public even post-e05, so these can start
   **as soon as e05 ships** without needing the admin-role-guard work. Gives the app its first
   real "browse the catalog" screen.
4. **P3 — Asset write path (owner flows, the core of the marketplace)**: `CreateAsset` →
   `RequestMediaUpload` → `ConfirmMediaUpload` → `SubmitForModeration` → `GetAssetById` (owner view
   of a Draft/PendingModeration asset). This is the vertical slice that makes the app usable for an
   Owner end-to-end (create a listing, add photos, submit it).
5. **P4 — Admin flows**: `AdminReviewAsset`, `CreateCategory`, `UpdateCategory` — needs the new
   `RoleGuard` and admin-only UI, lower priority than the owner-facing flows since it's a smaller
   user population.
6. **P5 — Deferred, no action planned**: `rentifyx-communications-api` direct integration — stays
   deferred until a BFF exists. Not sequenced into the roadmap above; revisit only if that
   architecture decision changes.

---

## 4. Gaps and risks

- **Backend feature in flight (highest-impact risk)**: `e05-security-hardening-authz` is being
  implemented in `rentifyx-asset-registry-api` concurrently with this document. Every shape in
  §1.2 is the *target*, not necessarily what's live in that repo's `main` branch at the moment this
  frontend work starts. Re-verify against that repo's `STATE.md` immediately before writing any
  asset-registry client code, not just at planning time.
- **JWT claims shape is not a versioned contract**: identity-api's `TokenService.cs` issues
  `sub`/`email`/`role` (bare `"role"` claim type, not `ClaimTypes.Role`) but no ADR or
  `docs/contracts/` file in identity-api enumerates this as a stable contract — asset-registry-api's
  own e05 spec flags this explicitly as an accepted risk ("if identity-api renames/removes a claim
  later without coordination, this repo's authorization breaks silently"). This frontend doesn't
  decode JWT claims itself today (it forwards the opaque token and only decodes `exp` for the
  proactive-refresh timer, per `STATE.md`'s identity-feature notes) — but if a future feature adds
  client-side role-based UI gating by decoding the `role` claim directly (rather than relying on
  `UserResponse.role` from `GET /users/me`, which *is* documented), it inherits this same
  undocumented-contract risk. Prefer reading `role` from `SessionService.currentUser()` (sourced
  from the documented `UserResponse`), not from decoding the JWT client-side, for exactly this
  reason.
- **Single `environment.apiUrl` assumes one backend host**: `environment.ts` currently holds one
  absolute `apiUrl` for identity-api. If `rentifyx-asset-registry-api` is deployed at a different
  host (likely, given they're independent Aspire-orchestrated services with their own Terraform/EKS
  targets per each repo's `iac/`), this single-URL shape breaks. Needs a per-service base URL
  (e.g. `environment.identityApiUrl` / `environment.assetRegistryApiUrl`) before any asset-registry
  service can be written — a small environment-file change is a prerequisite, not part of the
  asset feature itself.
- **CORS not yet confirmed on asset-registry-api**: identity-api's CORS gap (only
  `http://localhost:3000` allowed) is already a known, tracked todo in this repo's `STATE.md`.
  Asset-registry-api's CORS policy was not inspected as part of this survey (out of scope — this
  survey only covered endpoint/spec files, not `Program.cs`/`appsettings.json` CORS config) — check
  it before integration testing, same class of gap as identity-api's.
- **No committed OpenAPI/Swagger artifact in any backend**: all 3 relevant repos generate
  OpenAPI/Scalar docs only at runtime in Development — there is nothing to codegen a typed client
  from; every interface in §1 was hand-derived from endpoint source files and must be hand-kept in
  sync (same practice already used for identity-api's `iUserResponse` etc.).
- **`communications-api` decision is a standing one, not a gap to close**: restated so a future
  session doesn't accidentally "discover" this as a new gap — it's an explicit, already-made
  architecture decision (`STATE.md` 2026-07-17), not an oversight.
- **No direct-to-S3 upload pattern exists in this codebase yet**: `RequestMediaUpload` /
  `ConfirmMediaUpload`'s presigned-URL flow requires a plain `HttpClient.put(uploadUrl, file)` call
  with no `Authorization` header and no `BaseHttpService` wrapping (S3 doesn't expect either) —
  this is a new shape of HTTP call for this frontend and should be designed explicitly (progress
  reporting, MIME/size validation client-side before requesting the URL, error handling for a failed
  S3 `PUT` distinct from a failed backend call) rather than assumed to fit the existing
  `BaseHttpService`/interceptor pipeline, which is backend-call-shaped.
