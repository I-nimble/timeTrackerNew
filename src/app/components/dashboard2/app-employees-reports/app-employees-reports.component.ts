import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { RatingsEntriesService } from '../../../services/ratings_entries.service';
import { UsersService } from '../../../services/users.service';
import { EntriesService } from '../../../services/entries.service';
import { forkJoin, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import moment from 'moment';
import { MAT_DATE_LOCALE } from '@angular/material/core';

@Component({
  selector: 'app-employees-reports',
  standalone: true,
  imports: [MaterialModule, CommonModule, MatMenuModule, MatButtonModule, FormsModule, MatDatepickerModule,MatNativeDateModule,],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  templateUrl: './app-employees-reports.component.html',
})
export class AppEmployeesReportsComponent {
  @Output() dataSourceChange = new EventEmitter<any[]>();
  displayedColumns: string[] = ['profile', 'workedHours', 'completedTasks', 'status'];
  dataSource: any[] = [];
  startDate: any = '';
  endDate: any = '';
  dateRange: any = {};

  constructor(
    @Inject(RatingsEntriesService) private ratingsEntriesService: RatingsEntriesService, 
    @Inject(UsersService) private usersService: UsersService,
    @Inject(EntriesService) private entriesService: EntriesService
  ) {}

  ngOnInit(): void {
    const today = moment();
    this.startDate = today.clone().startOf('isoWeek').toDate();
    this.endDate = today.clone().endOf('isoWeek').toDate();
    this.getDataSource();
  }
  
  getDataSource() {
    this.dateRange = {
      firstSelect: moment(this.startDate).format('YYYY-MM-DD'),
      lastSelect: moment(this.endDate).format('YYYY-MM-DD')
    }
    this.ratingsEntriesService.getTeamReport(this.dateRange).pipe(
    switchMap((data) => {
      // First set basic user data without profile pictures
      this.dataSource = data.ratings.map((employee: any) => {
        return ({
          profile: {
            id: employee.profile.id,
            name: employee.profile.name,
            position: employee.profile.position,
            image: null
          },
          completed: employee.completed + '/' + employee.totalTasks,
          workedHours: employee.workedHours,
          hoursLeft: employee.hoursLeft,
          status: employee.status,
          progress: employee.status === 'Online' ? 'success' : 'error',
        })
      })

      const profilePicRequests = this.dataSource.map(task => 
        this.usersService.getProfilePic(task.profile.id)
      );
      this.dataSourceChange.emit(this.dataSource);
      return forkJoin({
        profilePics: forkJoin(profilePicRequests)
      });
    })
    ).subscribe(({ profilePics }) => {
      // Update the dataSource with profile pictures and status
      this.dataSource.forEach((task, index) => {
        task.profile.image = profilePics[index];
      });
    });
  }

  onDateRangeChange() {
    if (this.startDate && this.endDate) {
      this.getDataSource();
    }
  }
}