import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApplicationDetails } from 'src/app/components/application-details/application-details.component';
import { MaterialModule } from 'src/app/material.module';
import { NotificationsService } from 'src/app/services/notifications.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { CdkTableModule } from '@angular/cdk/table';
import { WebSocketService } from 'src/app/services/socket/web-socket.service';
import { MatCommonModule } from '@angular/material/core';
import { Router } from '@angular/router';
import { ChangeDetectorRef, HostListener } from '@angular/core';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    MatTableModule,
    CdkTableModule,
    MatPaginatorModule,
    MatCommonModule,
  ],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.scss',
})
export class NotificationListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['message', 'date'];
  notificationsDataSource = new MatTableDataSource<any>([]);
  loaded = false;
  user: any;
  userId!: number;
  message: any;
  applicationDetailsDialog: any = ApplicationDetails;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  isDesktopRow = () => window.innerWidth > 768;
  isMobileRow = () => window.innerWidth <= 768;

  constructor(
    public notificationsService: NotificationsService,
    private webSocketService: WebSocketService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  @HostListener('window:resize', [])
  onResize() {
    this.cdr.markForCheck();
    this.notificationsDataSource._updateChangeSubscription();
  }

  notificationIcons = [
    {
      icon: 'fa-solid fa-circle-info',
      color: '#92b46c',
      type: 'Notification',
    },
    {
      icon: 'fa-solid fa-bell',
      color: '#d0bf45',
      type: 'Reminder',
    },
    {
      icon: 'fa-solid fa-envelope',
      color: '#92b46c',
      type: 'Message',
    },
    {
      icon: 'fa-solid fa-clock',
      color: '#d0bf45',
      type: 'Lateness alert',
    },
    {
      icon: 'fa-solid fa-calendar-check',
      color: '#d0bf45',
      type: 'Leave request',
    },
    {
      icon: 'fa-solid fa-briefcase',
      color: '#b54343',
      type: 'Job application',
    },
  ];

  ngOnInit() {
    this.loadNotifications();
    this.loaded = true;
    // setInterval(() => {
    //   this.loadNotifications();
    // }, 5000);

    this.webSocketService.getNotifications().subscribe((event) => {
      if (event === 'update') {
        this.loadNotifications();
      }
    });
  }

  ngAfterViewInit() {
    this.notificationsDataSource.paginator = this.paginator;
  }

  formatMessage(message: string): string {
    return message.replace(/\n/g, '<br>')
  }

  handleClick(notification: any) {
    if(notification.type_id === 6) { 
      let dialogRef = this.dialog.open(this.applicationDetailsDialog, {
        height: '500px',
        width: '600px',
        position: { top: '75px' },
        backdropClass: 'blur',
        data: { applicationId: notification.application_id },
      });
    }

    this.notificationsService.update([notification], 2).subscribe(() => {
      this.loadNotifications();
    });
  }

  loadNotifications() {
    this.notificationsService.get().subscribe((notifications) => {
      const allNotifications = [...notifications];
      allNotifications.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      this.notificationsDataSource = new MatTableDataSource<any>(
        allNotifications
      );
      this.notificationsDataSource.paginator = this.paginator;
      this.loaded = true;
    });
  }

  markAsRead(notification: any) {
    notification.users_notifications.status = 2;
    this.notificationsService
      .update([notification], 2)
      .subscribe((response) => {
        this.notificationsDataSource.data = [
          ...this.notificationsDataSource.data,
        ];
        this.notificationsService.notificationsChanged.next();
      });
    this.loadNotifications();
  }

  addNotification(notification: any) {
    this.notificationsDataSource.data.push(notification);
    this.notificationsDataSource.data = [...this.notificationsDataSource.data];
  }
}
