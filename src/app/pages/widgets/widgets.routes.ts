import { Routes } from '@angular/router';

// widgets
import { AppCardsComponent } from './cards/cards.component';
import { AppChartsComponent } from './charts/charts.component';

export const WidgetsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'cards',
        component: AppCardsComponent,
        data: {
          title: 'Cards',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Cards' },
          ],
        },
      },
      {
        path: 'charts',
        component: AppChartsComponent,
        data: {
          title: 'Charts',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Charts' },
          ],
        },
      },
    ],
  },
];
