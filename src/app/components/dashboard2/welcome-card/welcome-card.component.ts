import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { NotificationsService } from '../../../services/notifications.service';
import { RouterModule, Router } from '@angular/router';
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
        const unreadNotifications = notifications.filter((notification: any) => 
          notification.users_notifications?.status !== 2
        );
        
        this.allNotifications = this.filterAndSortNotifications(unreadNotifications);
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

  navigateToSection(notification: any): void {
    const message = notification.message || '';
    
    if (message.includes('My Sentinel')) {
      this.router.navigate(['/apps/scrapper']);
    } else if (message.includes('Talent Match')) {
      this.router.navigate(['/apps/talent-match']);
    } else if (message.includes('Expert Match')) {
      this.router.navigate(['/apps/expert']);
    } else {
      this.router.navigate(['/notifications']);
    }
  }
}