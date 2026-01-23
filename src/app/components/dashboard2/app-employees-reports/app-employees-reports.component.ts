import { Component, EventEmitter, Inject, Output, OnInit, OnDestroy } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { CommonModule, NgIf } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { RatingsEntriesService } from '../../../services/ratings_entries.service';
import { UsersService } from '../../../services/users.service';
import { EntriesService } from '../../../services/entries.service';
import { forkJoin, Observable, of, finalize, Subscription } from 'rxjs';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppEmployeeTableComponent } from 'src/app/pages/apps/employee/employee-table/employee-table.component';
import { environment } from 'src/environments/environment';
import { RouterLink } from '@angular/router';
import { WebSocketService } from 'src/app/services/socket/web-socket.service';

@Component({
  selector: 'app-employees-reports',
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
    AppEmployeeTableComponent,
    RouterLink
  ],
  providers: [
    provideNativeDateAdapter(),
  ],
  templateUrl: './app-employees-reports.component.html',
})
export class AppEmployeesReportsComponent implements OnInit, OnDestroy {
  @Output() dataSourceChange = new EventEmitter<any[]>();
  displayedColumns: string[] = [
    'profile',
    'workedHours',
    'completedTasks',
  ];
  customColumns: string[] = [ 'profile', 'workedHours', 'completedTasks'];
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
  refreshInterval: any;
  activeTimer: any;
  socketSubs: Subscription[] = [];
  allowedReportsManager: boolean = false;

  constructor(
    @Inject(RatingsEntriesService)
    private ratingsEntriesService: RatingsEntriesService,
    @Inject(UsersService) private usersService: UsersService,
    @Inject(EntriesService) private entriesService: EntriesService,
    public companiesService: CompaniesService,
    public reportsService: ReportsService,
    public snackBar: MatSnackBar
    , private webSocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    const allowedReportEmails = environment.allowedReportEmails;
    const email = localStorage.getItem('email');
    this.allowedReportsManager = this.role === '2' && allowedReportEmails.includes(email || '');
    const today = moment();
    const firstDayOfWeek = moment().startOf('week');
    const lastDayOfWeek = moment().endOf('week');
    this.startDate = firstDayOfWeek.toDate();
    this.endDate = lastDayOfWeek.toDate();
    if (this.role == '1' || this.allowedReportsManager || this.role == '4') {
      this.getCompanies();
      this.getDataSource();
    } else if (this.role == '3') {
      this.companiesService.getByOwner().subscribe((company: any) => {
        this.selectedClient = company?.company?.id || company?.company_id || 0;
        this.getDataSource();
      });
    } else {
      this.getDataSource();
    }

    this.refreshInterval = setInterval(() => {
      this.getDataSource();
    }, 300000);

    try {
      const sub1 = this.webSocketService.getClosedEntryStream().subscribe(() => {
        this.getDataSource();
      });
      this.socketSubs.push(sub1);
    } catch (e) {
      console.error('Failed to subscribe to closedEntry socket stream', e);
    }
    try {
      const sub2 = this.webSocketService.getStartedEntryStream().subscribe(() => {
        this.getDataSource();
      });
      this.socketSubs.push(sub2);
    } catch (e) {
      console.error('Failed to subscribe to startedEntry socket stream', e);
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.activeTimer) clearInterval(this.activeTimer);
    this.socketSubs.forEach(s => s.unsubscribe?.());
  }

  getCompanies() {
    this.companiesService.getCompanies().subscribe((res: any) => {
      this.companiesList = res;
    });
  }

  getDataSource() {
    if ((this.role == '1' || this.allowedReportsManager || this.role == '4') && (!this.selectedClient || this.selectedClient === 0)) {
      this.dataSource = [];
      this.filteredDataSource = [];
      this.dataSourceChange.emit(this.filteredDataSource);
      this.isLoading = false;
      return;
    }
    if (this.role == '3' && (!this.selectedClient || this.selectedClient === 0)) {
      this.dataSource = [];
      this.filteredDataSource = [];
      this.dataSourceChange.emit(this.filteredDataSource);
      this.isLoading = false;
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
          this.dataSource = data.ratings.map((employee: any) => ({
            profile: {
              id: employee.profile.id,
              name: employee.profile.name,
              position: employee.profile.position,
              image: null,
              department: employee.profile.department,
            },
            completed: employee.completed + '/' + employee.totalTasks,
            workedHours: employee.workedHours,
            activeEntry: employee.activeEntry,
            hoursLeft: employee.hoursLeft,
            status: employee.status,
            progress: employee.status === 'Online' ? 'success' : 'error',
          }));
          this.dataSource.forEach(emp => {
            emp._baseWorkedDecimal = this.HHMMSSToDecimal(emp.workedHours);
          });
          this.filterByUser();
          this.dataSourceChange.emit(this.filteredDataSource);
          if (this.dataSource.length === 0) {
            return of({ profilePics: [] });
          }
          const profilePicRequests = this.dataSource.map((task) =>
            this.usersService.getProfilePic(task.profile.id)
          );
          return forkJoin({ profilePics: forkJoin(profilePicRequests) });
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: ({ profilePics }) => {
          this.dataSource.forEach((task, index) => {
            task.profile.image = profilePics[index] || null;
          });
          this.setupActiveTimer();
        },
        error: () => {
          this.dataSource = [];
          this.filteredDataSource = [];
          this.dataSourceChange.emit(this.filteredDataSource);
        },
      });
  }

  private setupActiveTimer() {
    if (this.activeTimer) clearInterval(this.activeTimer);
    const hasActive = this.dataSource.some(d => d.activeEntry && d.activeEntry.start_time);
    if (!hasActive) return;
    this.activeTimer = setInterval(() => {
      const now = Date.now();
      this.dataSource.forEach(emp => {
        if (emp.activeEntry && emp.activeEntry.start_time) {
          const start = new Date(emp.activeEntry.start_time).getTime();
          if (!isNaN(start)) {
            const elapsedHours = (now - start) / 1000 / 3600; // hours
            emp._displayWorkedDecimal = emp._baseWorkedDecimal + elapsedHours;
            emp.workedHours = this.formatHoursToHMS(emp._displayWorkedDecimal);
          }
        } else {
          emp.workedHours = this.formatHoursToHMS(emp._baseWorkedDecimal || 0);
        }
      });
      this.filterByUser();
      this.dataSourceChange.emit(this.filteredDataSource);
    }, 1000);
  }

  HHMMSSToDecimal(timeStr: string): number {
    if (!timeStr || timeStr === '00:00:00') return 0;
    const parts = timeStr.split(':');
    if (parts.length !== 3) return 0;
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;
    return hours + (minutes / 60) + (seconds / 3600);
  }

  formatHoursToHMS(hoursDecimal: number): string {
    if (isNaN(hoursDecimal)) return '00:00:00';
    const totalSeconds = Math.round(hoursDecimal * 3600);
    const hoursPart = Math.floor(totalSeconds / 3600);
    const remainingSeconds = totalSeconds % 3600;
    const minutesPart = Math.floor(remainingSeconds / 60);
    const secondsPart = remainingSeconds % 60;
    return [
      String(hoursPart).padStart(2, '0'),
      String(minutesPart).padStart(2, '0'),
      String(secondsPart).padStart(2, '0')
    ].join(':');
  }

  filterByUser() {
    if (!this.selectedUserId) {
      this.filteredDataSource = [...this.dataSource];
    } else {
      this.filteredDataSource = this.dataSource.filter(
        (u) => u.profile.id === this.selectedUserId
      );
    }
    this.filteredDataSource.sort((a: any, b: any) => {
      const aActive = !!(a.activeEntry || a.status === 'Online');
      const bActive = !!(b.activeEntry || b.status === 'Online');
      if (aActive === bActive) return 0;
      return aActive ? -1 : 1;
    });
  }

  onUserChange(userId: number | null) {
    this.selectedUserId = userId;
    this.filterByUser();
    this.dataSourceChange.emit(this.filteredDataSource);
  }

  onDateRangeChange() {
    if (this.startDate && this.endDate) {
      this.getDataSource();
    }
  }

  onClientChange(clientId: number) {
    this.selectedClient = clientId;
    this.selectedUserId = null;
    this.getDataSource();
  }

  downloadReport(user: any): void {
    const datesRange = {
      firstSelect: moment(this.startDate).format('YYYY-MM-DD'),
      lastSelect: moment(this.endDate).format('YYYY-MM-DD'),
    };

    const filters = {
      user: { id: user.profile.id },
      company: this.selectedClient || 'all',
      project: 'all',
      byClient: false,
      useTimezone: false,
      multipleUsers: false,
    };

    this.reportsService
      .getReport(datesRange, { id: user.profile.id }, filters)
      .subscribe((file: Blob) => {
        const filename = `I-nimble_Report_${user.profile.name}_${moment(
          datesRange.firstSelect
        ).format('DD-MM-YYYY')}_${moment(datesRange.lastSelect).format(
          'DD-MM-YYYY'
        )}.xlsx`;

        const url = window.URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 0);
      });
  }

  downloadReportAll(format: 'excel' | 'pptx'): void {
    if (!this.dataSource?.length) return;

    const userIds = this.dataSource.map((u) => u.profile.id);

    const filters = {
      user: { id: userIds },
      company: this.selectedClient || 'all',
      project: 'all',
      byClient: false,
      useTimezone: true,
      multipleUsers: true,
      format
    };

    const datesRange = {
      firstSelect: moment(this.startDate).format('YYYY-MM-DD'),
      lastSelect: moment(this.endDate).format('YYYY-MM-DD'),
    };

    this.reportsService
      .getReport(datesRange, { id: userIds }, filters, format)
      .subscribe({
        next: (file: Blob) => {
          const ext = format === 'pptx' ? 'pptx' : 'xlsx';
          const filename = `I-nimble_Report_${moment(
            datesRange.firstSelect
          ).format('DD-MM-YYYY')}_${moment(datesRange.lastSelect).format(
            'DD-MM-YYYY'
          )}.${ext}`;

          const url = window.URL.createObjectURL(file);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 0);
        },
        error: () => {
          this.openSnackBar('Error getting reports', 'Close');
        },
      });
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
