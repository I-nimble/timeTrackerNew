import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { NotificationsService } from '../../../services/notifications.service';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { WebSocketService } from '../../../services/socket/web-socket.service';

@Component({
  selector: 'app-welcome-card',
  standalone: true,
  imports: [MaterialModule, RouterModule, CommonModule],
  templateUrl: './welcome-card.component.html',
  styleUrls: ['./welcome-card.component.scss']
})
export class AppWelcomeCardComponent implements OnInit {
  allNotifications: any[] = [];
  isLoading: boolean = true;

  constructor(
    private notificationsService: NotificationsService,
    private webSocketService: WebSocketService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    
    this.webSocketService.getNotifications().subscribe((event) => {
      if (event === 'update') {
        this.loadNotifications();
      }
    });
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.notificationsService.get().subscribe({
      next: (notifications) => {
        this.allNotifications = this.filterAndSortNotifications(notifications);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching notifications:', error);
        this.isLoading = false;
      }
    });
  }

  filterAndSortNotifications(notifications: any[]): any[] {
    const filtered = notifications.filter(notification => {
      const message = notification.message || '';
      return message.includes('My Sentinel') || 
             message.includes('Talent Match') || 
             message.includes('Expert Match');
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }

  getNotificationColor(notification: any): string {
    const message = notification.message || '';
    
    if (message.includes('My Sentinel')) {
      return '#2196F3';
    } else if (message.includes('Talent Match')) {
      return '#4CAF50'; 
    } else if (message.includes('Expert Match')) {
      return '#FF9800'; 
    }
    
    return '#757575';
  }

  getNotificationType(notification: any): string {
    const message = notification.message || '';
    
    if (message.includes('My Sentinel')) {
      return 'sentinel';
    } else if (message.includes('Talent Match')) {
      return 'talent';
    } else if (message.includes('Expert Match')) {
      return 'expert';
    }
    
    return 'other';
  }

  handleNotificationClick(notification: any): void {
    this.markAsRead(notification);
    this.navigateToSection(notification);
  }

  markAsRead(notification: any): void {
    if (notification.users_notifications?.status === 2) {
      return; 
    }

    this.notificationsService.update([notification], 2).subscribe({
      next: () => {
        this.allNotifications = this.allNotifications.filter(
          n => n.id !== notification.id
        );
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  markAllAsReadBySection(sectionType: string): void {
    const sectionNotifications = this.allNotifications.filter(notification => 
      this.getNotificationType(notification) === sectionType
    );

    if (sectionNotifications.length === 0) {
      return;
    }

    this.notificationsService.update(sectionNotifications, 2).subscribe({
      next: () => {
        this.allNotifications = this.allNotifications.filter(notification => 
          this.getNotificationType(notification) !== sectionType
        );
      },
      error: (error) => {
        console.error('Error marking all section notifications as read:', error);
      }
    });
  }

  navigateToSection(notification: any): void {
    const message = notification.message || '';
    let sectionType = '';
    let route = '';

    if (message.includes('My Sentinel')) {
      sectionType = 'sentinel';
      route = '/apps/scrapper';
    } else if (message.includes('Talent Match')) {
      sectionType = 'talent';
      route = '/apps/talent-match';
    } else if (message.includes('Expert Match')) {
      sectionType = 'expert';
      route = '/apps/expert';
    } else {
      this.router.navigate(['/notifications']);
      return;
    }

    this.markAllAsReadBySection(sectionType);
    
    this.router.navigate([route]);
  }
}