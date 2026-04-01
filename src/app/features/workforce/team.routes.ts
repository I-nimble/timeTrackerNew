import { Routes } from '@angular/router';
import { TeamComponent } from '../../pages/apps/team/team.component';

export const WorkforceTeamRoutes: Routes = [
  {
    path: '',
    component: TeamComponent,
    data: {
      title: 'Team',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard2' },
        { title: 'Team' },
      ],
    },
  },
];
