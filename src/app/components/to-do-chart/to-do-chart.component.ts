import { Component, Input, OnChanges, SimpleChanges, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { SharedModule } from 'src/app/components/shared.module';
import { RatingsEntriesService } from 'src/app/services/ratings_entries.service';
import { UsersService } from 'src/app/services/users.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ToDoFormPopupComponent } from 'src/app/components/to-do-form-popup/to-do-form-popup.component';
import { RatingsService } from 'src/app/services/ratings.service';
import { ChangeDetectorRef } from '@angular/core';
import { Entry } from 'src/app/models/Entries';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-to-do-chart',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule,MatTooltipModule],
  templateUrl: './to-do-chart.component.html',
  styleUrls: ['./to-do-chart.component.scss']
})
export class ToDoChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() ratingsData: any[] = []; 
  @Input() selectedDate: string = ''; 
  @Output() dateChange = new EventEmitter<string>();
  @Output() formSubmitted = new EventEmitter<{ option: any; formValue?: any }>();
  @Output() toDoListUpdated = new EventEmitter();

  public displayDate: Date = new Date();
  btnDisabled: boolean = true;
  hours: string[] = [];
  isCalendarOpen: boolean = true
  datesRange: any = {};
  calendarHead: any;
  datesSelection: any;
  selectedTeamMember: any;
  tasksEntries!: any[];
  employeeRatings!: any[];
  private teamMemberSubscription!: Subscription;
  visibleHours: string[] = [];
  hoursIndex: number = 0;

  formHeader = { mode: 'Create', title: 'To Do' };
  managementForm: FormGroup = this.fb.group({
    rating: this.fb.group({
      goal: ['', [Validators.required]],
      recommendations: [''],
      is_numeric: [false],
      numeric_goal: [null],
      due_date: [null],
      priority: [null],
      recurrent: [false],
    },
    { validators: this.recurrentDueDateValidator }),
  });
  role: string = localStorage.getItem('role') || '';
  options = [
    {
      title: 'To Do',
      label: 'Set and rate the employee To Do',
      active: true,
      formGroup: 'rating',
      form: [
        { label: 'Goal', type: 'text', control: 'goal' },
        { label: 'Recommendations', type: 'textarea', control: 'recommendations' },
        { label: 'Recurrent', type: 'checkbox', control: 'recurrent' },
        { label: 'Due date', type: 'date', control: 'due_date' },
        { label: 'Priority', type: 'select', control: 'priority' },
      ],
      elements: [],
    },
  ];

  constructor(
    private fb: FormBuilder,
    private ratingsService: RatingsService,
    private ratingsEntriesService: RatingsEntriesService,
    private usersService: UsersService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {
  }
  
  ngOnInit() {
    this.initializeCurrentWeek();
    this.populateHours();
    this.updateVisibleHours();
    
    const role = localStorage.getItem('role');
    if(role === '2') {
      this.usersService.getUsers({ searchField: '', filter: { currentUser: true } }).subscribe((users) => {
        this.selectedTeamMember = users[0].id;
        this.getRatings();
        this.getEntries();
      });
    }
    else {
      this.teamMemberSubscription = this.usersService.teamMember$.subscribe((teamMemberId) => {
        if (teamMemberId !== null) {
          this.selectedTeamMember = teamMemberId;
          this.getRatings();
          this.getEntries();
        }
      });
    }

    this.managementForm.get('rating.recurrent')?.valueChanges.subscribe((recurrent: boolean) => {
      const dueDateControl = this.managementForm.get('rating.due_date');
      if (recurrent) {
        dueDateControl?.setValue(null);
        dueDateControl?.disable();
      } else {
        dueDateControl?.enable();
      }
    });
  }

  recurrentDueDateValidator(group: FormGroup) {
    const recurrent = group.get('recurrent')?.value;
    const dueDateControl = group.get('due_date');
    if (recurrent && dueDateControl?.value) {
      return { recurrentDueDateError: true };
    }
    return null;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedDate']) {
      this.displayDate = new Date(this.selectedDate);
    }
  }

  ngOnDestroy() {
    if (this.teamMemberSubscription) {
      this.teamMemberSubscription.unsubscribe();
    }
  }

  initializeCurrentWeek() {
    this.selectedDate = this.formatDate(this.displayDate);
    const startOfWeek = moment(this.displayDate).startOf('week');
    const endOfWeek = moment(this.displayDate).endOf('week');
    // Set date range as YYYY-MM-dd
    this.datesRange.firstSelect = startOfWeek.toISOString().split('T')[0];
    this.datesRange.lastSelect = endOfWeek.toISOString().split('T')[0];
    const dates = [];
    for (let day = startOfWeek; day <= endOfWeek; day.add(1, 'day')) {
      dates.push(day.toDate());
    }
    this.datesSelection = dates;
  }

  toggleCalendar() {
    this.isCalendarOpen = !this.isCalendarOpen;
  }

  setDatesGroup(dateRange: any) {
      this.toggleCalendar();
      const startDate = new Date(dateRange.firstSelect);
      const endDate = new Date(dateRange.lastSelect);
      // Set date range as YYYY-MM-dd
      this.datesRange.firstSelect = startDate.toISOString().split('T')[0];
      this.datesRange.lastSelect = endDate.toISOString().split('T')[0];
      const dates = [];
      for (let day = startDate; day <= endDate; day.setDate(day.getDate() + 1)) {
        dates.push(new Date(day));
      }
      this.calendarHead =
        moment(new Date(this.datesRange.firstSelect)).format('MMM, DD') +
        ' - ' +
        moment(new Date(this.datesRange.lastSelect)).format('MMM, DD');
      this.datesSelection = dates;
  }

  getEntries() {
    // Get ratings entries for the selected date range and user
    this.ratingsEntriesService
      .getRange(this.datesRange, this.selectedTeamMember)
      .subscribe((data) => {
        this.tasksEntries = data;
      });
  }

  getRatings() {
    // Get employee ratings
    this.ratingsService.getByUser(this.selectedTeamMember).subscribe((data) => {
      this.employeeRatings = data;
    });
  }

  getTasksForDayAndHour(day: any, hour: any) {
    if(this.tasksEntries) {
      const entries = this.tasksEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const entryTime = moment(entry.createdAt).format('hh:00 A');
        return entryDate.toDateString() == day.toDateString() && (entryTime == hour)
      });
      if (entries.length > 0) { // Completed tasks
        const tasks = entries.map(entry => entry.rating.goal).join(', ');
        const details = entries.map(entry => entry.details).join('\n');
        return {completed: true, tasks, details};
      }
      else { // Pending tasks
        const ratings = this.employeeRatings?.filter(rating => {
          if(!rating.due_date) return false;
          const ratingDate = moment.utc(rating.due_date).format('YYYY-MM-DD');
          const ratingTime = moment.utc(rating.due_date).format('hh:00 A');
          const dayString = moment.utc(day).format('YYYY-MM-DD');
          return ratingDate == dayString && (ratingTime == hour);
        });
        if (ratings?.length > 0) {
          const tasks = ratings.map(rating => rating.goal).join(', ');
          return {completed: false, tasks};
        }
      }
    }
    return {completed: false, tasks: ''};
  }

  openFormModal(day: any, hour: any) {
    const formattedDueDate = this.formatDayAndHour(day, hour);

    const dialogRef = this.dialog.open(ToDoFormPopupComponent, {
      data: {
        teamMember: this.selectedTeamMember,
        formHeader: this.formHeader,
        managementForm: this.managementForm,
        selectedForm: null,
        role: this.role,
        options: this.options,
      },
      width: '600px',
      backdropClass: 'blur'
    });

    dialogRef.componentInstance.data.managementForm
      .get('rating')
      ?.patchValue({ due_date: formattedDueDate });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'submit') {
        this.formSubmitted.emit({ option: result.option, formValue: result.formValue });
        this.toDoListUpdated.emit();
        this.getRatings();
        this.getEntries();
        this.cdr.detectChanges();
      }
    });
  }

  private formatDayAndHour(day: any, hour: any): string {
    const date = new Date(day);
    const [time, period] = hour.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    const formattedDate = date.toISOString().split('T')[0]; // Get YYYY-MM-DD
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`; // Get HH:mm
    return `${formattedDate}T${formattedTime}`; // Combine into YYYY-MM-DDTHH:mm
  }

  private formatDate(date: Date): string {
    const year = date?.getFullYear();
    const month = String(date?.getMonth() + 1).padStart(2, '0');
    const day = String(date?.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private populateHours() {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const hour = i % 12 === 0 ? 12 : i % 12;
      const period = i < 12 ? 'AM' : 'PM';
      hours.push(`${hour.toString().padStart(2, '0')}:00 ${period}`);
    }
    this.hours = hours;
    this.updateVisibleHours(); // Ensure visible hours are updated after populating
  }

  private updateVisibleHours() {
    this.visibleHours = this.hours.slice(this.hoursIndex, this.hoursIndex + 7);
  }

  moveHoursUp() {
    if (this.hoursIndex > 0) {
      this.hoursIndex -= 1;
      this.updateVisibleHours();
    }
  }

  moveHoursDown() {
    if (this.hoursIndex + 7 < this.hours.length) {
      this.hoursIndex += 1;
      this.updateVisibleHours();
    }
  }
}