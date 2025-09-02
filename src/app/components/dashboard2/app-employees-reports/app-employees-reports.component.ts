import { Component, EventEmitter, Inject, Output, OnInit, OnDestroy } from '@angular/core';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppEmployeeTableComponent } from 'src/app/pages/apps/employee/employee-table/employee-table.component';

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
  allowedRole2: boolean = false;

  constructor(
    @Inject(RatingsEntriesService)
    private ratingsEntriesService: RatingsEntriesService,
    @Inject(UsersService) private usersService: UsersService,
    @Inject(EntriesService) private entriesService: EntriesService,
    public companiesService: CompaniesService,
    public reportsService: ReportsService,
    public snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const allowedEmails = ['pgarcia@i-nimble.com', 'jnava@i-nimble.com'];
    const email = localStorage.getItem('email');
    this.allowedRole2 = this.role === '2' && allowedEmails.includes(email || '');
    const today = moment();
    this.startDate = today.toDate();
    this.endDate = today.toDate();
    if (this.role == '1' || this.allowedRole2) {
      this.getCompanies();
    }
    this.getDataSource();

    this.refreshInterval = setInterval(() => {
      this.getDataSource();
    }, 300000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
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
      this.filteredDataSource = [];
      this.dataSourceChange.emit(this.filteredDataSource);
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
            hoursLeft: employee.hoursLeft,
            status: employee.status,
            progress: employee.status === 'Online' ? 'success' : 'error',
          }));
          this.filterByUser();
          this.dataSourceChange.emit(this.filteredDataSource);

          const profilePicRequests = this.dataSource.map((task) =>
            this.usersService.getProfilePic(task.profile.id)
          );
          return forkJoin({
            profilePics: forkJoin(profilePicRequests),
          });
        })
      )
      .subscribe(({ profilePics }) => {
        this.dataSource.forEach((task, index) => {
          task.profile.image = profilePics[index];
        });
        this.isLoading = false;
      });
  }

  filterByUser() {
    if (!this.selectedUserId) {
      this.filteredDataSource = [...this.dataSource];
    } else {
      this.filteredDataSource = this.dataSource.filter(
        (u) => u.profile.id === this.selectedUserId
      );
    }
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

  onClientChange(client: any) {
    this.selectedClient = client.id;
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

  downloadReportAll(): void {
    if (!this.dataSource?.length) return;

    const userIds = this.dataSource.map((u) => u.profile.id);

    const filters = {
      user: { id: userIds },
      company: this.selectedClient || 'all',
      project: 'all',
      byClient: false,
      useTimezone: false,
      multipleUsers: true,
    };

    const datesRange = {
      firstSelect: moment(this.startDate).format('YYYY-MM-DD'),
      lastSelect: moment(this.endDate).format('YYYY-MM-DD'),
    };

    this.reportsService
      .getReport(datesRange, { id: userIds }, filters)
      .subscribe({
        next: (file: Blob) => {
          const filename = `I-nimble_Report_${moment(
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
        },
        error: (err) => {
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
