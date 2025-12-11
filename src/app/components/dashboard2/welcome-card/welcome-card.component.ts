import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { NotificationsService } from '../../../services/notifications.service';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { WebSocketService } from '../../../services/socket/web-socket.service';
import { TablerIconsModule } from 'angular-tabler-icons';
import { EventsService } from 'src/app/services/events.service';
import { trigger, style, animate, transition } from '@angular/animations';
import { ModalComponent } from '../../confirmation-modal/modal.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-welcome-card',
  standalone: true,
  imports: [MaterialModule, RouterModule, CommonModule, TablerIconsModule],
  templateUrl: './welcome-card.component.html',
  styleUrls: ['./welcome-card.component.scss'],
  animations: [
    trigger('fade', [
      transition(':increment', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':decrement', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class AppWelcomeCardComponent implements OnInit {
  allNotifications: any[] = [];
  isLoading: boolean = true;
  eventData: any[] = [];
  currentEventIndex: number = 0;
  isEventLoading: boolean = true;
  currentUserId: number | null = null;

  constructor(
    private notificationsService: NotificationsService,
    private webSocketService: WebSocketService,
    private router: Router,
    private eventsService: EventsService,
    private dialog: MatDialog,
    public snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUserId = Number(localStorage.getItem('id')) || null;
    this.loadNotifications();
    this.loadEvents();
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

  loadEvents(): void {
    this.isEventLoading = true;
    this.eventsService.getEvents().subscribe({
      next: (events) => {
        if (events && events.length > 0) {
          const now = new Date();
          this.eventData = events
            .filter((event: any) => new Date(event.date) > now)
            .sort((a: any, b: any) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
            );
        }
        this.isEventLoading = false;
        this.currentEventIndex = 0;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.isEventLoading = false;
      }
    });
  }

  previousEvent(): void {
    if (this.eventData.length === 0) return;
    this.currentEventIndex =
      (this.currentEventIndex - 1 + this.eventData.length) % this.eventData.length;
  }

  nextEvent(): void {
    if (this.eventData.length === 0) return;
    this.currentEventIndex =
      (this.currentEventIndex + 1) % this.eventData.length;
  }

  registerCurrentEvent(): void {
    if (this.eventData.length === 0) return;
    const currentEvent = this.eventData[this.currentEventIndex];
    const dialogRef = this.dialog.open(ModalComponent, {
      width: '400px',
      data: {
        subject: 'event',
        action: 'register'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.eventsService.registerToEvent(currentEvent.id).subscribe({
        next: (res) => {
          this.openSnackBar(res.message || `Successfully registered to ${currentEvent.event}`, 'Close');
          if (res.registered_user) {
            if (!currentEvent.attendees) {
              currentEvent.attendees = [];
            }
            currentEvent.attendees.push(res.registered_user);
          }
        },
        error: (err) => {
          console.error('Error registering to event:', err);
          const msg = err.error?.message || 'Failed registering to event';
          this.openSnackBar(msg, 'Close');
        }
      });
    });
  }

  isRegistered(event: any): boolean {
    if (!this.currentUserId || !event.attendees) return false;
    return event.attendees.some((u: any) => u.id === this.currentUserId);
  }

  filterAndSortNotifications(notifications: any[]): any[] {
    const filtered = notifications.filter(notification => {
      const message = notification.message || '';
      const status = notification.users_notifications?.status;
      
      return (message.includes('My Sentinel') || 
              message.includes('Talent Match') || 
              message.includes('Expert Match')) &&
             status !== 2;
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

    const notificationsToUpdate = sectionNotifications.filter(
      notification => notification.users_notifications?.status !== 2
    );

    if (notificationsToUpdate.length === 0) {
      return;
    }

    this.notificationsService.update(notificationsToUpdate, 2).subscribe({
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

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}