import { Component, EventEmitter, Inject, Output, OnInit, OnDestroy } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { RatingsEntriesService } from '../../../services/ratings_entries.service';
import { UsersService } from '../../../services/users.service';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CompaniesService } from 'src/app/services/companies.service';
import { AppEmployeeTableComponent } from '../../../pages/apps/employee/employee-table/employee-table.component';
import moment from 'moment';

@Component({
  selector: 'app-top-employees',
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    MatMenuModule,
    MatButtonModule,
    AppEmployeeTableComponent,
  ],
  templateUrl: './top-employees.component.html',
})
export class AppTopEmployeesComponent implements OnInit, OnDestroy {
  @Output() dataSourceChange = new EventEmitter<any[]>();
  displayedColumns: string[] = ['profile', 'status'];
  dataSource: any[] = [];
  companyId: any;
  customColumns: string[] = ['name', 'status'];
  dateRange: any;
  refreshInterval: any;

  constructor(
    @Inject(RatingsEntriesService)
    private ratingsEntriesService: RatingsEntriesService,
    @Inject(UsersService) private usersService: UsersService,
    private companieService: CompaniesService
  ) {}

  ngOnInit(): void {
    this.getCompany();
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

  getCompany() {
    this.companieService.getByOwner().subscribe((company: any) => {
      this.companyId = company.company_id;
    });
  }

  getDataSource() {
    this.dateRange = {
      firstSelect: moment().format('YYYY-MM-DD'),
      lastSelect: moment().format('YYYY-MM-DD'),
      company_id: this.companyId,
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
      });
  }
}