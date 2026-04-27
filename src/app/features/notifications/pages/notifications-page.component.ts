import { Component } from '@angular/core';

import { NotificationListComponent } from 'src/app/components/notification-list/notification-list.component';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [NotificationListComponent],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.scss',
})
export class NotificationsPageComponent {}
