import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  OnDestroy,
  Output,
  SimpleChanges,
  inject,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { Entries } from '../../models/Entries';
import { CustomDatePipe } from '../../services/custom-date.pipe';
import { ProjectsService } from 'src/app/services/projects.service';
import { SchedulesService } from 'src/app/services/schedules.service';
import { Project } from 'src/app/models/Project.model';
import { EntriesService } from 'src/app/services/entries.service';
import { RatingsService } from 'src/app/services/ratings.service';
import { MatDialog } from '@angular/material/dialog';
import { NotificationsService } from 'src/app/services/notifications.service';
import { UsersService } from 'src/app/services/users.service';
import moment from 'moment-timezone';
import { Router } from '@angular/router';
import Cookies from 'js-cookie';
import { environment } from 'src/environments/environment';
import { ToDoPopupComponent } from '../to-do-popup/to-do-popup.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-entries-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './entries-panel.component.html',
  styleUrls: ['./entries-panel.component.scss'],
})
export class EntriesPanelComponent implements OnChanges, OnInit, OnDestroy {
  @Output() start_entry: EventEmitter<any> = new EventEmitter<any>();
  @Output() end_entry: EventEmitter<any> = new EventEmitter<any>();
  @Output() cancel_entry: EventEmitter<any> = new EventEmitter<any>();
  @Input() currentEntryId: any;
  @Input() start_time!: Date | null;
  @Input() entryCheck: boolean = false;
  @Input() timeZone: string = 'America/Caracas';
  @Input() entry: Entries = {
    status: 0,
    description: '',
    start_time: new Date(),
    end_time: new Date(),
    date: new Date(),
    project_id: '',
    project: '',
  };
  showProjects: boolean = false;
  showMoreOption: boolean = false;
  currentTime: any;
  timer: string = '00:00:00';
  loading: boolean = true;
  validStartTime: any = null;
  UTCValidStartTime: any = null
  endOfShift: any = null
  startTime: any = null;
  UTCStartTime: any = null;
  currentDateTime: any = null
  justInTime?: boolean;
  profilePic?: any;
  projects: any = [];
  intervalId?:any = null
  showStartingMessage: boolean = false
  canStart: boolean = true
  userName: string = '';
  assetsPath: string = environment.assets + '/default-profile-pic.png';

  constructor(
    public customDate: CustomDatePipe,
    private projectService: ProjectsService,
    private schedulesService: SchedulesService,
    private entriesService: EntriesService,
    private usersService: UsersService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private ratingsService: RatingsService,
    private dialog: MatDialog, 
    private notificationsService: NotificationsService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    if (Cookies.get('ToDoNotificationSent') === 'true') {
      this.notificationsService.ToDoNotificationSent = true;
    }
    this.getUsername();
    this.getImage();
    document.addEventListener('click', this.toggleMenu.bind(this));
    this.getStartTime();
    this.getProjects();
    this.validateStartTime();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['entryCheck']) {
      this.validateStartTime()
      this.getStartTime()

      if (this.entryCheck) {
        if(this.currentTime == null){
          if (this.justInTime) {
            this.validateStartTime()
          } 
          else {
            this.getStartTime()
          }
        }
      }
      if (!this.entryCheck) this.stopTimer();
    }
    if (changes['timeZone'] && changes['timeZone'].currentValue != changes['timeZone'].previousValue) {
      this.validateStartTime();
      this.getStartTime()
    }
  }

  isWaitingToStart() {
    if (this.UTCStartTime >= this.currentDateTime) {
      this.showStartingMessage = true; 
      return true
    } else {
      return false
    }
  }

  public getImage() {
    this.usersService.getProfilePic().subscribe({
      next: (image: any) => {
        if (image) {
          this.profilePic = image;
        }
      }
    });
  }

  getStartTime() {
    const now = new Date();
    const convertedLocaltime = moment.tz(now, this.timeZone).format('MM-DD-YYYY HH:mm:ss');
    this.startTime = this.strToDate(convertedLocaltime);

    this.entriesService.getAllEntries({}).subscribe((entries) => {
      const active = entries.entries.filter((entry:any) => entry.status == 0)[0];

      if (active && active.start_time) {
        this.UTCStartTime = this.strToDate(moment.utc(active.start_time).format('MM-DD-YYYY HH:mm:ss'));
        const utcStartTime = moment.utc(active.start_time, true);
        if (utcStartTime.isValid()) {
          const convertedStartTime = utcStartTime.tz(this.timeZone);
          if (convertedStartTime && convertedStartTime.isValid()) {
            this.startTime = this.strToDate(convertedStartTime.format('MM-DD-YYYY HH:mm:ss'));
          }
        }
        if(this.entryCheck) {
          this.stopTimer();
          this.startTimer(this.UTCStartTime);
        }
      }
    });
  }

  startedEarly() {
    if (this.entryCheck && this.validStartTime != null && this.startTime != null) {
      const startTime = this.startTime.getTime()
      const validStartTime = this.validStartTime.getTime()
      if (startTime && validStartTime) {
        return startTime <= validStartTime
      }
    }
    return false
  }

  convertToCompanyStr(timeString:string) {
    const UTCTime = moment.utc(timeString, 'HH:mm:ss', true);
    const momentTime = UTCTime.tz(this.timeZone);
    if (momentTime?.isValid()) {
    const companyTimeString = momentTime.format('HH:mm:ss');
    return companyTimeString;
    }
    return ;
  }

  validateStartTime() {
    this.schedulesService.get().subscribe({
      next: (schedules:any) => {
        const fiveMinutes = 5 * 60 * 1000;

        schedules = schedules.schedules
        if(schedules.length <= 0 ) {
          this.showSnackbar("You don't have a defined schedule.");
        } else {
          let dayOfWeek:any = null
          if (this.entry.date)  dayOfWeek = new Date(`${this.entry.date}T00:00:00`).getUTCDay()
          else dayOfWeek = new Date().getUTCDay()
          if (dayOfWeek == 0) dayOfWeek = 7

          schedules.forEach((schedule: any) => {
            const scheduleDays = schedule.days;
            const matchingDay = scheduleDays.find((day:any) => dayOfWeek == day.id);
            if (matchingDay) {
              this.validStartTime = this.parseStartTime(schedule.start_time)
              this.endOfShift = this.parseEndOfShift(schedule.end_time)
            }
            else {
              this.canStart = false
              this.loading = false
            }
          });
  
          this.ngZone.runOutsideAngular(() => {
            this.intervalId = setInterval(() => {
              this.ngZone.run(() => {
                const UTCTime = moment.utc().format('MM-DD-YYYY HH:mm:ss');
                this.currentDateTime = this.strToDate(UTCTime);
      
                if (this.validStartTime !== null) {
                  if (this.currentDateTime.getTime() <= (this.UTCValidStartTime.getTime() + fiveMinutes)
                      && this.currentDateTime.getTime() >= this.UTCValidStartTime.getTime()) {
                    this.justInTime = true
                  } else {
                    this.justInTime = false
                  }
                }
                if (this.endOfShift !== null && (!this.notificationsService.ToDoNotificationSent || 
                    (localStorage.getItem('toDoNotificationSent') && localStorage.getItem('toDoNotificationSent') == 'false'))) {
                  if (this.currentDateTime.getTime() >= (this.endOfShift.getTime() - fiveMinutes)
                      && this.currentDateTime.getTime() <= this.endOfShift.getTime()) {

                    this.notificationsService.ToDoNotificationSent = true
                    Cookies.set('toDoNotificationSent', 'true', { expires: 1 });
                    this.notificationsService.rememberToDo({}).subscribe({
                      error: (res:any) => {
                        this.showSnackbar("Remember to log your achieved goals.");
                      }
                    })
                  }
                }
                if(this.currentDateTime && this.validStartTime && this.loading) {
                  this.loading = false
                  this.cdr.detectChanges()
                }
              });
            }, 1000);
          });
        }
      }
    })
  }

  parseStartTime(startTime:any) {
    const startTimeParts = startTime?.split(':');
    if (startTimeParts && startTimeParts.length === 3) {
      const companyStartTime = this.convertToCompanyStr(startTime)

      const utcValidStartTimeMoment = moment.utc(startTime, 'HH:mm:ss', true);
      this.UTCValidStartTime = this.strToDate(utcValidStartTimeMoment.format('MM-DD-YYYY HH:mm:ss'));
      
      const companyValidStartTimeMoment = moment(companyStartTime, 'HH:mm:ss', true)
      this.validStartTime = this.strToDate(companyValidStartTimeMoment.format('MM-DD-YYYY HH:mm:ss'));

      if(this.entryCheck && this.currentTime == null && this.justInTime && this.UTCValidStartTime) {
        this.startTimer(this.UTCValidStartTime)
      }
      return this.validStartTime
    } else {
      return null;
    }
  }

  parseEndOfShift(endTime:any) {
    const endTimeParts = endTime?.split(':');
    if (endTimeParts && endTimeParts.length === 3) {
      const endTimeHour = parseInt(endTimeParts[0], 10);
      const endTimeMinute = parseInt(endTimeParts[1], 10);
      const endTimeSecond = parseInt(endTimeParts[2], 10);
      const caracasTime = moment.tz(
        `${endTimeHour}:${endTimeMinute}:${endTimeSecond}`,
        'HH:mm:ss',
        'America/Caracas'
      );
      if (caracasTime.isValid()) {
        let convertedEndOfShiftMoment = caracasTime;
        if (this.timeZone && this.timeZone !== 'America/Caracas') {
          convertedEndOfShiftMoment = caracasTime.clone().tz(this.timeZone);
        }
        const convertedEndOfShift = convertedEndOfShiftMoment.format('MM-DD-YYYY HH:mm:ss'); 
        const endOfShiftDate = this.strToDate(convertedEndOfShift);
        const UTCEndOfShift = this.strToDate(
          moment(endOfShiftDate).tz(this.timeZone, true)?.utc().format('MM-DD-YYYY HH:mm:ss')
        );
        return UTCEndOfShift;
      }
      return;
    } else {
      return null;
    }
  }

  strToDate(date:string) {
    const parts = date?.split(' ');
    const dateParts = parts[0]?.split('-');
    const timeParts = parts[1]?.split(':');

    const month = parseInt(dateParts[0], 10);
    const day = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    const second = parseInt(timeParts[2], 10);

    const dateObject = new Date(year, month - 1, day, hour, minute, second);

    return dateObject
  }

  getProjects() {
    this.projectService.get().subscribe({
      next: (projects: Project[]) => {
        this.projects = projects;
      },
    });
  }
  addEntry() {
    this.loading = true;
    this.showStartingMessage = false; 
    setTimeout(() => {
      this.showStartingMessage = true;
    }, 1000);
    let start_time
    if (this.justInTime) { 
      start_time = moment.utc(this.UTCValidStartTime + 'Z').format('YYYY-MM-DDTHH:mm:ss.000Z');
    } else {
      start_time = moment.utc().format('YYYY-MM-DDTHH:mm:ss.000Z');
    }

    const data = {
      description: this.entry.description,
      status: this.entry.status,
      start_time: start_time,
      project_id: this.entry.project_id,
    };
    this.start_entry.emit(data);
  }
  async endCurrentEntry() {
    this.end_entry.emit(this.entry);
  }
  updateVariablesOnEnd() {
    this.timer = '00:00:00';
    this.entry.description = '';
    this.entry.project_id = '';
    this.startTime = null
    this.UTCStartTime = null
  }
  cancelCurrentEntry() {
    this.cancel_entry.emit(this.entry);
  }
  public getUsername() {
    this.usersService.getUsername().subscribe({
      next: (username) => {
        if(username) {
          this.userName = username;
        }
      },
      error: () => {
        this.showSnackbar('Error getting user name');
      }
    })
  }
  
  public toggleMenu(event: any) {
    if (!(event.target as HTMLElement).closest('.options-btn')) {
      this.showMoreOption = false;
      this.showProjects = false;
    }
    if ((event.target as HTMLElement).closest('#project-options')) {
      this.showMoreOption = false;
      this.showProjects = !this.showProjects;
    }
    if ((event.target as HTMLElement).closest('#more-btn')) {
      this.showProjects = false;
      this.showMoreOption = !this.showMoreOption;
    }
  }

  public startTimer(start_time: any) {
    this.currentTime = setInterval(() => {
      this.timer = this.customDate.getTotalHours(start_time, this.currentDateTime);
    }, 1000);
  }
  public stopTimer() {
    this.timer = '00:00:00';
    clearInterval(this.currentTime);
    this.currentTime = null
  }
  public setProject(project: Project) {
    this.entry.project_id = project.id;
    this.entry.project = project.name;
  }

  public checkToDoLogged() {
    this.endCurrentEntry()
    this.ratingsService.checkToDoLogged(new Date()).subscribe({
      next: (res) => {
        if (res.result == 'pending') {
          let dialogRef = this.dialog.open(ToDoPopupComponent, {
            height: 'max-content',
            width: '500px',
            hasBackdrop: true,
            backdropClass: 'blur'
          }); 
          dialogRef.afterClosed().subscribe(result => {
            if (result == 'now') {
              // this.router.navigate(['ratings/tm']);
            }
          });
        }
      },
      error: (err) => {
        this.showSnackbar('Error checking today goals');
        console.error(err)
      }
    })
  }

  todayStr() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  showSnackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}