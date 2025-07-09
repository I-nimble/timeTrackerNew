import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
// import { SharedModule } from '../shared.module';
import { EntriesService } from 'src/app/services/entries.service';
import { WebSocketService } from 'src/app/services/socket/web-socket.service';
import { Subscription, interval } from 'rxjs';
import { CustomDatePipe } from 'src/app/services/custom-date.pipe';
import { Entry } from 'src/app/models/Entries';
// import { NotificationStore } from 'src/app/stores/notification.store';
import { LeaveRequestsService } from 'src/app/services/leave_requests.service';
import { UsersService } from 'src/app/services/users.service';
import moment from 'moment-timezone';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-timer',
  imports: [CommonModule],
  templateUrl: './timer.component.html',
  styleUrl: './timer.component.scss',
})
export class TimerComponent {
  @Input() userId: any;
  @Input() timeZone: string = 'America/Caracas';
  start_date: string = moment().format('YYYY/MM/DD');
  end_date: string = moment().format('YYYY/MM/DD');
  initializing: boolean = false;
  validStartTime: any;
  localValidStartTime: any;
  validEndTime: any;
  localValidEndTime: any;
  localEntryStartTime: any;
  localTime: any;
  justInTime?: boolean;
  initialized: boolean = false;
  private subscription: Subscription[] = [];
  private entries: any;
  private userType: any;
  public entry: Entry = {
    start_time: null,
    status: null,
    timeRef: undefined,
    started: '',
    totalHours: '',
  };
  public hasLeaveRequest: boolean = false;
  public leaveRequest?: any;
  user: any;

  constructor(
    private entriesService: EntriesService,
    private socketService: WebSocketService,
    public customDate: CustomDatePipe,
    private leaveRequestsService: LeaveRequestsService,
    private usersService: UsersService,
    private snackBar: MatSnackBar
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['timeZone'] &&
      changes['timeZone'].currentValue != changes['timeZone'].previousValue
    ) {
      this.getUser();
    }
  }

  ngOnInit(): void {
    this.getUser();
    this.userType = localStorage.getItem('role');

    this.socketService.socket.on('server:closedEntry', () => {
      this.subscription.forEach((sub) => sub.unsubscribe());
      this.getEntries();
    });
    this.socketService.socket.on('server:admin:newEntry', () => {
      this.getEntries();
    });
  }

  getUser() {
    this.usersService
      .getUsers({ searchField: '', filter: { id: this.userId } })
      .subscribe({
        next: (users) => {
          if (users.length > 0) {
            this.user = users[0];
            this.hasActiveLeaveRequest();
            this.checkInitializing();
            this.getEntries();
          }
        },
        error: () => {
          this.user = null;
        },
      });
  }

  startedEarly() {
    if (
      this.entry.status !== null &&
      this.validStartTime != null &&
      this.entry.start_time != null
    ) {
      const startTime = this.entry.start_time.getTime();
      const validStartTime = this.validStartTime.getTime();
      if (startTime && validStartTime) {
        return startTime <= validStartTime;
      }
    }
    return false;
  }

  utcToLocal(date: Date) {
    const utcMoment = moment(date).clone().utc(true);
    const localMoment = utcMoment.clone().tz(this.timeZone, false);
    return this.strToDate(localMoment.format('MM/DD/YYYY HH:mm:ss'));
  }

  checkInitializing() {
    const fiveMinutes = 5 * 60 * 1000;

    if (!this.user || !this.user.employee || !this.user.employee.schedule) {
      return;
    }

    const schedules = this.user.employee.schedule;
    if (schedules.length <= 0 && !this.initialized) {
      this.openSnackBar(
        `${this.user.name} ${this.user.last_name} doesn't have a defined schedule`,
        'Close'
      );
    } else {
      let dayOfWeek = new Date().getDay();
      dayOfWeek = this.convertDayOfWeek(dayOfWeek);

      schedules.forEach((schedule: any) => {
        const scheduleDays = schedule.days;
        const matchingDay = scheduleDays.find(
          (day: any) => dayOfWeek == day.id
        );

        if (matchingDay) {
          this.validStartTime = this.parseScheduleTime(schedule.start_time);
          this.localValidStartTime = this.utcToLocal(this.validStartTime);
          this.validEndTime = this.parseScheduleTime(schedule.end_time);
          this.localValidEndTime = this.utcToLocal(this.validEndTime);
        }
      });

      setInterval(() => {
        const utcTime = moment.utc().format('MM/DD/YYYY HH:mm:ss');
        this.localTime = this.strToDate(utcTime);

        if (this.validStartTime !== null) {
          if (
            this.localTime.getTime() >= this.validStartTime.getTime() &&
            this.localTime.getTime() <= this.validEndTime.getTime()
          ) {
            if (
              this.localTime.getTime() <=
              this.validStartTime.getTime() + fiveMinutes
            ) {
              if (!this.initializing) {
                this.initializing = true;
                this.justInTime = true;
                // if(this.userType == '1') this.store.addNotifications(`${this.user.name} ${this.user.last_name} Initializing...`);
              }
            } else if (this.entry.status == null) {
              if (this.justInTime) {
                this.justInTime = false;
                this.initializing = false;
              }
              // if(!this.notifiedLate && this.userType == '1') {
              //   this.store.addNotifications(`${this.user.name} ${this.user.last_name} is late. Please, talk to HR.`, 'error');
              //   this.notifiedLate = true
              // }
            }
          } else {
            if (this.initializing) this.initializing = false;
          }
        }
      }, 1000);
    }
    this.initialized = true;
  }

  convertDayOfWeek(dayOfWeek: any) {
    const dayMap: any = {
      0: 7, // Sunday
      1: 1, // Monday
      2: 2, // Tuesday
      3: 3, // Wednesday
      4: 4, // Thursday
      5: 5, // Friday
      6: 6, // Saturday
    };
    return dayMap[dayOfWeek];
  }

  strToDate(date: string) {
    const parts = date.split(' ');
    const dateParts = parts[0].split('/');
    const timeParts = parts[1].split(':');

    const month = parseInt(dateParts[0], 10);
    const day = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    const second = parseInt(timeParts[2], 10);

    const dateObject = new Date(year, month - 1, day, hour, minute, second);

    return dateObject;
  }

  parseScheduleTime(time: any) {
    const timeParts = time?.split(':');
    if (timeParts && timeParts.length === 3) {
      const timeHour = parseInt(timeParts[0], 10);
      const timeMinutes = parseInt(timeParts[1], 10);
      const timeSeconds = parseInt(timeParts[2], 10);
      const utcMoment = moment.utc(
        timeHour +
          ':' +
          this.padZero(timeMinutes) +
          ':' +
          this.padZero(timeSeconds),
        'HH:mm:ss',
        true
      );
      const convertedDate = this.strToDate(
        utcMoment.format('MM/DD/YYYY HH:mm:ss')
      );

      return convertedDate;
    } else {
      return null;
    }
  }

  getEntries() {
    const data = {
      user_id: this.userId,
      start_time: new Date(this.start_date),
      end_time: new Date(this.end_date),
    };
    this.entriesService.getAllEntries(data).subscribe(({ entries }) => {
      this.entries = entries;
      this.filterUsersData(this.entries, this.user);
    });
  }
  /**
   *
   * @param entries represents the logs of all the users
   * @param users
   * Append the entries to their respective users
   */
  filterUsersData(entries: any, user: any) {
    let acc: number = 0;
    entries.forEach((entry: any) => {
      if (user.id == entry.user_id) {
        acc += this.getHours(entry.start_time, entry.end_time);
      }
    });
    let status = entries.find(
      (item: any) => item.status === 0 && item.user_id === user.id
    );
    if (status) {
      const utcStartTime = moment
        .utc(status.start_time, true)
        .format('MM/DD/YYYY HH:mm:ss');
      this.entry.start_time = this.strToDate(utcStartTime);
      this.localEntryStartTime = this.utcToLocal(this.entry.start_time);

      let timer = interval(1000).subscribe(() => {
        const utcTime = moment.utc();
        const now = this.strToDate(utcTime.format('MM/DD/YYYY HH:mm:ss'));

        // if (this.startedEarly() || this.justInTime) {
        //   this.entry.started = this.customDate.getTotalHours(this.validStartTime.toISOString(), now);
        // } else {
        this.entry.started = this.customDate.getTotalHours(
          this.entry.start_time,
          now
        );
        // }
        this.entry.timeRef = this.getTimeAgo(this.entry.started.split(':'));
      });
      this.subscription.push(timer);
      this.entry.status = status.status;
    } else {
      this.entry.start_time = null;
      this.entry.started = '00:00:00 sec';
      this.entry.timeRef = null;
      this.entry.status = null;
    }
    this.entry.totalHours = this.formatHours(acc);
  }

  getTimeAgo(time: Array<any>) {
    if (time[1] == '00' && time[0] == '00') return 'sec';
    if (time[0] == '00') return 'min';
    return 'hours';
  }

  getHours(start_time: Date, end_time: Date) {
    const diff = new Date(end_time).getTime() - new Date(start_time).getTime();
    const total = diff / (60 * 60 * 1000);
    return total;
  }

  getWeek() {
    const firstdayWeek = moment().isoWeekday(1).format('YYYY/MM/DD');
    const today = moment().format('YYYY/MM/DD');
    // if(firstdayWeek == today){
    // const now = new Date();
    // this.start_date = moment(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)).format('YYYY-MM-DD')
    // this.end_time = moment(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)).format('YYYY-MM-DD')
    // }else{
    this.start_date = firstdayWeek;
    this.end_date = today;
    // this.end_time = moment().isoWeekday(7).format('YYYY-MM-DD');
    // }
  }

  formatHours(amountHours: number) {
    const hours = Math.floor(amountHours);
    const minutes = Math.floor((amountHours - hours) * 60);
    const seconds = Math.floor(((amountHours - hours) * 60 - minutes) * 60);
    return (
      this.padZero(hours) +
      ':' +
      this.padZero(minutes) +
      ':' +
      this.padZero(seconds)
    );
  }
  padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  hasActiveLeaveRequest() {
    const today = new Date();
    this.leaveRequestsService.get({ id: this.user.id, date: today }).subscribe({
      next: (res: any) => {
        if (res.length > 0) {
          this.hasLeaveRequest = true;
          this.leaveRequest = res[0];
        }
      },
      error: () => {
        this.hasLeaveRequest = false;
      },
    });
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
