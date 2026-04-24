/**
 * App Routing Configuration
 */

import { Routes } from '@angular/router';

import { environment } from 'src/environments/environment';

import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AppDiscoveryFormComponent } from './pages/discovery/discovery-form.component';
import { LandingPageRedirectComponent } from './pages/theme-pages/landingpage/landingpage-redirect.component';
import { AuthGuard } from './services/guards/auth-guard.service';
import { notAuthGuard } from './services/guards/notAuth-guard.service';

// User role type constants
const ADMIN_TYPE_ROLE = '1';
const USER_TYPE_ROLE = '2';
const CLIENT_TYPE_ROLE = '3';
const SUPPORT_TYPE_ROLE = '4';

export const routes: Routes = [
  /**
   * AUTHENTICATED LAYOUT ROUTES
   * Main application shell for authenticated users
   * Ownership: FullComponent layout with feature-based lazy loading
   */
  {
    path: '',
    component: FullComponent,
    children: [
      // ROOT REDIRECT
      {
        path: '',
        redirectTo: '/landingpage',
        pathMatch: 'full',
      },

      /**
       * FEATURE ROUTES (PRODUCTION)
       * Routes owned and maintained by feature teams
       * Ordered by: feature -> ownership -> deprecation log record date (earliest first)
       * See feature-route-ownership-matrix.md for detailed ownership records
       */

      /**
       * DASHBOARD FEATURE
       * Status: Feature (feature-route-ownership-matrix: "Dashboard Domain")
       * Ownership: src/app/features/dashboard/
       * Notes: Currently proxies legacy dashboard route tree for stability
       * Migration log: 2026-04-01 (deprecation-log.md)
       */
      {
        path: 'dashboards',
        loadChildren: () =>
          import('@features/dashboard/dashboard.routes').then(
            (m) => m.DashboardRoutes,
          ),
        canActivate: [AuthGuard],
        data: {
          allowedUserTypes: [
            USER_TYPE_ROLE,
            CLIENT_TYPE_ROLE,
            ADMIN_TYPE_ROLE,
            SUPPORT_TYPE_ROLE,
          ],
        },
      },

      /**
       * MULTI-FEATURE CONTAINER (LEGACY)
       * Status: Hybrid (legacy route container with feature-owned child components)
       * Maps to: src/app/pages/apps/apps.routes.ts + feature wrappers
       *
       * Contains multiple feature domains:
       * - Workforce: /apps/team, /apps/time-tracker, /apps/employee
       * - Time-Tracking: /apps/history, /apps/todo
       * - Billing: /apps/invoice, /apps/payments-reports, /apps/addInvoice, etc.
       * - Talent-Match: /apps/talent-match/*
       *
       * See feature-route-ownership-matrix.md for per-path ownership breakdown.
       * Migration log: Multiple entries (2026-04-01+) in deprecation-log.md
       */
      {
        path: 'apps',
        loadChildren: () =>
          import('./pages/apps/apps.routes').then((m) => m.AppsRoutes),
        canActivate: [AuthGuard],
      },

      /**
       * FEATURE PREVIEW ROUTES (/refactor/*)
       * Purpose: Test and migrate feature implementations without breaking production routes
       * Status: Hybrid/Feature (preview) - activate via environment.featureFlags
       * Migration log: Wave 3 (deprecation-log.md, phase-2-migration-matrix.md)
       * Deletion gate: Feature flags must be enabled; legacy routes remain coexisting
       */

      /**
       * Notifications Feature Preview
       * Full path: /refactor/notifications
       * Ownership: FEATURE (src/app/features/notifications/)
       * Also served at: /dashboards/notifications and /apps/notifications (production paths)
       * Feature flag: featureFlags.notificationsRefactor
       * Migration status: Route cutover completed (deprecation-log.md: 2026-04-01)
       */
      {
        path: 'refactor/notifications',
        loadChildren: () =>
          import('@features/notifications/notifications.routes').then(
            (m) => m.NotificationsRoutes,
          ),
        canActivate: [AuthGuard],
        data: {
          featureFlag: 'notificationsRefactor',
          enabled: environment.featureFlags?.notificationsRefactor,
        },
      },

      /**
       * Intake Feature Preview
       * Full paths: /refactor/intake, /refactor/intake/:uuid
       * Ownership: FEATURE (src/app/features/intake/)
       * Also served at: /intake (production path in BlankComponent)
       * Feature flag: featureFlags.intakeRefactor
       * Migration status: Production cutover completed (deprecation-log.md: 2026-04-01)
       */
      {
        path: 'refactor/intake',
        loadChildren: () =>
          import('@features/intake/intake.routes').then((m) => m.IntakeRoutes),
        canActivate: [AuthGuard],
        data: {
          featureFlag: 'intakeRefactor',
          enabled: environment.featureFlags?.intakeRefactor,
        },
      },

      /**
       * Dashboard Feature Preview
       * Full path: /refactor/dashboard
       * Ownership: FEATURE (src/app/features/dashboard/)
       * Also served at: /dashboards (production path)
       * Feature flag: featureFlags.dashboardRefactor
       * Migration status: Production cutover completed (deprecation-log.md: 2026-04-01)
       */
      {
        path: 'refactor/dashboard',
        loadChildren: () =>
          import('@features/dashboard/dashboard.routes').then(
            (m) => m.DashboardRoutes,
          ),
        canActivate: [AuthGuard],
        data: {
          featureFlag: 'dashboardRefactor',
          enabled: environment.featureFlags?.dashboardRefactor,
        },
      },

      /**
       * Billing Feature (FULL CUTOVER)
       * Full paths: /refactor/billing, /refactor/billing/invoice, etc.
       * Ownership: FEATURE (src/app/features/billing/)
       * Also served at: /apps/invoice, /apps/payments-reports, /apps/addInvoice, etc. (production paths)
       * Feature flag: featureFlags.billingRefactor
       * Migration status: Production cutover completed (deprecation-log.md: 2026-04-01)
       * Notes: Includes invoice management, payment reports, pricing pages
       */
      {
        path: 'refactor/billing',
        loadChildren: () =>
          import('@features/billing/billing.routes').then(
            (m) => m.BillingRoutes,
          ),
        canActivate: [AuthGuard],
        data: {
          featureFlag: 'billingRefactor',
          enabled: environment.featureFlags?.billingRefactor,
        },
      },

      // Billing route aliases (for convenience; redirect to feature billing paths)
      {
        path: 'refactor/invoice',
        redirectTo: 'refactor/billing/invoice',
        pathMatch: 'full',
      },
      {
        path: 'refactor/payments-reports',
        redirectTo: 'refactor/billing/payments-reports',
        pathMatch: 'full',
      },

      /**
       * Workforce Feature (FULL CUTOVER)
       * Full paths: /refactor/workforce, /refactor/workforce/team, /refactor/workforce/time-tracker, /refactor/workforce/employee
       * Ownership: FEATURE (src/app/features/workforce/)
       * Also served at: /apps/team, /apps/time-tracker, /apps/employee (production paths)
       * Feature flag: featureFlags.workforceRefactor
       * Migration status: Production cutover + lazy route cutover completed (deprecation-log.md: 2026-04-01)
       */
      {
        path: 'refactor/workforce',
        loadChildren: () =>
          import('@features/workforce/workforce.routes').then(
            (m) => m.WorkforceRoutes,
          ),
        canActivate: [AuthGuard],
        data: {
          featureFlag: 'workforceRefactor',
          enabled: environment.featureFlags?.workforceRefactor,
        },
      },

      // Workforce route aliases (for convenience; redirect to feature workforce paths)
      {
        path: 'refactor/team',
        redirectTo: 'refactor/workforce/team',
        pathMatch: 'full',
      },
      {
        path: 'refactor/time-tracker',
        redirectTo: 'refactor/workforce/time-tracker',
        pathMatch: 'full',
      },
      {
        path: 'refactor/employee',
        redirectTo: 'refactor/workforce/employee',
        pathMatch: 'full',
      },

      /**
       * Time-Tracking Feature (FULL CUTOVER)
       * Full paths: /refactor/time-tracking, /refactor/time-tracking/history, /refactor/time-tracking/todo
       * Ownership: FEATURE (src/app/features/time-tracking/)
       * Also served at: /apps/history, /apps/todo (production paths)
       * Feature flag: featureFlags.timeTrackingRefactor
       * Migration status: Production cutover + lazy route cutover completed (deprecation-log.md: 2026-04-01)
       * Notes: Entry history, time tracking, to-do management
       */
      {
        path: 'refactor/time-tracking',
        loadChildren: () =>
          import('@features/time-tracking/time-tracking.routes').then(
            (m) => m.TimeTrackingRoutes,
          ),
        canActivate: [AuthGuard],
        data: {
          featureFlag: 'timeTrackingRefactor',
          enabled: environment.featureFlags?.timeTrackingRefactor,
        },
      },

      // Time-Tracking route aliases (for convenience; redirect to feature time-tracking paths)
      {
        path: 'refactor/history',
        redirectTo: 'refactor/time-tracking/history',
        pathMatch: 'full',
      },
      {
        path: 'refactor/todo',
        redirectTo: 'refactor/time-tracking/todo',
        pathMatch: 'full',
      },

      /**
       * Talent-Match Feature (FULL CUTOVER)
       * Full paths: /refactor/talent-match, /refactor/talent-match/custom-search, /refactor/talent-match/:id
       * Ownership: FEATURE (src/app/features/talent-match/)
       * Also served at: /apps/talent-match/* (production path - lazy-loads feature route)
       * Feature flag: featureFlags.talentMatchRefactor
       * Migration status: Production lazy route cutover completed (deprecation-log.md: 2026-04-01)
       * Notes: Skill matching, candidate search, match percentages
       */
      {
        path: 'refactor/talent-match',
        loadChildren: () =>
          import('@features/talent-match/talent-match.routes').then(
            (m) => m.TalentMatchRoutes,
          ),
        canActivate: [AuthGuard],
        data: {
          featureFlag: 'talentMatchRefactor',
          enabled: environment.featureFlags?.talentMatchRefactor,
        },
      },

      /**
       * Authentication Feature (FULL CUTOVER)
       * Full path: /refactor/authentication
       * Ownership: FEATURE (src/app/features/authentication/)
       * Also served at: /authentication (production path in BlankComponent)
       * Feature flag: featureFlags.authenticationRefactor
       * Migration status: Production lazy route cutover completed (deprecation-log.md: 2026-04-01)
       * Notes: Sign-in, sign-up, password reset, profile management
       */
      {
        path: 'refactor/authentication',
        loadChildren: () =>
          import('@features/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes,
          ),
        canActivate: [AuthGuard],
        data: {
          featureFlag: 'authenticationRefactor',
          enabled: environment.featureFlags?.authenticationRefactor,
        },
      },
    ],
  },

  /**
   * UNAUTHENTICATED LAYOUT ROUTES
   * Shell for users without active authentication session
   * Guards ensure notAuthGuard blocks authenticated users
   */
  {
    path: '',
    component: BlankComponent,
    children: [
      /**
       * AUTHENTICATION FEATURE (PRODUCTION)
       * Full path: /authentication/*
       * Ownership: FEATURE (src/app/features/authentication/)
       * Guard: notAuthGuard (blocks if already authenticated)
       * Status: Feature (feature-route-ownership-matrix: "Authentication Domain")
       * Migration status: Production lazy route cutover completed (deprecation-log.md: 2026-04-01)
       * Routes served: /authentication/signin, /authentication/signup, /authentication/error, etc.
       */
      {
        path: 'authentication',
        loadChildren: () =>
          import('@features/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes,
          ),
        canActivate: [notAuthGuard],
      },

      /**
       * INTAKE FEATURE (PRODUCTION)
       * Full path: /intake, /intake/:uuid
       * Ownership: FEATURE (src/app/features/intake/)
       * Guard: None applied (accessible to unauthenticated users)
       * Status: Feature (feature-route-ownership-matrix: "Intake Domain")
       * Migration status: Production lazy route cutover completed (deprecation-log.md: 2026-04-01)
       * Purpose: Discovery form / quick contact form for prospective clients
       */
      {
        path: 'intake',
        loadChildren: () =>
          import('@features/intake/intake.routes').then((m) => m.IntakeRoutes),
      },

      /**
       * LANDING PAGE / HOME
       * Full path: /landingpage
       * Ownership: src/app/pages/theme-pages/front.routes (legacy page bundle)
       * Behavior: redirects to external website https://i-nimble.com/
       * Guard: notAuthGuard (blocks if already authenticated)
       * Status: Legacy (not in feature-route-ownership-matrix)
       */
      {
        path: 'landingpage',
        component: LandingPageRedirectComponent,
        canActivate: [notAuthGuard],
      },

      /**
       * DISCOVERY FORM (LEGACY)
       * Full path: /discovery
       * Ownership: Shared discovery form for intake process
       * Guard: notAuthGuard (blocks if already authenticated)
       * Status: Legacy (AppDiscoveryFormComponent not yet migrated to standalone or feature)
       * Note: Deprecated but kept for backward compatibility; see deprecation-log.md
       * Migration: Consolidate with /intake feature routes in future wave
       *
       * DEPRECATION STATUS: This path should eventually merge with /intake
       * Kept here to avoid breaking external links or bookmarks
       */
      {
        path: 'discovery',
        pathMatch: 'full',
        component: AppDiscoveryFormComponent,
        data: {
          title: 'Intake form',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'Intake form' },
          ],
        },
        canActivate: [notAuthGuard],
      },
    ],
  },

  /**
   * WILDCARD ROUTE (CATCH-ALL)
   * Matches any unrecognized path
   * Redirects to authentication error page for safety
   * Status: Global fallback (per phase-2-migration-matrix.md)
   */
  {
    path: '**',
    redirectTo: 'authentication/error',
  },
];
