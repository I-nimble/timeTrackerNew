import { Routes } from '@angular/router';

import { ROLES } from '@core/role.constants';
import { NotificationsPageComponent } from '@features/notifications/pages/notifications-page.component';
import { AuthGuard } from 'src/app/services/guards/auth-guard.service';
import { roleGuard } from 'src/app/services/guards/role.guard';

import { AppDashboardAdminComponent } from './dashboard-admin/dashboard-admin.component';
import { AppDashboardTMComponent } from './dashboard-tm/dashboard-tm.component';
import { AppDashboard2Component } from './dashboard2/dashboard2.component';
import { ProductivityComponent } from './productivity/productivity.component';
import { ReportsComponent } from './reports/reports.component';
import { AppMaintenanceComponent } from '../authentication/maintenance/maintenance.component';

const ALL_ROLES = [ROLES.ADMIN, ROLES.USER, ROLES.CLIENT, ROLES.SUPPORT];

export const DashboardsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dashboard2',
        component: AppDashboard2Component,
        canActivate: [AuthGuard, roleGuard],
        data: { title: 'Dashboard', allowedRoles: [ROLES.CLIENT] },
      },
      {
        path: 'tm',
        component: AppDashboardTMComponent,
        canActivate: [AuthGuard, roleGuard],
        data: { title: 'Dashboard', allowedRoles: [ROLES.USER] },
      },
      {
        path: 'admin',
        component: AppDashboardAdminComponent,
        canActivate: [AuthGuard, roleGuard],
        data: {
          title: 'Dashboard',
          allowedRoles: [ROLES.ADMIN, ROLES.SUPPORT],
        },
      },
      {
        path: 'reports',
        component: ReportsComponent,
        canActivate: [AuthGuard, roleGuard],
        data: {
          title: 'Reports',
          allowedRoles: ALL_ROLES,
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Reports' },
          ],
        },
      },
      {
        path: 'productivity',
        component: ProductivityComponent,
        canActivate: [AuthGuard, roleGuard],
        data: {
          title: 'Productivity',
          allowedRoles: ALL_ROLES,
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Productivity' },
          ],
        },
      },
      {
        path: 'notifications',
        component: NotificationsPageComponent,
        canActivate: [AuthGuard, roleGuard],
        data: { title: 'Notifications', allowedRoles: ALL_ROLES },
      },
      {
        path: 'maintenance',
        component: AppMaintenanceComponent,
        data: { title: 'Maintenance' },
      },
    ],
  },
];
