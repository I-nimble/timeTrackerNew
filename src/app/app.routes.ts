import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AuthGuard } from './services/guards/auth-guard.service';
import { notAuthGuard } from './services/guards/notAuth-guard.service';
import { UserTypeGuardService } from './services/guards/user-type-guard.service';

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
        redirectTo: '/authentication/login',
        pathMatch: 'full'
      },
      {
        path: 'dashboards',
        loadChildren: () =>
          import('./pages/dashboards/dashboards.routes').then(
            (m) => m.DashboardsRoutes
          ),
        canActivate: [AuthGuard],
        data: { allowedUserTypes: [USER_TYPE_ROLE, CLIENT_TYPE_ROLE, ADMIN_TYPE_ROLE, SUPPORT_TYPE_ROLE] },
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
    ],
  },
  {
    path: '**',
    redirectTo: 'authentication/error',
  },
];
