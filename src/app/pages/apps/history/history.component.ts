import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { CommonModule, NgIf } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { RatingsEntriesService } from '../../../services/ratings_entries.service';
import { UsersService } from '../../../services/users.service';
import { EntriesService } from '../../../services/entries.service';
import { forkJoin, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import {
  MatNativeDateModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import moment from 'moment';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { CompaniesService } from 'src/app/services/companies.service';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ReportsService } from 'src/app/services/reports.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    MatMenuModule,
    MatButtonModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgIf,
    TablerIconsModule,
  ],
  providers: [
    provideNativeDateAdapter(),
  ],
  templateUrl: './history.component.html',
})
export class AppHistoryComponent {
  @Output() dataSourceChange = new EventEmitter<any[]>();
  displayedColumns: string[] = [
    'profile',
    'workedHours',
    'completedTasks',
    'totalTasks',
    'productivityPercentage',
  ];
  dataSource: any[] = [];
  startDate: any = '';
  endDate: any = '';
  dateRange: any = {};
  role = localStorage.getItem('role');
  selectedClient: any = 0;
  companiesList: any[] = [];
  isLoading = false;
  selectedUserId: number | null = null;
  filteredDataSource: any[] = [];
  selectedPosition: string | null = null;
  departmentsList: any[] = [];
  selectedDepartment: string | null = null;
  displayedColumnsNotifications: string[] = ['message', 'date'];
  notificationsDataSource = new MatTableDataSource<any>([]);
  loaded = false;
  allNotifications: any[] = [];
  selectedMemberName: string | null = null;
  notificationMembers: string[] = [];
  
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
    {
      icon: 'fa-solid fa-clock',
      color: '#92b46c',
      type: 'Time Entry',
    }

  ];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    @Inject(RatingsEntriesService)
    private ratingsEntriesService: RatingsEntriesService,
    @Inject(UsersService) private usersService: UsersService,
    @Inject(EntriesService) private entriesService: EntriesService,
    public companiesService: CompaniesService,
    public reportsService: ReportsService,
    public notificationsService: NotificationsService,
  ) {}

  ngOnInit(): void {

    const today = moment();
    this.startDate = today.clone().startOf('isoWeek').toDate();
    this.endDate = today.clone().endOf('isoWeek').toDate();
    if (this.role == '1') {
      this.getCompanies();
    }
    this.getDataSource();
  }

  getCompanies() {
    this.companiesService.getCompanies().subscribe((res: any) => {
      this.companiesList = res;
    });
  }

  getDataSource() {
    if (
      this.role == '1' &&
      (!this.selectedClient || this.selectedClient === 0)
    ) {
      this.dataSource = [];
      this.dataSourceChange.emit(this.dataSource);
      return;
    }
    this.isLoading = true;
    this.dateRange = {
      firstSelect: moment(this.startDate).format('YYYY-MM-DD'),
      lastSelect: moment(this.endDate).format('YYYY-MM-DD'),
      role: this.role,
      company_id: this.selectedClient,
    };

    this.ratingsEntriesService
      .getTeamReport(this.dateRange)
      .pipe(
        switchMap((data) => {
          // First set basic user data without profile pictures
          this.dataSource = data.ratings.map((employee: any) => {
            const completedTasks = Number(employee.completed) || 0;
            const totalTasks = Number(employee.totalTasks) || 0; // Use lowercase property
            const workedHours = Number(employee.workedHours) || 0;

            const productivityPercentage =
              totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            return {
              profile: {
                id: employee.profile.id,
                name: employee.profile.name,
                position: employee.profile.position,
                image: null,
                department_id: employee.profile.department_id,
                department: employee.profile.department,
              },
              completed: employee.completed,
              totalTasks: employee.totalTasks,
              workedHours: employee.workedHours,
              hoursLeft: employee.hoursLeft,
              progress: employee.status === 'Online' ? 'success' : 'error',
              productivityPercentage: productivityPercentage,
            };
          });

          const profilePicRequests = this.dataSource.map((task) =>
            this.usersService.getProfilePic(task.profile.id)
          );
          this.departmentsList = Array.from(
            new Set(
              this.dataSource
                .map((u) => u.profile.department)
                .filter((dep) => typeof dep === 'string' && dep.trim() !== '')
            )
          );
          this.filterByUser();
          this.dataSourceChange.emit(this.filteredDataSource);
          return forkJoin({
            profilePics: forkJoin(profilePicRequests),
          });
        })
      )
      .subscribe(({ profilePics }) => {
        // Update the dataSource with profile pictures and status
        this.dataSource.forEach((task, index) => {
          task.profile.image = profilePics[index];
        });
        this.isLoading = false;
        this.loadNotifications();
      });
  }

  onDateRangeChange() {
    if (this.startDate && this.endDate) {
      this.getDataSource();
    }
  }

  onClientChange(client: any) {
    this.dataSource = [];
    this.selectedClient = client.id;
    this.getDataSource();
  }

  filterByUser() {
    if (this.selectedUserId) {
      this.filteredDataSource = this.dataSource.filter(
        (u) => u.profile.id === this.selectedUserId
      );
    } else {
      this.filteredDataSource = [...this.dataSource];
    }
    if (this.selectedDepartment) {
      this.filteredDataSource = this.filteredDataSource.filter(
        (u) => u.profile.department === this.selectedDepartment
      );
    }
  }

  onUserChange(userId: number | null) {
    this.selectedUserId = userId;
    this.filterByUser();
    this.dataSourceChange.emit(this.filteredDataSource);
  }

  onDepartmentChange(department: string | null) {
    this.selectedDepartment = department;
    this.filterByUser();
    this.dataSourceChange.emit(this.filteredDataSource);
  }

  ngAfterViewInit() {
    this.notificationsDataSource.paginator = this.paginator;
  }

  loadNotifications() {
    const users = this.selectedUserId
      ? [this.selectedUserId]
      : this.dataSource.map((u) => u.profile.id);

    const entryRequests = users.map((userId) =>
      this.entriesService.getUsersEntries(userId).pipe(
        map((res) =>
          res.entries.flatMap((entry: any) => {
            const user = this.dataSource.find(u => u.profile.id === entry.user_id);
            const name = user ? user.profile.name : 'Unknown';

            const clockIn = {
              message: `${name} clocked in at ${moment(entry.start_time).format('HH:mm')}`,
              createdAt: entry.start_time,
              type_id: 7,
              users_notifications: { status: 1 },
            };

            const clockOut =
              entry.end_time && entry.status !== 0
                ? {
                    message: `${name} clocked out at ${moment(entry.end_time).format('HH:mm')}`,
                    createdAt: entry.end_time,
                    type_id: 7,
                    users_notifications: { status: 1 },
                  }
                : null;

            return clockOut ? [clockIn, clockOut] : [clockIn];
          })
        )
      )
    );

    forkJoin({
      notifications: this.notificationsService.get(),
      entries: forkJoin(entryRequests).pipe(map((entriesArray) => entriesArray.flat())),
    }).subscribe(({ notifications, entries }) => {
      const allNotifications = [...notifications, ...entries];
      allNotifications.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      this.allNotifications = allNotifications;
      this.notificationMembers = this.extractMembersFromNotifications(notifications);
      this.applyNotificationFilter();
      this.loaded = true;
    });
  }


  formatMessage(message: string): string {
    return message.replace(/\n/g, '<br>');
  }

  // markAsRead(notification: any) {
  //   notification.users_notifications.status = 2;
  //   this.notificationsService
  //     .update([notification], 2)
  //     .subscribe(() => {
  //       this.loadNotifications();
  //     });
  // }


applyNotificationFilter() {
  let filtered = this.allNotifications;
  if (this.selectedMemberName) {
    filtered = filtered.filter(n =>
      n.message && n.message.toLowerCase().includes(this.selectedMemberName!.toLowerCase())
    );
  }
  this.notificationsDataSource = new MatTableDataSource<any>(filtered);
  setTimeout(() => {
    this.notificationsDataSource.paginator = this.paginator;
  });
}

onMemberNameChange(name: string | null) {
  this.selectedMemberName = name;
  this.applyNotificationFilter();
}

extractMembersFromNotifications(notifications: any[]): string[] {
  const names = new Set<string>();
  notifications.forEach(n => {
    if (n.message) {
      const firstWord = n.message.split(' ')[0];
      if (firstWord && firstWord.length > 2) { 
        names.add(firstWord);
      }
    }
  });
  return Array.from(names);
}
}
