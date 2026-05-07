import { Routes } from '@angular/router';

import { provideState } from '@ngrx/store';

import { UsersListPageComponent } from './pages/users-list-page/users-list-page.component';
import { usersReducer } from './store/users.reducer';
import { EmployeeDetailsComponent } from '../../legacy/pages/apps/employee/employee-details/employee-details.component';
import { AppEmployeeComponent } from '../../legacy/pages/apps/employee/employee.component';
import { TeamComponent } from '../../legacy/pages/apps/team/team.component';

export const UsersRoutes: Routes = [
  {
    path: '',
    redirectTo: 'team',
    pathMatch: 'full',
  },
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
      ],
    },
  },
  {
    path: 'users-list-preview',
    component: UsersListPageComponent,
    providers: [provideState('users', usersReducer)],
    data: {
      title: 'Users list preview',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard2' },
        { title: 'Users list preview' },
      ],
    },
  },
];
