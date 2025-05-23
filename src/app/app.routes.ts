import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AppIntakeFormComponent } from './pages/intake/intake-form.component';
import { AuthGuard } from './services/guards/auth-guard.service';
import { notAuthGuard } from './services/guards/notAuth-guard.service';
import { UserTypeGuardService } from './services/guards/user-type-guard.service';

const ADMIN_TYPE_ROLE = '1';
const USER_TYPE_ROLE = '2';
const CLIENT_TYPE_ROLE = '3';

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
          import('./pages/dashboards/dashboards.routes').then(
            (m) => m.DashboardsRoutes
          ),
        canActivate: [AuthGuard],
        data: { allowedUserTypes: [USER_TYPE_ROLE, CLIENT_TYPE_ROLE, ADMIN_TYPE_ROLE] },
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
    ],
  },
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
        canActivate: [notAuthGuard],
      },
      {
        path: 'landingpage',
        loadChildren: () =>
          import('./pages/theme-pages/landingpage/landingpage.routes').then(
            (m) => m.LandingPageRoutes
          ),
        canActivate: [notAuthGuard], 
      },
      {
        path: 'industry',
        loadChildren: () =>
          import('./pages/theme-pages/front.routes').then(
            (m) => m.HomePageRoutes
          ),
        canActivate: [notAuthGuard],
      },
      {
        path: 'discovery',
        pathMatch: 'full',
        component: AppIntakeFormComponent,
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
  {
    path: '**',
    redirectTo: 'authentication/error',
  },
];
