import { Component, EventEmitter, Inject, Output, OnInit, OnDestroy } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { RatingsEntriesService } from '../../../services/ratings_entries.service';
import { UsersService } from '../../../services/users.service';
import { forkJoin, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { WebSocketService } from 'src/app/services/socket/web-socket.service';
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
  activeTimer: any;
  socketSubs: Subscription[] = [];

  constructor(
    @Inject(RatingsEntriesService)
    private ratingsEntriesService: RatingsEntriesService,
    @Inject(UsersService) private usersService: UsersService,
    private companieService: CompaniesService
    , private webSocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.getCompany();
    this.getDataSource();

    this.refreshInterval = setInterval(() => {
      this.getDataSource();
    }, 300000);

    try {
      const s1 = this.webSocketService.getClosedEntryStream().subscribe(() => this.getDataSource());
      this.socketSubs.push(s1);
    } catch (e) {}
    try {
      const s2 = this.webSocketService.getStartedEntryStream().subscribe(() => this.getDataSource());
      this.socketSubs.push(s2);
    } catch (e) {}
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.activeTimer) clearInterval(this.activeTimer);
    this.socketSubs.forEach(s => s.unsubscribe?.());
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
            activeEntry: employee.activeEntry,
            hoursLeft: employee.hoursLeft,
            status: employee.status,
            progress: employee.status === 'Online' ? 'success' : 'error',
          }));

          this.dataSource.forEach(emp => {
            emp._baseWorkedDecimal = this.HHMMSSToDecimal(emp.workedHours);
          });

          this.setupActiveTimer();

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
          task.profile.imagePath = profilePics[index];
        });
      });
  }

    setupActiveTimer() {
      if (this.activeTimer) clearInterval(this.activeTimer);
      const hasActive = this.dataSource.some(d => d.activeEntry && d.activeEntry.start_time);
      if (!hasActive) return;
      this.activeTimer = setInterval(() => {
        const now = Date.now();
        this.dataSource.forEach(emp => {
          if (emp.activeEntry && emp.activeEntry.start_time) {
            const start = new Date(emp.activeEntry.start_time).getTime();
            if (!isNaN(start)) {
              const elapsedHours = (now - start) / 1000 / 3600;
              emp.workedHours = this.formatHoursToHMS(emp._baseWorkedDecimal + elapsedHours);
            }
          } else {
            emp.workedHours = this.formatHoursToHMS(emp._baseWorkedDecimal || 0);
          }
        });
        this.dataSourceChange.emit(this.dataSource);
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
}