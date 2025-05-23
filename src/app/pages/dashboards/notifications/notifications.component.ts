import { Component } from '@angular/core';
import { NotificationListComponent } from 'src/app/components/notification-list/notification-list.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [ NotificationListComponent ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent {
 
}
