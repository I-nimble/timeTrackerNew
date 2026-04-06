import { Routes } from '@angular/router';
import { AppEmployeeComponent } from '../../pages/apps/employee/employee.component';

export const WorkforceTimeTrackerRoutes: Routes = [
  {
    path: '',
    component: AppEmployeeComponent,
    data: {
      title: 'Time tracker',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard2' },
        { title: 'Employee' },
      ],
    },
  },
];
