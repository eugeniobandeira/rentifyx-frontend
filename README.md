# RentifyX Frontend

Angular 22 frontend for the RentifyX platform. Standalone components, SSR-enabled, Tailwind CSS v4. Currently integrates with `rentifyx-identity-api` only (auth, session, LGPD data export/consent) — `rentifyx-communications-api`, `rentifyx-asset-registry-api`, and `rentifyx-ai-services` are not yet consumed by this app.

For conventions, folder structure, and architecture decisions, see [`CLAUDE.md`](./CLAUDE.md). For product scope, roadmap, and decision history, see [`.specs/project/`](./.specs/project/).

## Stack

- **Angular 22** — standalone components, no NgModules
- **SSR** via `@angular/ssr` + Express (`src/server.ts`)
- **Styling** — Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Tests** — Vitest (Angular's native unit-test builder), no Karma/Jasmine
- **State** — Angular Signals, no NgRx/Redux
- **TypeScript** `strict: true` + extra strictness flags (`noImplicitOverride`, `noPropertyAccessFromIndexSignature`, etc.)

## Running locally

The app needs a backend to talk to. Two options:

**Option A — mock server (no backend required):**

```bash
npm install
npm run dev   # runs `ng serve` + a local mock of identity-api's API on :5000, concurrently
```

**Option B — real backend:**

```bash
npm install
npm start     # ng serve on http://localhost:4200
```

`src/app/environment/environment.ts` sets `apiUrl` — a single file, no dev/prod split yet (tracked as tech debt). Update it to point at wherever `rentifyx-identity-api` is actually running (local Aspire host, or the shared EC2 instance) before testing against a real backend.

**Known integration gap:** `rentifyx-identity-api`'s CORS policy must include this app's origin (`http://localhost:4200` for local dev) or every request fails at the CORS layer regardless of frontend correctness — see that repo's `CorsExtension.cs` for current state.

## Other commands

```bash
npm run build       # production build, output in dist/
npm run watch        # dev build, watch mode
npm test             # unit tests via Vitest
npm run lint         # ESLint + Prettier (config in eslint.config.js / .prettierrc)
```

No e2e framework configured (`ng e2e` is a no-op stub). No CI/CD pipeline yet — lint/build/test run locally.

## Architecture at a glance

- `core/` — cross-cutting infra with no domain ownership: guards, interceptors, layout shell
- `features/<domain>/<entity>/` — one folder per entity, each owning its own `components/`, `interfaces/`, `services/`
- `shared/` — reusable UI kit, composables, generic services

`SessionService` is the single source of truth for auth state (access token in memory only, never persisted; refresh token lives in an httpOnly cookie set by the backend). See `CLAUDE.md` for the full session/auth flow, error-handling convention, and naming rules.
