import { Routes } from '@angular/router';

import { AppIntakeFormComponent } from '../../pages/intake/intake-form.component';

export const IntakeRoutes: Routes = [
  {
    path: '',
    component: AppIntakeFormComponent,
    data: {
      title: 'Intake form',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard2' },
        { title: 'Intake form' },
      ],
    },
  },
  {
    path: ':uuid',
    component: AppIntakeFormComponent,
    data: {
      title: 'Intake form',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard2' },
        { title: 'Intake form' },
      ],
    },
  },
];
