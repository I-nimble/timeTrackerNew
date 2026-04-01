import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AppDiscoveryFormComponent } from './pages/discovery/discovery-form.component';
import { AuthGuard } from './services/guards/auth-guard.service';
import { notAuthGuard } from './services/guards/notAuth-guard.service';
import { UserTypeGuardService } from './services/guards/user-type-guard.service';
import { environment } from 'src/environments/environment';

const ADMIN_TYPE_ROLE = '1';
const USER_TYPE_ROLE = '2';
const CLIENT_TYPE_ROLE = '3';
const SUPPORT_TYPE_ROLE = '4';

export const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    children: [
      {
        path: '',
        redirectTo: '/landingpage',
        pathMatch: 'full'
      },
      {
        path: 'starter',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'dashboards',
        loadChildren: () =>
          import('@features/dashboard/dashboard.routes').then(
            (m) => m.DashboardRoutes
          ),
        canActivate: [AuthGuard],
        data: { allowedUserTypes: [USER_TYPE_ROLE, CLIENT_TYPE_ROLE, ADMIN_TYPE_ROLE, SUPPORT_TYPE_ROLE] },
      },
      {
        path: 'forms',
        loadChildren: () =>
          import('./pages/forms/forms.routes').then((m) => m.FormsRoutes),
        canActivate: [AuthGuard],
      },
      {
        path: 'charts',
        loadChildren: () =>
          import('./pages/charts/charts.routes').then((m) => m.ChartsRoutes),
        canActivate: [AuthGuard],
      },
      {
        path: 'apps',
        loadChildren: () =>
          import('./pages/apps/apps.routes').then((m) => m.AppsRoutes),
        canActivate: [AuthGuard],
      },
      {
        path: 'widgets',
        loadChildren: () =>
          import('./pages/widgets/widgets.routes').then((m) => m.WidgetsRoutes),
        canActivate: [AuthGuard],
      },
      {
        path: 'tables',
        loadChildren: () =>
          import('./pages/apps/storage/tables.routes').then((m) => m.DatatablesRoutes),
        canActivate: [AuthGuard],
      },
      {
        path: 'datatable',
        loadChildren: () =>
          import('./pages/apps/storage/tables.routes').then(
            (m) => m.DatatablesRoutes
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'theme-pages',
        loadChildren: () =>
          import('./pages/theme-pages/theme-pages.routes').then(
            (m) => m.ThemePagesRoutes
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'ui-components',
        loadChildren: () =>
          import('./pages/ui-components/ui-components.routes').then(
            (m) => m.UiComponentsRoutes
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'refactor/notifications',
        loadChildren: () =>
          import('@features/notifications/notifications.routes').then(
            (m) => m.NotificationsRoutes
          ),
        canActivate: [AuthGuard],
        data: { featureFlag: 'notificationsRefactor', enabled: environment.featureFlags.notificationsRefactor },
      },
      {
        path: 'refactor/intake',
        loadChildren: () =>
          import('@features/intake/intake.routes').then(
            (m) => m.IntakeRoutes
          ),
        canActivate: [AuthGuard],
        data: { featureFlag: 'intakeRefactor', enabled: environment.featureFlags.intakeRefactor },
      },
      {
        path: 'refactor/dashboard',
        loadChildren: () =>
          import('@features/dashboard/dashboard.routes').then(
            (m) => m.DashboardRoutes
          ),
        canActivate: [AuthGuard],
        data: { featureFlag: 'dashboardRefactor', enabled: environment.featureFlags.dashboardRefactor },
      },
      {
        path: 'refactor/billing',
        loadChildren: () =>
          import('@features/billing/billing.routes').then(
            (m) => m.BillingRoutes
          ),
        canActivate: [AuthGuard],
        data: { featureFlag: 'billingRefactor', enabled: environment.featureFlags.billingRefactor },
      },
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
      {
        path: 'refactor/workforce',
        loadChildren: () =>
          import('@features/workforce/workforce.routes').then(
            (m) => m.WorkforceRoutes
          ),
        canActivate: [AuthGuard],
        data: { featureFlag: 'workforceRefactor', enabled: environment.featureFlags.workforceRefactor },
      },
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
      {
        path: 'refactor/time-tracking',
        loadChildren: () =>
          import('@features/time-tracking/time-tracking.routes').then(
            (m) => m.TimeTrackingRoutes
          ),
        canActivate: [AuthGuard],
        data: { featureFlag: 'timeTrackingRefactor', enabled: environment.featureFlags.timeTrackingRefactor },
      },
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
      {
        path: 'refactor/talent-match',
        loadChildren: () =>
          import('@features/talent-match/talent-match.routes').then(
            (m) => m.TalentMatchRoutes
          ),
        canActivate: [AuthGuard],
        data: { featureFlag: 'talentMatchRefactor', enabled: environment.featureFlags.talentMatchRefactor },
      },
      {
        path: 'refactor/authentication',
        loadChildren: () =>
          import('@features/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
        canActivate: [AuthGuard],
        data: { featureFlag: 'authenticationRefactor', enabled: environment.featureFlags.authenticationRefactor },
      },
    ],
  },
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'authentication',
        loadChildren: () =>
          import('@features/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
        canActivate: [notAuthGuard],
      },
      // {
      //   path: 'landingpage',
      //   loadChildren: () =>
      //     import('./pages/theme-pages/landingpage/landingpage.routes').then(
      //       (m) => m.LandingPageRoutes
      //     ),
      //   canActivate: [notAuthGuard], 
      // },
      {
        path: 'landingpage',
        loadChildren: () =>
          import('./pages/theme-pages/front.routes').then(
            (m) => m.HomePageRoutes
          ),
        canActivate: [notAuthGuard],
      },
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
      {
        path: 'intake',
        loadChildren: () =>
          import('@features/intake/intake.routes').then((m) => m.IntakeRoutes),
      }
    ],
  },
  {
    path: '**',
    redirectTo: 'authentication/error',
  },
];
