# Layout Shell Tasks

Design phase skipped (Medium scope — one new standalone component using content projection, reusing `SessionService`/`ThemeService` signals and existing color-system tokens; no new architecture).

**Post-implementation rename (2026-07-20)**: user didn't want "shell" in the name. The single `layout-shell/layout-shell.ts` (L1) was split into three components, each in its own `core/layout/` subfolder per the same one-concern-per-folder convention used for interceptors/guards: `core/layout/header/header.ts` (`app-header`, testids `header-*`) — logo, auth-aware nav, theme toggle; `core/layout/footer/footer.ts` (`app-footer`, testids `footer-*`) — copyright + Termos/Privacidade; `core/layout/layout/layout.ts` (`app-layout`, no own testids) — composes `<app-header/>` + `<ng-content/>` + `<app-footer/>`, wired into `App` the same way `LayoutShell` was. Behavior, requirement coverage (SHELL-01–03), and test count are unchanged — this was a naming/structure refactor only, not a behavior change. The task descriptions below still say `layout-shell`/`LayoutShell` since they document what was originally planned and built; treat every such mention as superseded by this note.

### L1: Create `core/layout/layout-shell/layout-shell.ts` [component]

**What**: New standalone component, `core/layout/layout-shell/`, per `CLAUDE.md`'s Folder convention ("core/ — cross-cutting infra with no domain ownership: guards, interceptors, the layout shell"). Renders header + `<ng-content />` (the routed page content) + footer. Injects `SessionService` (`isAuthenticated`, `isRestoringSession`, `currentUser`, `logout()`) and `ThemeService` (`isDark`, `toggle()`) directly — no `@Input()`s needed, matching how other components inject services directly rather than threading state through parents.

Header (per `context.md`):
- Logo: `routerLink="/"`, text "RentityX" (same text as today's `home.html` header).
- WHEN `isRestoringSession()` is `true` OR `isAuthenticated()` is `false` THEN render logo + "Entrar" (`routerLink="/login"`) + "Criar conta" (`routerLink="/register"`) + theme toggle button (logged-out state during restoration, per the spec's edge case — no flash of account/logout controls).
- WHEN `isAuthenticated()` is `true` (and not restoring) THEN render logo + "Minha conta" (`routerLink="/account"`) + "Sair" button + theme toggle button.
- "Sair" button `(click)` calls `this._sessionService.logout().subscribe()` — no navigation call here (per `context.md`, the existing `App` `effect()` handles the redirect on the `isAuthenticated()` `true → false` transition).
- Theme toggle button: same markup/behavior as today's `home.html` one (`(click)="themeService.toggle()"`, label swaps "Modo escuro"/"Modo claro" based on `isDark()`).

Footer:
- "© RentityX {currentYear}" — compute `currentYear` once as a class field (`new Date().getFullYear()`), not inline in the template.
- "Termos" and "Privacidade" as plain `<span>` text (not `<a>`), per `context.md`'s decision to avoid dead links until those pages exist.

**Where**:
- `src/app/core/layout/layout-shell/layout-shell.ts` (new)
- `src/app/core/layout/layout-shell/layout-shell.html` (new)
- `src/app/core/layout/layout-shell/layout-shell.spec.ts` (new)

**Depends on**: None
**Reuses**: `SessionService` (`@features/identity/auth/session/services/session.service`), `ThemeService` (`@core/services/theme.service`), color-system Tailwind tokens (`bg-bg-surface`, `border-border-default`, `text-text-primary`/`text-text-secondary`, `brand-*`) already used in `home.html`
**Requirement**: SHELL-01, SHELL-02

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [x] Component selector is `app-layout-shell`, standalone, `OnPush`, `templateUrl`/no inline template, all testids prefixed `layout-shell-*` (`layout-shell-header`, `layout-shell-logo-link`, `layout-shell-login-link`, `layout-shell-register-link`, `layout-shell-account-link`, `layout-shell-logout-button`, `layout-shell-theme-toggle-button`, `layout-shell-footer`, `layout-shell-footer-copyright`, `layout-shell-footer-terms`, `layout-shell-footer-privacy`)
- [x] Guest state (including mid-restoration) shows Entrar/Criar conta, never Minha conta/Sair
- [x] Authenticated state (restoration finished) shows Minha conta/Sair, never Entrar/Criar conta
- [x] Clicking Sair calls `SessionService.logout()` and does not itself call `Router.navigate`
- [x] Clicking the theme toggle calls `ThemeService.toggle()`
- [x] Footer shows the current year (not hardcoded) and non-clickable Termos/Privacidade text
- [x] `<ng-content />` renders whatever is projected into it, unmodified
- [x] `ng test --include='**/layout-shell.spec.ts'` passes with at least 6 cases (guest header, authenticated header, restoring-session header, logout call, theme toggle call, footer content)

**Tests**: unit
**Gate**: quick — `ng test --include='**/layout-shell.spec.ts'`

---

### L2: Wire `LayoutShell` into `App`

**What**: Wrap `app.html`'s existing restoring/router-outlet content with `<app-layout-shell>`, using content projection — `LayoutShell` renders header+footer around whatever `App` puts inside it, so `App` keeps owning the restoring-session-vs-router-outlet swap exactly as today (no duplicated loading state inside the shell itself, per the spec's edge case).

```html
<app-layout-shell>
  @if (isRestoringSession()) {
    <div ...>Restoring session…</div>
  } @else {
    <router-outlet />
  }
</app-layout-shell>
```

**Where**:
- `src/app/app.ts` (modify — add `LayoutShell` to `imports`)
- `src/app/app.html` (modify — wrap existing content in `<app-layout-shell>`)
- `src/app/app.spec.ts` (modify only if a new provider is required — `LayoutShell` injects `SessionService`/`ThemeService`, both already resolvable via the existing `provideHttpClient`/`provideHttpClientTesting` setup since neither needs additional mocking to construct; verify by running the suite, add providers only if it actually fails)

**Depends on**: L1
**Reuses**: existing `app.html` restoring-session/`router-outlet` structure, unchanged
**Requirement**: SHELL-01, SHELL-02, SHELL-03

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [x] Every route (verified by loading `/`, `/login`, `/account`, etc.) renders inside the shell
- [x] `app.html`'s existing `data-testid="app-restoring-session"` / `router-outlet` behavior is unchanged, just now nested inside `<app-layout-shell>`
- [x] `ng test --include='**/app.spec.ts'` passes

**Tests**: unit
**Gate**: quick — `ng test --include='**/app.spec.ts'`

---

### L3: Remove the duplicated header from `HomePage`

**What**: Delete `home.html`'s inline `<header>` block (logo + theme toggle) now that `LayoutShell` renders it globally. `HomePage` no longer needs `ThemeService` at all — remove the injection and the `protected readonly themeService` field. The hero section (guest/authenticated actions) is unchanged.

**Where**:
- `src/app/core/pages/home/home.html` (modify — remove the `<header>` block, keep the `<section data-testid="home-hero">` as-is)
- `src/app/core/pages/home/home.ts` (modify — remove `ThemeService` import/injection/field)
- `src/app/core/pages/home/home.spec.ts` (modify — remove the `themeService` mock and the "the theme toggle button calls ThemeService.toggle()" test case, now covered by `layout-shell.spec.ts` instead)

**Depends on**: L1
**Reuses**: N/A (deletion)
**Requirement**: SHELL-01

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [x] `home.html` has no `<header>` element and no theme-toggle button
- [x] `HomePage` has no `ThemeService` reference anywhere
- [x] `home.spec.ts`'s remaining tests (guest actions, authenticated actions) still pass; the removed theme-toggle test's coverage now lives in `layout-shell.spec.ts`
- [x] `ng test --include='**/home.spec.ts'` passes

**Tests**: unit
**Gate**: quick — `ng test --include='**/home.spec.ts'`

---

### L4: Full suite + build + lint gate

**What**: Run the complete verification pipeline after L1–L3 land.

**Where**: N/A (verification only)

**Depends on**: L1–L3
**Requirement**: SHELL-01, SHELL-02, SHELL-03

**Tools**: MCP: NONE · Skill: NONE

**Done when**:
- [x] `npm test` passes in full, no new failures (142/142)
- [x] `npm run build` succeeds (client + server bundles, prerendered routes unaffected — 7 routes)
- [x] `npm run lint` passes with no new violations
- [x] Manual smoke check: visited `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` logged out via dev server — header/footer render identically (Entrar/Criar conta, no Minha conta/Sair), `/account` correctly 302-redirects the unauthenticated guard. Authenticated Minha conta/Sair + post-logout redirect not manually exercised (no live backend session in this pass) — covered by `layout-shell.spec.ts`'s unit tests instead.

**Tests**: full suite
**Gate**: full — `npm test && npm run build && npm run lint`

**Commit**: `feat(core): add shared layout shell (header + footer), remove duplicated home header`
