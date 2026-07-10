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
  - `core/` — cross-cutting infra: guards, interceptors, layout shell, top-level pages (home, login, not-found, access-denied).
  - `features/<domain>/<entity>/` — each entity gets its own `components/`, `constants/`, `interfaces/`, `services/` (and optionally `pages/`, `composables/`, `utils/`). Request/response DTOs live in `interfaces/` as one file per shape (`create-x-request.ts`, `x-response.ts`, etc.), matching the backend contract in `api-contracts.md`.
  - `shared/` — cross-feature reusable pieces: generic `ui/` component kit (button, input, select, table, form-dialog, pagination...), `composables/` (reusable reactive logic, e.g. `use-list-pagination.ts`, `use-form-field.ts`), `services/` (e.g. `base-http.service.ts` for common HTTP concerns), `directives/`, `constants/`, `interfaces/` (e.g. `list-api-request.ts`/`list-api-response.ts` for paginated list endpoints).
- **Imports**: use the path aliases defined in `tsconfig.json` instead of long relative paths — `@app/*`, `@core/*`, `@features/*`, `@shared/*` (all map into `src/app/...`). E.g. `import { BaseHttpService } from '@shared/services/base-http.service'` rather than `'../../../../shared/services/base-http.service'`. Relative imports (`./`, `../`) are still fine for files within the same feature/entity folder.
- **One interface/type per file**: never collect multiple interfaces or DTOs into a single file (no `models.ts` / `types.ts` grab-bags). Each request/response shape gets its own file, following the blueprint's `create-x-request.ts`, `update-x-request.ts`, `filter-x-request.ts`, `x-response.ts` naming — even for small interfaces. An `index.ts` barrel re-exporting a folder's files is fine when the blueprint already uses one (see `interfaces/index.ts`, `services/index.ts` patterns in estrutura.md), but the interfaces themselves still live in separate files.
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
- **Testing**: uses Angular's Vitest-based unit-test builder (`@angular/build:unit-test`), not Karma/Jasmine runner config. Test files are colocated as `*.spec.ts` next to the code under test.
