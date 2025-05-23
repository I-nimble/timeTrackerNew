import { Routes } from '@angular/router';

// dashboards
import { AppDashboard1Component } from './dashboard1/dashboard1.component';
import { AppDashboard2Component } from './dashboard2/dashboard2.component';
import { ReportsComponent } from './reports/reports.component';
import { AppDashboardTMComponent } from './dashboard-tm/dashboard-tm.component';
import { AppDashboardAdminComponent } from './dashboard-admin/dashboard-admin.component';

export const DashboardsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dashboard1',
        component: AppDashboard1Component,
        data: {
          title: 'Dashboard 1',
        },
      },
      {
        path: 'dashboard2',
        component: AppDashboard2Component,
        data: {
          title: 'Dashboard 2',
        },
      },
      {
        path: 'tm',
        component: AppDashboardTMComponent,
        data: {
          title: 'Dashboard',
        },
      },
      {
        path: 'admin',
        component: AppDashboardAdminComponent,
        data: {
          title: 'Dashboard',
        },
      },
      {
        path: 'reports',
        component: ReportsComponent,
        data: {
          title: 'Reports',
        },
      }
    ],
  },
];
