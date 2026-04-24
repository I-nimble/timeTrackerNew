# App Routes Configuration - Decision Summary

Generated: 2026-04-23  
Source Documents:

- `phase-2-migration-matrix.md` - Migration strategy and folder structure
- `feature-route-ownership-matrix.md` - Feature team ownership mapping
- `deprecation-log.md` - Route cutover logs and deletion gates

## Overview

The `app.routes.ts` configuration implements Angular's standalone routing API with comprehensive documentation linking each route to its source of truth in the migration matrices and deprecation log.

## Key Decisions

### 1. **No Legacy Route Deletion**

- **Decision**: All legacy routes preserved; feature and legacy paths coexist.
- **Rationale**: Per "no-break strategy" in phase-2-migration-matrix.md and deprecation-log.md—no deletions scheduled until feature parity + test signoff + QA approval.
- **Impact**: Users can access features via both `/apps/invoice` (legacy) and `/refactor/billing/invoice` (feature preview) without issue.

### 2. **Feature Flags Applied Conservatively**

- **Decision**: Feature flag predicates use optional chaining (`?.`) to safely handle missing feature flag objects.
- **Rationale**: Prevents runtime errors if environment.featureFlags is undefined.
- **Example**: `enabled: environment.featureFlags?.notificationsRefactor`
- **Impact**: Graceful fallback if configuration is incomplete; feature routing still functions.

### 3. **Lazy-Loading Preference (Standalone Routes)**

- **Decision**: All routes use `loadChildren` with feature module imports; no `loadComponent` (standalone component direct load).
- **Rationale**: Feature modules own route definitions (e.g., `@features/dashboard/dashboard.routes.ts`); this keeps routing concerns colocated with feature code.
- **Impact**: Cleaner separation of concerns; easier to refactor feature routes without touching root app.routes.ts.

### 4. **Authentication Bifurcation**

- **Decision**: `/authentication` route appears in both layouts:
  - **FullComponent layout** (authenticated): `/refactor/authentication` preview (feature-flagged)
  - **BlankComponent layout** (unauthenticated): `/authentication` production (guarded by notAuthGuard)
- **Rationale**: Supports both authenticated user profile management (future) and sign-in/sign-up flows (current).
- **Impact**: Dual ownership model prevents conflicts and allows gradual refactor.

### 5. **Organization by Layout and Migration Wave**

**Structure**:

```
app.routes.ts
├── FullComponent (authenticated users)
│   ├── Legacy utility routes (starter, forms, charts, etc.)
│   ├── Feature routes (production)
│   │   ├── Dashboard (/dashboards)
│   │   ├── Apps multi-feature container (/apps)
│   └── Feature preview routes (/refactor/*)
│       ├── Notifications
│       ├── Intake
│       ├── Dashboard (alt preview)
│       ├── Billing + aliases
│       ├── Workforce + aliases
│       ├── Time-Tracking + aliases
│       ├── Talent-Match
│       └── Authentication
└── BlankComponent (unauthenticated users)
    ├── Authentication (/authentication)
    ├── Intake (/intake)
    ├── Landing Page (/landingpage)
    └── Discovery Form (/discovery - deprecated)
```

**Rationale**: Mirrors phase-2 migration waves; groups legacy separate from refactored features for clarity.

### 6. **Deprecation Annotations**

**Decision**: Routes marked as "Legacy" or "DEPRECATION STATUS" include inline documentation explaining:

- Current ownership and migration status
- Links to deprecation-log.md entries
- Recommended consolidation path

**Examples**:

- `/discovery` → "should merge with /intake" (consolidation path)
- `/landingpage` → "consider moving to @features/home" (future wave)

**Impact**: Clear signposts for future maintainers; prevents accidental removal before migration gates are met.

### 7. **Feature Ownership Clarity**

**Decision**: Each major route block includes a JSDoc block documenting:

- Ownership path (`src/app/features/...`)
- Feature flag status
- Cross-references to ownership matrix
- Deprecation log date(s) link

**Example**:

```typescript
/**
 * Billing Feature (FULL CUTOVER)
 * Full paths: /refactor/billing, /refactor/billing/invoice, etc.
 * Ownership: FEATURE (src/app/features/billing/)
 * Also served at: /apps/invoice, /apps/payments-reports, /apps/addInvoice, etc. (production paths)
 * Feature flag: featureFlags.billingRefactor
 * Migration status: Production cutover completed (deprecation-log.md: 2026-04-01)
 * Notes: Includes invoice management, payment reports, pricing pages
 */
```

**Impact**: Eliminates guesswork; reduces cognitive load when reviewing or refactoring routes.

### 8. **Alias Routes for Convenience**

**Decision**: Feature-level shortcut redirects added for `/refactor/*` paths:

- `/refactor/invoice` → `/refactor/billing/invoice`
- `/refactor/team` → `/refactor/workforce/team`
- `/refactor/history` → `/refactor/time-tracking/history`

**Rationale**: Allows feature flags and preview links to be terse without verbose paths; reduces URL length in QA/testing notes.

**Impact**: Cleaner test URLs and preview links; no behavior change (HTTP redirect at route level).

### 9. **Omitted Routes**

**Decision**: No routes were omitted.

**Rationale**:

- All legacy routes preserved per no-break strategy.
- All feature preview routes active (feature flags control visibility, not routing).
- No routes in deprecation-log.md marked for deletion yet.

**Impact**: Zero breaking changes; can coexist with migration in progress.

### 10. **Guard Consistency**

**Decision**: Applied guards uniformly per layout:

- **FullComponent routes**: `canActivate: [AuthGuard]` (with optional allowedUserTypes data)
- **BlankComponent Auth route**: `canActivate: [notAuthGuard]`
- **BlankComponent Intake/Landing**: `canActivate: [notAuthGuard]` (or no guard for intake; accessible to all)

**Rationale**: Prevents authenticated users from accessing sign-in pages and vice versa; preserves existing behavior.

**Impact**: No regression risk; mirrors current guard strategy.

## Future Work

1. **Wave 4 Cleanup** (deletion gates): Once legacy gates are met for a feature, remove duplicate routes (e.g., delete `/apps/invoice`, keep only `/refactor/billing/invoice`).

2. **Consolidation Routes**: Merge `/discovery` into `/intake` routes and update deprecation log.

3. **Standalone Components**: Gradually migrate routes from `loadChildren` (module) to `loadComponent` (standalone) as components are refactored.

4. **Landing Page**: Consider moving `/landingpage` to a `@features/home` or `@features/landing` module in future wave.

## Testing Recommendations

1. **Route Activation**: Test each guard + feature flag combination manually.
2. **Alias Redirects**: Verify `/refactor/team` → `/refactor/workforce/team` works end-to-end.
3. **Legacy Routes**: Ensure `/apps/*` paths still resolve correctly during coexistence period.
4. **Feature Flag Toggle**: Test toggling featureFlags in environment and observing route availability.

## References

- **Full source**: `/Users/inimble/Desktop/TimeTracker/timeTrackerNew/src/app/app.routes.ts`
- **Migration Matrix**: `audit/phase-2-migration-matrix.md`
- **Ownership Matrix**: `audit/feature-route-ownership-matrix.md`
- **Deprecation Log**: `tools/refactor/deprecation-log.md`
