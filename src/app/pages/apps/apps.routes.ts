import { Routes } from '@angular/router';

import { AppChatComponent } from './chat/chat.component';
import { AppEmployeeComponent } from './employee/employee.component';
import { AppPermissionComponent } from './permission/permission.component';
import { AppKanbanComponent } from './kanban/kanban.component';
import { AppFullcalendarComponent } from './fullcalendar/fullcalendar.component';
import { EmployeeDetailsComponent } from './employee/employee-details/employee-details.component';
import { AppAccountSettingComponent } from './account-setting/account-setting.component';
import { HrOperationsComponent } from './chat/hr-operations/hr-operations.component';
import { NotificationsComponent } from '../dashboards/notifications/notifications.component';
import { TeamComponent } from './team/team.component';
import { AppHistoryComponent } from './history/history.component';

export const AppsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'team',
        component: TeamComponent,
        data: {
          title: 'Team',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Team' },
          ],
        },
      },
      {
        path: 'chat',
        component: AppChatComponent,
        data: {
          title: 'Chat',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Chat' },
          ],
        },
      },
      {
        path: 'chat/support',
        component: HrOperationsComponent,
        data: {
          title: 'Chat',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'Support chat' },
          ],
        },
      },
      {
        path: 'notifications',
        component: NotificationsComponent,
        data: {
          title: 'Notifications',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'Notifications' },
          ],
        },
      },
      {
        path: 'calendar',
        component: AppFullcalendarComponent,
        data: {
          title: 'Calendar',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Calendar' },
          ],
        },
      },
      { path: 'email', redirectTo: 'email/inbox', pathMatch: 'full' },
      {
        path: 'permission',
        component: AppPermissionComponent,
        data: {
          title: 'Roll Base Access',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Roll Base Access' },
          ],
        },
      },
      {
        path: 'history',
        component: AppHistoryComponent,
        data: {
          title: 'History',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'History' },
          ],
        },
      },
      {
        path: 'kanban',
        component: AppKanbanComponent,
        data: {
          title: 'Kanban',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Kanban' },
          ],
        },
      },
      {
        path: 'time-tracker',
        component: AppEmployeeComponent,
        data: {
          title: 'Time tracker',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Employee' },
          ],
        },
      },
      {
        path: 'employee',
        component: EmployeeDetailsComponent,
        data: { 
          title: 'Employee Details',
          showGoBack: true,
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Employee Details' },
          ] 
        },
      },
      {
        path: 'account-settings',
        component: AppAccountSettingComponent,
        data: {
          title: 'Account Settings',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard1' },
            { title: 'Account Settings' },
          ],
        },
      },
    ],
  },
];
