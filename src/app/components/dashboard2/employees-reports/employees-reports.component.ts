import { Component, Inject } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { RatingsEntriesService } from '../../../services/ratings_entries.service';
import { UsersService } from '../../../services/users.service';
import { EntriesService } from '../../../services/entries.service';
import { forkJoin, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-employees-reports',
  standalone: true,
  imports: [MaterialModule, CommonModule, MatMenuModule, MatButtonModule],
  templateUrl: './employees-reports.component.html',
})
export class AppEmployeesReportsComponent {
  displayedColumns: string[] = ['profile', 'completed', 'status'];
  dataSource: any[] = [];
  
  getCurrentWeekDates() {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    
    return {
      firstSelect: sevenDaysAgo.toISOString().split('T')[0],
      lastSelect: today.toISOString().split('T')[0]
    };
  }

  dateRange: any = this.getCurrentWeekDates();

  constructor(
    @Inject(RatingsEntriesService) private ratingsEntriesService: RatingsEntriesService, 
    @Inject(UsersService) private usersService: UsersService,
    @Inject(EntriesService) private entriesService: EntriesService
  ) {}

  ngOnInit(): void {
    this.getDataSource();
  }
  
  getDataSource() {
    console.log(this.dateRange)
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
            status: employee.status,
            progress: employee.status === 'Online' ? 'success' : 'error',
          })
        })
  
        const profilePicRequests = this.dataSource.map(task => 
          this.usersService.getProfilePic(task.profile.id)
        );
  
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
}