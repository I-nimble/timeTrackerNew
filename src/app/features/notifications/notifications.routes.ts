import { Routes } from '@angular/router';

import { provideEffects } from '@ngrx/effects';

import { NotificationsPageComponent } from './pages/notifications-page.component';
import { NotificationsEffects } from './store/notifications.effects';

export const NotificationsRoutes: Routes = [
  {
    path: '',
    component: NotificationsPageComponent,
    providers: [provideEffects(NotificationsEffects)],
    data: {
      title: 'Notifications',
    },
  },
];
