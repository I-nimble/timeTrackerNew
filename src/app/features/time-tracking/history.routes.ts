import { Routes } from '@angular/router';

import { AppHistoryComponent } from '../../pages/apps/history/history.component';

export const TimeTrackingHistoryRoutes: Routes = [
  {
    path: '',
    component: AppHistoryComponent,
    data: {
      title: 'History',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard1' },
        { title: 'History' },
      ],
    },
  },
];
