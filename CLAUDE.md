# Inimble — Frontend (`timeTrackerNew`)

## Project Overview

Inimble is an operating system for law firms to build, manage, and scale global legal teams of paralegals — combining hiring, training, payroll, compliance, time tracking, and performance management under one interface. It connects US/Canadian law firms with pre-vetted LATAM talent.

---

## Tech Stack

Angular 19, TypeScript, SCSS, Angular Material, NgRx Signals, Socket.io-client, Capacitor (iOS/Android)

**Data viz:** AmCharts 5, ApexCharts, Chart.js, D3.js, Leaflet.js  
**Icons:** Angular Tabler Icons, Angular Feather, Font Awesome  
**i18n:** @ngx-translate (`src/assets/i18n/`)  
**Auth:** JWT via `@auth0/angular-jwt` stored in localStorage

---

## Common Commands

```bash
npm start            # Dev server on localhost:4200
npm run build        # Production build
npm run build:stage  # Staging build
npm test             # Run unit tests (Karma)
npm run lint         # Run ESLint
npm run format       # Run Prettier — required before every commit
```

---

## Key Folders

```
src/app/
├── app.config.ts       # Standalone app entry (providers, interceptors, routes)
├── app.routes.ts       # Lazy-loaded route definitions
├── pages/              # Feature pages (legacy)
├── features/           # New standalone features (migration target)
├── components/         # 40+ shared reusable components
├── services/           # API services, guards, socket service
├── stores/             # NgRx signal stores
├── models/             # TypeScript interfaces
├── pipes/              # Custom pipes
├── layouts/            # FullLayout / BlankLayout
src/environments/       # dev / stage / prod config
```

**User roles:** ADMIN (1), USER (2), CLIENT (3), SUPPORT (4)  
**Route guards:** `AuthGuard`, `notAuthGuard`, `UserTypeGuardService`, `externalRedirectGuard`

---

## Active Architecture Migration (HIGH PRIORITY)

Migrating from NgModule-based to fully modern Angular 19 patterns. **Use new patterns in all new/modified code.**

| Area | Legacy | Target |
|---|---|---|
| Components | NgModule + declarations | `standalone: true` |
| Local state | RxJS + async pipe | Angular Signals + `toSignal()` |
| Global state | NgRx Store | NgRx Store (unchanged) |
| Templates | `*ngIf` / `*ngFor` | `@if` / `@for` |
| Lazy loading | `loadChildren` with module | `loadComponent()` direct |
| New features | — | Feature Flags + `features/` folder |

### Rules for new/migrated modules
- Create under `features/{name}/` with subfolders: `pages/`, `components/`, `services/`, `models/`, `store/`
- **No `*.module.ts` files** — standalone only
- Smart components: `toSignal()` + `computed()` + `inject()`
- Dumb components: `@Input`/`@Output` only + `ChangeDetectionStrategy.OnPush`
- Use `@if` / `@for` — never `*ngIf` / `*ngFor` in new code
- New features go behind a Feature Flag (set to `false` by default)
- Test coverage target: **80%+ per module**

### State management rule
- Local/UI state → Angular Signals
- Shared state between features → NgRx Store + Effects
- Bridge: `toSignal()` to consume NgRx selectors in templates

---

## Coding Conventions

### Formatting
- 2-space indentation, single quotes, semicolons always, trailing commas (ES5)
- Max line length: 100 characters
- Run `npm run format` before every commit — not optional

### TypeScript
- `"strict": true` enforced — no implicit `any`, strict null checks
- Avoid `any`; use `unknown` for uncertain types
- Always `const` for non-reassigned variables; `let` over `var`
- Use `inject()` function, not constructor injection

### Naming
- Files: kebab-case (`time-tracker.component.ts`)
- Classes/Components: PascalCase (`UserProfileComponent`)
- Variables/Functions: camelCase (`userData`)
- Tests: `<filename>.spec.ts`
- Avoid generic names: `helpers.ts`, `utils.ts`, `common.ts`

### Imports (ordered)
1. Angular modules
2. Third-party libraries
3. Application-specific imports

### Component size targets
- Dumb components: < 100 lines
- Smart components: < 200 lines

---

## Rules / Gotchas

- **No `*.module.ts`** for new features — standalone components only
- **Feature Flags default to `false`** — activate only after validation in dev
- **`npm run format` is mandatory before every commit**
- **Branches:** `SD-{card-id}` (e.g. `SD-155`) based on InimbleApp kanban card IDs
- **Commit format:** `<type>[scope]: SD-{id} <description>` — types: `feat`, `fix`, `docs`, `chore`
- **PRs merge into `Stage`**, not `main` (except hotfixes)
- Component templates must stay clean — move complex logic to the class or use pipes

---

## Documentation

- Wiki: https://dev.azure.com/Inimble/Inimble%20App/_wiki/wikis
- Refactor guide: https://dev.azure.com/Inimble/Inimble%20App/_wiki/wikis (see Refactor section)
