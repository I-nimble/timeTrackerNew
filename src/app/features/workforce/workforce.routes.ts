import { Routes } from '@angular/router';
import { TeamComponent } from '../../pages/apps/team/team.component';
import { AppEmployeeComponent } from '../../pages/apps/employee/employee.component';
import { EmployeeDetailsComponent } from '../../pages/apps/employee/employee-details/employee-details.component';

export const WorkforceRoutes: Routes = [
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
];
