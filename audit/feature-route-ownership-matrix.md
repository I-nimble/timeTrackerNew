# Feature Route Ownership Matrix

## Purpose
Track path ownership as production routes are migrated from legacy route bundles to feature-oriented entry points.

## Status Legend
- Legacy: still owned by legacy pages/apps routes and legacy components
- Hybrid: route is still in legacy route file, but component is a feature wrapper
- Feature: route entry and component ownership are in feature folder

## Dashboard Domain
- /dashboards/*: Feature
  - Entry: src/app/features/dashboard/dashboard.routes.ts (proxy)
  - Notes: currently proxies legacy dashboard route tree for stability

## Authentication Domain
- /authentication/*: Feature
  - Entry: src/app/features/authentication/authentication.routes.ts (proxy)
  - Notes: preserves notAuthGuard and existing auth pages

## Intake Domain
- /intake, /intake/:uuid: Feature
  - Entry: src/app/features/intake/intake.routes.ts
  - Notes: currently uses existing intake form component directly

## Notifications Domain
- /dashboards/notifications: Feature
  - Route file: src/app/pages/dashboards/dashboards.routes.ts
  - Component: src/app/features/notifications/pages/notifications-page.component.ts
- /apps/notifications: Feature
  - Route file: src/app/pages/apps/apps.routes.ts
  - Component: src/app/features/notifications/pages/notifications-page.component.ts

## Workforce Domain
- /apps/team: Feature
  - Route file: src/app/pages/apps/apps.routes.ts (lazy-loads feature route)
  - Feature entry: src/app/features/workforce/team.routes.ts
- /apps/time-tracker: Feature
  - Route file: src/app/pages/apps/apps.routes.ts (lazy-loads feature route)
  - Feature entry: src/app/features/workforce/time-tracker.routes.ts
- /apps/employee: Hybrid
  - Route file: src/app/pages/apps/apps.routes.ts
  - Component owner: src/app/features/workforce/pages/employee-details-page.component.ts

## Time-Tracking Domain
- /apps/history: Feature
  - Route file: src/app/pages/apps/apps.routes.ts (lazy-loads feature route)
  - Feature entry: src/app/features/time-tracking/history.routes.ts
- /apps/todo: Hybrid
  - Route file: src/app/pages/apps/apps.routes.ts
  - Component owner: src/app/features/time-tracking/pages/todo-page.component.ts

## Billing Domain
- /refactor/billing/*: Feature
  - Entry: src/app/features/billing/billing.routes.ts
- /apps/invoice: Hybrid
  - Route file: src/app/pages/apps/apps.routes.ts
  - Component owner: src/app/features/billing/pages/invoice-list-page.component.ts
- /apps/payments-reports: Hybrid
  - Route file: src/app/pages/apps/apps.routes.ts
  - Component owner: src/app/features/billing/pages/payments-reports-page.component.ts
- /apps/addInvoice: Hybrid
  - Route file: src/app/pages/apps/apps.routes.ts
  - Component owner: src/app/features/billing/pages/add-invoice-page.component.ts
- /apps/viewInvoice/:id: Hybrid
  - Route file: src/app/pages/apps/apps.routes.ts
  - Component owner: src/app/features/billing/pages/invoice-view-page.component.ts
- /apps/editinvoice/:id: Hybrid
  - Route file: src/app/pages/apps/apps.routes.ts
  - Component owner: src/app/features/billing/pages/edit-invoice-page.component.ts
- /apps/pricing: Hybrid
  - Route file: src/app/pages/apps/apps.routes.ts
  - Component owner: src/app/features/billing/pages/pricing-page.component.ts

## Remaining Planned Cutovers
1. Promote remaining Hybrid domains after standalone compatibility strategy is defined.
2. Continue import ownership migration (services/models/stores) domain-by-domain to reduce legacy gate violations.
3. Final route entry migration from legacy /pages/apps/apps.routes.ts to feature route aggregators.

## Talent Match Domain
- /apps/talent-match/*: Feature
  - Route file: src/app/pages/apps/apps.routes.ts (lazy-loads feature routes)
  - Feature entry: src/app/features/talent-match/talent-match.routes.ts
  - Notes: custom-search and candidate detail child paths are now owned in feature routes.
