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
import { MatSnackBar } from '@angular/material/snack-bar';

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
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
  ],
  templateUrl: './app-employees-reports.component.html',
})
export class AppEmployeesReportsComponent {
  @Output() dataSourceChange = new EventEmitter<any[]>();
  displayedColumns: string[] = [
    'profile',
    'workedHours',
    'completedTasks',
    'status',
    'reports',
  ];
  dataSource: any[] = [];
  startDate: any = '';
  endDate: any = '';
  dateRange: any = {};
  role = localStorage.getItem('role');
  selectedClient: any = 0;
  companiesList: any[] = [];
  isLoading = false;

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
          this.dataSource = data.ratings.map((employee: any) => ({
            profile: {
              id: employee.profile.id,
              name: employee.profile.name,
              position: employee.profile.position,
              image: null,
            },
            completed: employee.completed + '/' + employee.totalTasks,
            workedHours: employee.workedHours,
            hoursLeft: employee.hoursLeft,
            status: employee.status,
            progress: employee.status === 'Online' ? 'success' : 'error',
          }));

          const profilePicRequests = this.dataSource.map((task) =>
            this.usersService.getProfilePic(task.profile.id)
          );
          this.dataSourceChange.emit(this.dataSource);
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

  downloadReport(user: any): void {
    const datesRange = {
      firstSelect: moment(this.startDate).format('YYYY-MM-DD'),
      lastSelect: moment(this.endDate).format('YYYY-MM-DD'),
    };

    const filters = {
      user: { id: user.id },
      company: this.selectedClient || 'all',
      project: 'all',
      byClient: false,
      useTimezone: false,
      multipleUsers: false,
    };

    this.reportsService
      .getReport(datesRange, user, filters)
      .subscribe((file: Blob) => {
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
