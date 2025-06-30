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

@Component({
  selector: 'app-productivity-reports',
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
  templateUrl: './productivity-reports.component.html',
})
export class AppProductivityReportsComponent {
  @Output() dataSourceChange = new EventEmitter<any[]>();
  displayedColumns: string[] = [
    'profile',
    'completedTasks',
    'totalTasks',
    'pendingTasks',    
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

  constructor(
    @Inject(RatingsEntriesService)
    private ratingsEntriesService: RatingsEntriesService,
    @Inject(UsersService) private usersService: UsersService,
    @Inject(EntriesService) private entriesService: EntriesService,
    public companiesService: CompaniesService,
    public reportsService: ReportsService
  ) {}

  ngOnInit(): void {
    const today = moment();
    this.startDate = today.toDate();
    this.endDate = today.toDate();
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

            const pendingTasks = totalTasks - completedTasks;

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
              pendingTasks: pendingTasks,
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
}
