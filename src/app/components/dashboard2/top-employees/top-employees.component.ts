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
import { WebSocketService } from '../../../services/socket/web-socket.service';
import { Subscription } from 'rxjs';
import { CompaniesService } from 'src/app/services/companies.service';

@Component({
  selector: 'app-top-employees',
  standalone: true,
  imports: [MaterialModule, CommonModule, MatMenuModule, MatButtonModule],
  templateUrl: './top-employees.component.html',
})
export class AppTopEmployeesComponent {
  displayedColumns: string[] = ['profile', 'status'];
  dataSource: any[] = [];
  companyId: any;
  
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
  private subscription: Subscription[] = [];

  constructor(
    @Inject(RatingsEntriesService) private ratingsEntriesService: RatingsEntriesService, 
    @Inject(UsersService) private usersService: UsersService,
    @Inject(EntriesService) private entriesService: EntriesService,
    private socketService: WebSocketService,
    private companieService: CompaniesService,

  ) {}

  ngOnInit(): void {
    this.getCompany();
    this.getDataSource();

    this.socketService.socket.on('server:closedEntry', () => {
    this.subscription.forEach((sub) => sub.unsubscribe());
      this.getDataSource();
    });
    this.socketService.socket.on('server:admin:newEntry', () => {
      this.getDataSource();
    });
  }

  getCompany(){
      this.companieService.getByOwner().subscribe((company: any) => {
        this.companyId = company.company_id;
      });
    
  }
  
  getDataSource() {
    this.ratingsEntriesService.getRange(this.dateRange).pipe(
      switchMap((tasks) => {

        const filteredTasks = tasks.filter(
        (task: any) => task.rating.company_id === this.companyId
      );
        // First set basic user data without profile pictures
        this.dataSource = filteredTasks.map((task: any) => ({
          profile: {
            id: task.rating.user.id,
            name: task.rating.user.name + ' ' + task.rating.user.last_name,
            position: task.rating.user.employees[0].position.title,
            image: null
          },
          completed: task.rating.goal,
          status: null 
        }));
  
        const profilePicRequests = this.dataSource.map(task => 
          this.usersService.getProfilePic(task.profile.id)
        );
        const entriesRequests = this.dataSource.map(task =>
          this.entriesService.getUsersEntries(task.profile.id)
        );
  
        return forkJoin({
          profilePics: forkJoin(profilePicRequests),
          entries: forkJoin(entriesRequests)
        });
      })
    ).subscribe(({ profilePics, entries }) => {
      // Update the dataSource with profile pictures and status
      this.dataSource.forEach((task, index) => {
        task.profile.image = profilePics[index];
        const userEntries = entries[index].entries;
        const status = userEntries.find(
          (item: any) => item.status === 0 && item.user_id === task.profile.id
        );
        task.status = status ? 'Online' : 'Offline';
        task.progress = status ? 'success' : 'error';
      });
    });
  }
}