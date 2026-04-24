# Phase 2 Migration Matrix (No-Break Strategy)

## Scope

This document maps current legacy frontend areas to the new architecture:

- src/app/core
- src/app/shared
- src/app/features
- src/app/legacy

Goal: migrate incrementally without breaking routes, auth flow, or production behavior.

## Current Entry and Routing Baseline

- Main route config: src/app/app.routes.ts
- Legacy page route bundles are still active under src/app/pages/\*\*
- Providers still point to legacy paths in src/app/services/\*\* via app.config.ts and app.module.ts

## Folder Mapping Rules

- Keep legacy code working in place during migration.
- New/updated code goes to core/shared/features first.
- If old files must be relocated, use adapter exports or route aliases to avoid import breakage.
- Only remove legacy folders after feature parity and test signoff.

## Legacy to Target Matrix

### Core (cross-app singleton concerns)

Source candidates:

- src/app/services/auth.service.ts
- src/app/services/jwt.interceptor.ts
- src/app/services/guards/\*
- src/app/services/navigation.service.ts
- src/app/services/nav.service.ts
- src/app/services/socket/\*
- src/app/services/core.service.ts

Target:

- src/app/core/authentication/{services,interceptors,guards,models}
- src/app/core/http/{services,interceptors}
- src/app/core/state

Action type:

- Copy first, then switch imports by feature. Remove old only after all imports are migrated.

### Shared (reusable stateless UI/utils)

Source candidates:

- src/app/components/loader
- src/app/components/button
- src/app/components/search
- src/app/components/form-dialog
- src/app/components/confirmation-modal
- src/app/components/date-range-dialog
- src/app/components/go-back
- src/app/components/side-panel
- src/app/components/more-vert
- src/app/pipe/\*

Target:

- src/app/shared/components
- src/app/shared/pipes
- src/app/shared/directives
- src/app/shared/guards
- src/app/shared/models

Action type:

- Extract reusable pieces as standalone components/pipes/directives.
- Keep wrappers in legacy until all call sites are switched.

### Features (business domains)

1. Authentication

- Legacy sources: src/app/pages/authentication, auth-related services and guards
- New target: src/app/features/authentication/{pages,components,services,models,store}

2. Dashboard and Home

- Legacy sources: src/app/pages/dashboards, src/app/components/dashboard1, src/app/components/dashboard2
- New target: src/app/features/dashboard/{pages,components,services,models,store}

3. Talent Match

- Legacy sources: src/app/pages/talent-match, src/app/pages/talent-match-admin, src/app/components/match-search, src/app/components/match-percentages-modal
- New target: src/app/features/talent-match/{pages,components,services,models,store}

4. Employees and Positions

- Legacy sources: employees*, position*, orgchart\* components; services employees/positions/orgchart/departments
- New target: src/app/features/workforce/{pages,components,services,models,store}

5. Entries, Timer, To-Do

- Legacy sources: entries*, entry, timer*, to-do\*, reports-filter, related services
- New target: src/app/features/time-tracking/{pages,components,services,models,store}

6. Billing and Payments

- Legacy sources: bills, balance, payment-\*, stripe, pending-invoices-counter, payment/plan/subscription services
- New target: src/app/features/billing/{pages,components,services,models,store}

7. Notifications

- Legacy sources: notification-\* and unread-count components, notifications services/store
- New target: src/app/features/notifications/{pages,components,services,models,store}

8. Discovery / Intake / Quick Contact

- Legacy sources: src/app/pages/discovery, src/app/pages/intake, src/app/pages/quick-contact-form and related services
- New target: src/app/features/intake/{pages,components,services,models,store}

### Legacy (stabilization area)

Keep old structure available while migration runs:

- src/app/legacy/components
- src/app/legacy/pages
- src/app/legacy/services
- src/app/legacy/models
- src/app/legacy/stores
- src/app/legacy/layouts
- src/app/legacy/pipe
- src/app/legacy/utils

Recommended transition:

- Move old folders in small batches to src/app/legacy/\* and expose temporary index exports to avoid mass import churn.

## Execution Waves (No-Break)

Wave 0 - Safety Net

- Add path aliases for old and new roots in tsconfig if needed.
- Keep current routes untouched.
- Define feature flags for each migrated domain.

Wave 1 - Core Foundation

- Migrate auth/http/socket primitives into core.
- Keep legacy service facades re-exporting new implementations.
- Update providers in app.config.ts with no route changes.

Wave 2 - Shared Extraction

- Promote low-risk reusable UI (loader, button, dialog primitives) into shared.
- Leave compatibility wrappers in legacy component paths.

Wave 3 - Feature-by-Feature Migration
Recommended order (lowest risk to highest coupling):

1. notifications
2. intake
3. dashboard
4. billing
5. workforce
6. time-tracking
7. talent-match
8. authentication hardening pass

Per feature checklist:

- Create src/app/features/<feature>/{pages,components,services,models,store}
- Copy models/services first
- Migrate one page container at a time
- Keep old route path and point it to new page container
- Validate guards, permissions, and api calls
- Remove obsolete legacy imports only after green checks

Wave 4 - Legacy Cleanup

- Delete only folders with zero references (confirm by search).
- Keep a final deprecation log for removed paths.

## Deletion Gate (When to remove old folders)

All must be true:

- No imports reference old path.
- Route behavior unchanged for that domain.
- Feature tests (unit + smoke e2e) pass.
- QA signoff received.

If any gate fails, do not delete. Keep under src/app/legacy until resolved.

## Immediate Next Actions

1. Create feature skeletons for notifications, intake, dashboard.
2. Add temporary adapter files in legacy for moved services/components.
3. Migrate one route branch first (notifications) and validate end-to-end.

## Execution Status (Implemented)

- Wave 0: Implemented
  - Path aliases added in tsconfig.json for @app, @core, @shared, @features, @legacy.
  - Feature flags added to environment.ts and environment.prod.ts.
- Wave 1: Implemented (foundation level)
  - Core bridge files created for authentication guards/services/interceptors.
  - Core ApiService and base app state scaffold created.
  - app.config.ts now imports interceptor through @core bridge path.
- Wave 2: Implemented (initial extraction)
  - Shared wrappers created for loader/button/confirmation-modal and notifications service.
  - Shared LoggerService and pipe bridge created.
- Wave 3: Implemented (skeleton + route hooks)
  - Feature folders created for authentication, dashboard, talent-match, workforce, time-tracking, billing, notifications, intake.
  - Each feature includes pages/components/services/models/store and a <feature>.routes.ts file.
  - Non-breaking refactor preview routes added under /refactor/\* in app.routes.ts.
- Wave 4: Implemented (gating tooling)
  - Legacy import gate script added at tools/refactor/check-legacy-imports.ps1.
  - Deprecation log created at tools/refactor/deprecation-log.md.
  - npm script added: refactor:check-legacy.
