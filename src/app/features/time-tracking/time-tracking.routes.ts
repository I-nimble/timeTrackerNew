import { Routes } from '@angular/router';

import { AppHistoryComponent } from '../../legacy/pages/apps/history/history.component';
import { AppTodoComponent } from '../../legacy/pages/apps/todo/todo.component';

export const TimeTrackingRoutes: Routes = [
  {
    path: '',
    redirectTo: 'history',
    pathMatch: 'full',
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
    path: 'todo',
    component: AppTodoComponent,
    data: {
      title: 'Todo App',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard2' },
        { title: 'Todo App' },
      ],
    },
  },
];
