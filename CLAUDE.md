# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This is a **freshly scaffolded** Angular application — most of the codebase does not exist yet. Only a root shell (`App`) and a placeholder `HomePage` are implemented. `src/app/core`, `src/app/features`, and `src/app/shared` currently contain only `README.md` placeholders describing their intended purpose. Do not assume components/services referenced in planning docs already exist — check first.

Two documents drive planning and must be read before adding non-trivial features:
- [estrutura.md](estrutura.md) — a **target folder-structure blueprint** copied from a much larger sibling project (`87300-snud-frontend`). It is aspirational/reference material showing the conventions to converge toward (feature folder shape, `list-presenter` components, `composables/`, `constants/` + `interfaces/` + `services/` per feature, form-dialog pattern, table configs, etc.) — it is **not** a description of this repo's current contents.
- [api-contracts.md](api-contracts.md) — the authoritative contract for the RentifyX Identity backend API this frontend integrates with (auth, users, LGPD data endpoints). Consult this before writing any HTTP service/interceptor code so request/response shapes, validation rules, and error formats match the backend exactly.
- `.specs/project/` (`PROJECT.md`, `ROADMAP.md`, `STATE.md`) — current phase is "Foundation": scaffolding core/shared/feature placeholders and keeping the app buildable/testable. Check `STATE.md` for the latest decisions/todos before assuming later-phase architecture is in place.

## Commands

Package manager is npm (`packageManager: npm@11.16.0` in package.json).

```bash
npm start           # ng serve — dev server at http://localhost:4200
npm run build       # ng build (production by default)
npm run watch       # ng build --watch --configuration development
npm test            # ng test — runs unit tests via Vitest (Angular's unit-test builder)
```

- Run a single test file: `ng test --include='**/home.spec.ts'` (adjust path glob as needed).
- There is no e2e framework configured yet (`ng e2e` is a no-op stub).
- No standalone lint script is defined in package.json; formatting is enforced via Prettier (`.prettierrc`: single quotes, 100-char print width, Angular parser for `.html`).
- SSR: `npm run serve:ssr:rentityx-frontend` runs the built Express server (`dist/rentityx-frontend/server/server.mjs`) — only works after a production build.

## Architecture

- **Angular 22**, standalone-component style (no NgModules) — components declare `imports` directly, routes are plain `Routes` arrays.
- **SSR is enabled** via `@angular/ssr`: `src/main.ts` (browser bootstrap), `src/main.server.ts` + `app.config.server.ts` (server bootstrap, merges `provideServerRendering()` into the client `appConfig`), and `src/server.ts` (Express server handling SSR + static assets). `app.routes.server.ts` controls server-side render mode. `provideClientHydration()` is enabled in `app.config.ts` for hydration on the client.
- **Routing**: `src/app/app.routes.ts` is the root route table; wildcard paths redirect to `''`. As features are added, follow the blueprint's per-feature `*.routes.ts` pattern (e.g. `commodity-hub.routes.ts`) and lazy-load feature route files rather than growing the root routes file.
- **Folder convention (from estrutura.md, to be applied as features are built)**:
  - `core/` — cross-cutting infra with **no domain ownership**: guards, interceptors, the layout shell, and only pages that don't belong to any feature domain (`home`, `not-found`, `access-denied`). A page or service tied to a specific domain (e.g. the auth flow, a user's profile) belongs under that feature, not here, even if it's part of the unauthenticated shell.
  - `features/<domain>/<entity>/` — each **entity** (not just each domain) gets its own subfolder with its own `components/`, `constants/`, `interfaces/`, `types/`, `services/` (only the ones it actually needs — e.g. an entity with no local constant doesn't get an empty `constants/`). Don't group multiple unrelated entities' pages/services/interfaces into one shared `pages/`/`services/`/`interfaces/` folder at the domain root — that's a dumping ground, not an entity boundary. Example: `features/identity/auth/` has no files of its own; it's purely a parent for its entities — `login/` (`components/login.*`, `interfaces/login-request.ts`, `services/login.service.ts`), `register/` (adds `constants/register.constants.ts` for its password pattern + field-name list), `verify-email/`, `forgot-password/`, `reset-password/`, and `session/` (no page — owns session lifecycle: `services/session.service.ts` for state, `services/session-api.service.ts` for the refresh/logout HTTP calls, `services/token-storage.service.ts`, `interfaces/auth-token-response.ts`+`refresh-request.ts`+`logout-request.ts`). Request/response DTOs live in each entity's `interfaces/` as one file per shape (`create-x-request.ts`, `x-response.ts`, etc.), matching the backend contract in `api-contracts.md`. A page belongs inside its owning entity, never in `core/pages/` — `core/pages/` is reserved for pages with no domain owner at all (`home`, `not-found`, `access-denied`).
  - `shared/` — cross-feature reusable pieces: generic `ui/` component kit (button, input, select, table, form-dialog, pagination...), `composables/` (reusable reactive logic, e.g. `use-list-pagination.ts`, `use-form-field.ts`), `services/` (e.g. `base-http.service.ts` for common HTTP concerns), `directives/`, `constants/`, `interfaces/` (e.g. `list-api-request.ts`/`list-api-response.ts` for paginated list endpoints), `types/` (union/primitive type aliases shared across features, e.g. `http-error-kind.ts`).
- **Imports**: use the path aliases defined in `tsconfig.json` instead of long relative paths — `@app/*`, `@core/*`, `@features/*`, `@shared/*` (all map into `src/app/...`). E.g. `import { BaseHttpService } from '@shared/services/base-http.service'` rather than `'../../../../shared/services/base-http.service'`. Relative imports (`./`, `../`) are still fine for files within the same feature/entity folder.
- **One interface/type per file**: never collect multiple interfaces or DTOs into a single file (no `models.ts` / `types.ts` grab-bags). Each request/response shape gets its own file, following the blueprint's `create-x-request.ts`, `update-x-request.ts`, `filter-x-request.ts`, `x-response.ts` naming — even for small interfaces. An `index.ts` barrel re-exporting a folder's files is fine when the blueprint already uses one (see `interfaces/index.ts`, `services/index.ts` patterns in estrutura.md), but the interfaces themselves still live in separate files.
- **`interfaces/` vs `types/`**: object-shape contracts (anything you'd write as `interface`, prefixed `i...`) go in `interfaces/`. Union/primitive/utility type aliases (anything you'd write as `type`, no `i` prefix, PascalCase — e.g. `HttpErrorKind`) go in a sibling `types/` folder. Don't mix the two in one file or one folder.
- **Components: template/style always in their own file** — never use an inline `template:`/`styles:` string in a `@Component` decorator once the markup is more than a couple of lines. Use `templateUrl: './x.html'` (and `styleUrl: './x.css'` if a stylesheet is needed) so `.ts`/`.html`/`.spec.ts` stay separate files, matching every component in estrutura.md.
- **HTTP error handling — classify in an interceptor, branch on `kind` in the caller**: `core/interceptors/http-error-classifier.interceptor.ts` catches every `HttpErrorResponse`, maps its status to a `HttpErrorKind` (`@shared/types/http-error-kind.ts`), and rethrows a normalized `iClassifiedHttpError` (`@shared/interfaces/classified-http-error.ts`) with a ready-to-display `message`. Callers (components, services) must not re-derive error meaning via `instanceof HttpErrorResponse` / `status === N` checks — they receive `iClassifiedHttpError` and switch on `.kind`. Registered outermost in `app.config.ts`'s interceptor chain (`[httpErrorClassifierInterceptor, authInterceptor]`) so `authInterceptor`'s 401-refresh logic still sees the raw `HttpErrorResponse` first.
- **Styling — Tailwind-first, mobile-first, responsive**: Tailwind CSS v4 via `@tailwindcss/postcss` (see `.postcssrc.json`); global import in `src/styles.css` is `@import 'tailwindcss';`. Prefer Tailwind utility classes in templates over new component CSS files — only add a `.css` file for styles Tailwind can't express (complex animations, third-party overrides). Component-level CSS files, when needed, sit alongside the component.
  - Write styles unprefixed (mobile) first, then layer up with `sm:`/`md:`/`lg:`/`xl:` for larger breakpoints — never design desktop-first and retrofit mobile.
  - Every screen/component must be usable and legible at narrow viewports (~360px) as well as desktop; avoid fixed pixel widths, prefer fluid/relative units (`%`, `rem`, `flex`, `grid`) and `max-w-*` containers.
  - Avoid `@apply`-heavy custom CSS classes that duplicate what utilities already give you; keep styling colocated and composable rather than introducing global CSS abstractions.
- **Performance and scalability**: keep this in mind for every non-trivial addition, not just styling.
  - Prefer standalone lazy-loaded feature routes (`loadChildren`/`loadComponent`) over eagerly importing every feature into the root route table, so the initial bundle stays small — watch the budgets already defined in `angular.json` (`initial` 500kB warning / 1MB error, `anyComponentStyle` 4kB warning / 8kB error).
  - Use Angular's `OnPush` change detection and signals for component state where practical; avoid unnecessary subscriptions/re-renders.
  - Avoid loading large third-party libraries for something a few utility classes or a small composable can do.
  - Design shared/`ui` components and `composables` to be generic and reusable across features (per the `estrutura.md` blueprint) rather than duplicating logic per feature — this is what keeps the app scalable as more `features/<domain>/<entity>` folders are added.
- **TypeScript strictness**: `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, plus Angular-specific `strictInjectionParameters` and `strictInputAccessModifiers` are all on — write code compatible with these from the start rather than retrofitting.
- **Naming conventions**:
  - Every `interface` name starts with a lowercase `i` prefix (e.g. `iUser`, `iAuthRequest`, `iListApiResponse`) — not uppercase `I`.
  - Every private class member (fields and methods) is prefixed with `_` (e.g. `private _tokenStorage`, `private _handleError()`).
  - Prefer precise, explicit types everywhere; avoid `any` — use `unknown` with narrowing, generics, or a proper interface/type instead.
- **Testing**: uses Angular's Vitest-based unit-test builder (`@angular/build:unit-test`), not Karma/Jasmine runner config. Test files are colocated as `*.spec.ts` next to the code under test.

## Git

- Do not run `git commit` (or `git push`) unless the user explicitly asks for it in that turn. Implement/edit freely, but leave changes uncommitted until asked — do not assume an earlier "ok, go ahead" on a task authorizes committing it too.
