import { Routes } from '@angular/router';
import { NotificationsPageComponent } from './pages/notifications-page.component';

export const NotificationsRoutes: Routes = [
	{
		path: '',
		component: NotificationsPageComponent,
		data: {
			title: 'Notifications',
		},
	},
];
