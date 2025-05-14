import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { PagesComponent } from './pages/pages.component';
import { AuthGuard } from './services/guards/auth-guard.service';
import { notAuthGuard } from './services/guards/notAuth-guard.service';
import { UserTypeGuardService } from './services/guards/user-type-guard.service';
import { RegisterComponent } from './pages/register/register.component';
import { GetStartedComponent } from './pages/register/get-started/get-started.component';

const ADMIN_TYPE_ROLE = '1';
const USER_TYPE_ROLE = '2';
const CLIENT_TYPE_ROLE = '3';

export const routes: Routes = [
  {
    path: '',
    component: PagesComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/dashboard/dashboard.module').then(
            (m) => m.EmployeeDashboardModule
          ),
        canActivate: [UserTypeGuardService],
        data: { allowedUserTypes: [USER_TYPE_ROLE] },
      },
      {
        path: 'reports',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/reports/reports.module').then((m) => m.ReportsModule),
        data: { allowedUserTypes: [ADMIN_TYPE_ROLE, USER_TYPE_ROLE] },
      },
      {
        path: 'employees',
        loadChildren: () =>
          import('./pages/client/client.employees/employees.module').then(
            (m) => m.EmployeesModule
          ),
        canActivate: [UserTypeGuardService],
        data: { allowedUserTypes: [CLIENT_TYPE_ROLE, USER_TYPE_ROLE] },
      },
      {
        path: 'entries',
        loadChildren: () =>
          import(
            './pages/dashboard/entries.employees/entries.employees.module'
          ).then((m) => m.EntriesEmployeesModule),
        canActivate: [UserTypeGuardService],
        data: { allowedUserTypes: [USER_TYPE_ROLE, CLIENT_TYPE_ROLE] },
      },
      {
        path: 'notifications',
        loadChildren: () =>
        import('./pages/notifications/notifications.module').then(
          (m) => m.NotificationsModule
        ),
        canActivate: [UserTypeGuardService],
        data: { allowedUserTypes: [USER_TYPE_ROLE, CLIENT_TYPE_ROLE] },
      },
      {
        path: 'login',
        canActivate: [notAuthGuard],
        loadChildren: () =>
          import('./pages/login/login.module').then((m) => m.LoginModule),
      },
      { path: 'logout', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'signup',
        loadChildren: () =>
          import('./pages/login/login.module').then((m) => m.LoginModule),
        canActivate: [notAuthGuard],
      },
      {
        path: 'signup-questions',
        loadChildren: () =>
          import('./pages/signup-questions/signup-questions.module').then(
            (m) => m.SignupQuestionsModule
          ),
        canActivate: [notAuthGuard],
      },
      {
        path: 'admin',
        loadChildren: () =>
          import('./pages/admin/admin.module').then((m) => m.AdminModule),
        canActivate: [UserTypeGuardService],
        data: { allowedUserTypes: [ADMIN_TYPE_ROLE] },
      },
      {
        path: 'client',
        loadChildren: () =>
          import('./pages/client/client.module').then((m) => m.ClientModule),
        canActivate: [UserTypeGuardService],
        data: { allowedUserTypes: [CLIENT_TYPE_ROLE] },
      },
      {
        path: 'ratings',
        loadChildren: () =>
          import('./pages/ratings/ratings.module').then(
            (m) => m.RatingsModule
          ),
        canActivate: [UserTypeGuardService],
        data: { allowedUserTypes: [ADMIN_TYPE_ROLE, CLIENT_TYPE_ROLE, USER_TYPE_ROLE] },
      },
    ],
  },
  {
    path: 'register/tm',
    canActivate: [notAuthGuard],
    component: RegisterComponent,
    pathMatch: 'prefix',
  },
  {
    path: 'register/client',
    canActivate: [notAuthGuard],
    component: RegisterComponent,
    pathMatch: 'full',
  },
  {
    path: 'register/get-started',
    canActivate: [notAuthGuard],
    component: GetStartedComponent, 
    pathMatch: 'full',
  },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
