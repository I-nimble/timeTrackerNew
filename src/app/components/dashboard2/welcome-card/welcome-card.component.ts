import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { NotificationsService } from '../../../services/notifications.service';
import { RouterModule } from '@angular/router';
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
}