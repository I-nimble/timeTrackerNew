import { Routes } from '@angular/router';

// dashboards
import { AppDashboard1Component } from './dashboard1/dashboard1.component';
import { AppDashboard2Component } from './dashboard2/dashboard2.component';
import { ReportsComponent } from './reports/reports.component';
import { ProductivityComponent } from './productivity/productivity.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { AppMaintenanceComponent } from '../authentication/maintenance/maintenance.component';

import { AppDashboardTMComponent } from './dashboard-tm/dashboard-tm.component';
import { AppDashboardAdminComponent } from './dashboard-admin/dashboard-admin.component';
import { UserTypeGuardService } from 'src/app/services/guards/user-type-guard.service';

const ADMIN_TYPE_ROLE = '1';
const USER_TYPE_ROLE = '2';
const CLIENT_TYPE_ROLE = '3';

export const DashboardsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dashboard2',
        component: AppDashboard2Component,
        data: { title: 'Dashboard', allowedUserTypes: [CLIENT_TYPE_ROLE] },
        canActivate: [UserTypeGuardService],
      },
      {
        path: 'tm',
        component: AppDashboardTMComponent,
        data: { title: 'Dashboard', allowedUserTypes: [USER_TYPE_ROLE] },
        canActivate: [UserTypeGuardService],
      },
      {
        path: 'admin',
        component: AppDashboardAdminComponent,
        data: { title: 'Dashboard', allowedUserTypes: [ADMIN_TYPE_ROLE] },
        canActivate: [UserTypeGuardService],
      },
      {
        path: 'reports',
        component: ReportsComponent,
        data: { title: 'Reports', allowedUserTypes: [ADMIN_TYPE_ROLE, USER_TYPE_ROLE, CLIENT_TYPE_ROLE] },
        canActivate: [UserTypeGuardService],
      },
      {
        path: 'productivity',
        component: ProductivityComponent,
        data: {
          title: 'Productivity',
          allowedUserTypes: [ADMIN_TYPE_ROLE, USER_TYPE_ROLE, CLIENT_TYPE_ROLE]
        },
        canActivate: [UserTypeGuardService],
      },
      {
        path: 'notifications',
        component: NotificationsComponent,
        data: {
          title: 'Notifications',
          allowedUserTypes: [ADMIN_TYPE_ROLE, USER_TYPE_ROLE, CLIENT_TYPE_ROLE]
        },
        canActivate: [UserTypeGuardService],
      },
      {
        path: 'maintenance',
        component: AppMaintenanceComponent,
        data: {
          title: 'Maintenance',
        },
      }
    ],
  },
];
