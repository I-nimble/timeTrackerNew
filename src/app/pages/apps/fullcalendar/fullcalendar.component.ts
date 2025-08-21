import {
  Component,
  ChangeDetectionStrategy,
  Inject,
  signal,
  OnInit,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule, DOCUMENT, NgSwitch } from '@angular/common';
import {
  MatDialog,
  MatDialogRef,
  MatDialogConfig,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import {
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { CalendarFormDialogComponent } from './calendar-form-dialog/calendar-form-dialog.component';
import { isSameDay, isSameMonth, subMonths, addMonths } from 'date-fns';
import { Subject } from 'rxjs';
import {
  CalendarDateFormatter,
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarModule,
  CalendarView,
} from 'angular-calendar';
import { MaterialModule } from 'src/app/material.module';
import {
  MatNativeDateModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RatingsService } from 'src/app/services/ratings.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { UsersService } from 'src/app/services/users.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompaniesService } from 'src/app/services/companies.service';
import { addWeeks, subWeeks } from 'date-fns';
import { AppKanbanDialogComponent } from '../kanban/kanban-dialog.component';

const colors: any = {
  red: {
    primary: '#fa896b',
    secondary: '#fdede8',
  },
  green: {
    primary: '#92b46c',
    secondary: '#92b46c',
  },
  yellow: {
    primary: '#ffae1f',
    secondary: '#fef5e5',
  },
  blue: {
    primary: '#5d87ff',
    secondary: '#ecf2ff',
  },
};

@Component({
  selector: 'app-calendar-dialog',
  templateUrl: './dialog.component.html',
  standalone: true,
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatNativeDateModule,
    MatDialogModule,
    MatDatepickerModule,
    TablerIconsModule,
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarDialogComponent implements OnInit {
  toDoForm: FormGroup = this.fb.group(
    {
      goal: ['', [Validators.required]],
      recommendations: [''],
      due_date: [null],
      priority: [null],
      recurrent: [false],
      is_numeric: [false],
      company_id: [null, [Validators.required]],
      employee_id: [null, [Validators.required]],
      updatedAt: [new Date(), []],
    },
    { validators: this.recurrentDueDateValidator }
  );

  priorities: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<CalendarDialogComponent>,
    public fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private ratingsService: RatingsService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.getPriorities();

    if (this.data.action === 'Edit' || this.data.action === 'Create') {
      this.patchFormData();
    }

    if (this.data.action !== 'Deleted') {
      this.toDoForm
        .get('recurrent')
        ?.valueChanges.subscribe((recurrent: boolean) => {
          const dueDateControl = this.toDoForm.get('due_date');
          if (recurrent) {
            dueDateControl?.setValue(null);
            dueDateControl?.disable();
          } else {
            dueDateControl?.enable();
          }
        });
    }
  }

  patchFormData() {
    const eventData = this.data.event.meta || this.data.event;
    const startDate = this.data.event.start || eventData.due_date;

    this.toDoForm.patchValue({
      id: this.data.event.id || null,
      goal: this.data.event.title || eventData.goal || '',
      recommendations: eventData.recommendations || '',
      due_date: startDate ? this.formatDateToInput(new Date(startDate)) : null,
      priority: eventData.priority || null,
      recurrent: eventData.recurrent || false,
      company_id: eventData.company_id || null,
      employee_id: eventData.employee_id || null,
    });
  }

  formatDateToInput(date: Date): string {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  getPriorities(): Promise<void> {
    return new Promise((resolve) => {
      this.ratingsService.getPriorities().subscribe((priorities: any[]) => {
        this.priorities = priorities;
        resolve();
      });
    });
  }

  recurrentDueDateValidator(group: FormGroup) {
    const recurrent = group.get('recurrent')?.value;
    const dueDate = group.get('due_date')?.value;
    return recurrent && dueDate ? { recurrentDueDateError: true } : null;
  }

  onSubmit() {
    if (
      (this.data.action === 'Create' || this.data.action === 'Edit') &&
      this.toDoForm.valid
    ) {
      const formData = this.toDoForm.value;
      const taskId = this.data.action === 'Edit' ? this.data.event.id : null;
      this.ratingsService.submit(formData, taskId).subscribe({
        next: (response: any) => {
          const event = {
            ...this.data.event,
            id: response.id,
            title: formData.goal,
            start: formData.due_date ? new Date(formData.due_date) : null,
            allDay: !formData.due_date,
            due_date: formData.due_date,
            recommendations: formData.recommendations,
            priority: formData.priority,
            recurrent: formData.recurrent,
            company_id: formData.company_id,
            employee_id: formData.employee_id,
          };
          this.dialogRef.close(event);
        },
        error: (error) => {
          console.error('Error submitting task:', error);
          this.dialogRef.close();
        },
      });
    } else if (this.data.action === 'Deleted') {
      this.ratingsService.delete(this.data.event.id).subscribe({
        next: () => this.dialogRef.close(),
        error: (error) => {
          console.error('Error deleting task:', error);
          this.dialogRef.close();
        },
      });
    }
  }
}

interface CustomCalendarEvent extends CalendarEvent {
  id?: string | number;
  priority?: number;
  employee_id?: number;
  company_id?: number;
  recommendations?: string;
  comments?: string;
  task_attachments?: any[];
  recurrent?: boolean;
}

@Component({
  selector: 'app-fullcalendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fullcalendar.component.html',
  standalone: true,
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    NgSwitch,
    CalendarModule,
    CommonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
  ],
  providers: [provideNativeDateAdapter(), CalendarDateFormatter],
})
export class AppFullcalendarComponent implements OnInit {
  @Input() priorities: any[] = [];
  @Output() calendarEventChange = new EventEmitter<void>();
  dialogRef = signal<MatDialogRef<CalendarDialogComponent> | any>(null);
  dialogRef2 = signal<MatDialogRef<CalendarFormDialogComponent> | any>(null);
  lastCloseResult = signal<string>('');
  actionsAlignment = signal<string>('');
  view = signal<any>('week');
  dayStartHour = 8;
  dayEndHour = 20;
  viewDate = signal<Date>(new Date());
  activeDayIsOpen = signal<boolean>(true);
  userRole: string | null = localStorage.getItem('role');
  teamMembers: any[] = [];
  teamMemberId: number | null = null;
  selectedPriority: number | null = null;
  companyId: number | null = null;
  companies: any[] = [];
  loggedInUser: any = null;
  events = signal<CustomCalendarEvent[]>([]);

  config: MatDialogConfig = {
    width: '',
    height: '',
    position: {
      top: '',
      bottom: '',
      left: '',
      right: '',
    },
    data: {
      action: '',
      event: [],
    },
  };
  numTemplateOpens = 0;

  refresh: Subject<any> = new Subject();

  constructor(
    public dialog: MatDialog,
    @Inject(DOCUMENT) doc: any,
    private ratingsService: RatingsService,
    private employeesService: EmployeesService,
    private userService: UsersService,
    public snackBar: MatSnackBar,
    private companiesService: CompaniesService
  ) {}

  ngOnInit(): void {
    const userRole = localStorage.getItem('role');
    this.getPriorities();
    this.getTeamMembers();
    this.getCompanies();
    this.getToDos();
  }

  getTeamMembers() {
    if (this.userRole === '1') {
      if (this.companyId) {
        this.companiesService.getEmployees(this.companyId).subscribe({
          next: (employees: any) => {
            this.teamMembers = employees.map((employee: any) => employee.user);
          },
        });
      } else {
        this.employeesService.get().subscribe((employees: any) => {
          this.teamMembers = employees.map((user: any) => user.user);
        });
      }
    } else if (this.userRole == '2') {
      // Get current employee
      this.userService
        .getUsers({ searchField: '', filter: { currentUser: true } })
        .subscribe({
          next: (res: any) => {
            const userId = res[0].id;
            this.teamMemberId = userId;
            this.companyId = res[0].employee.company_id;
            this.getToDos();
          },
          error: () => {
            this.openSnackBar('Error fetching user', 'Close');
          },
        });
    }
    if (this.userRole === '3') {
      // Get client company employees
      this.employeesService.get().subscribe({
        next: (employees: any) => {
          this.teamMembers = employees
            .filter((user: any) => user.user.active == 1 && user.user.role == 2)
            .map((user: any) => user.user);
          this.companiesService
            .getEmployer(employees[0].company_id)
            .subscribe((data) => {
              this.loggedInUser = {
                name: data.user?.name,
                last_name: data.user?.last_name,
                id: data?.user?.id,
                company_id: this.teamMembers[0]?.company_id,
              };
            });
          this.companyId = employees[0].company_id;
        },
      });
    }
  }

  getPriorities() {
    this.ratingsService.getPriorities().subscribe((priorities: any[]) => {
      this.priorities = priorities;
    });
  }

  getCompanies() {
    this.companiesService.getCompanies().subscribe({
      next: (companies: any) => {
        this.companies = companies;
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

  getToDos() {
    const filterTasks = (toDos: any[]) => {
      return toDos
        .filter((toDo: any) => toDo.due_date)
        .filter((toDo: any) =>
          this.selectedPriority ? toDo.priority === this.selectedPriority : true
        )
        .filter((toDo: any) =>
          this.companyId ? toDo.company_id === this.companyId : true
        )
        .filter((toDo: any) =>
          this.teamMemberId ? toDo.employee_id === this.teamMemberId : true
        )
        .map((toDo: any) => {
          const priority = toDo.priority;
          let color;
          switch (priority) {
            case 1:
              color = colors.red;
              break;
            case 2:
              color = colors.yellow;
              break;
            case 4:
              color = colors.green;
              break;
            default:
              color = colors.blue;
              break;
          }

          const dueDate = toDo.due_date ? new Date(toDo.due_date) : new Date();
          const isAllDay = toDo.due_date
            ? new Date(toDo.due_date).getHours() === 0 &&
              new Date(toDo.due_date).getMinutes() === 0
            : true;

          return {
            title: toDo.goal,
            color,
            start: dueDate,
            allDay: isAllDay,
            id: toDo.id,
            priority: toDo.priority,
            employee_id: toDo.employee_id,
            company_id: toDo.company_id,
            recommendations: toDo.recommendations,
            comments: toDo.comments,
            task_attachments: toDo.task_attachments,
            recurrent: toDo.recurrent,
          };
        });
    };

    this.ratingsService.get().subscribe({
      next: (toDos: any) => {
        this.events.set(filterTasks(toDos));
      },
    });
  }

  private formatEventFromDialogResult(result: any): CalendarEvent {
    let color;
    switch (result.priority) {
      case 1:
        color = colors.red;
        break;
      case 2:
        color = colors.yellow;
        break;
      case 4:
        color = colors.green;
        break;
      default:
        color = colors.blue;
        break;
    }

    const dueDate = result.due_date ? new Date(result.due_date) : new Date();
    const isAllDay = dueDate.getHours() === 0 && dueDate.getMinutes() === 0;

    return {
      id: result.id,
      title: result.goal || result.title,
      start: dueDate,
      allDay: isAllDay,
      color,
      meta: {
        due_date: dueDate,
        recurrent: result.recurrent,
        recommendations: result.recommendations,
        priority: result.priority,
        company_id: result.company_id,
        employee_id: result.employee_id,
        goal: result.goal,
      },
    };
  }

  dayClicked({ date, events }: { date: Date; events?: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate()) && events) {
      if (
        (isSameDay(this.viewDate(), date) && this.activeDayIsOpen() === true) ||
        events?.length === 0
      ) {
        this.activeDayIsOpen.set(false);
      } else {
        this.activeDayIsOpen.set(true);
        this.viewDate.set(date);
      }
    }
    this.handleTimeGridClick(date);
  }

  handleTimeGridClick(date: Date): void {
    if (!this.companyId) {
      this.openSnackBar('Please select a company to create a task', 'Close');
      return;
    }

    const dialogRef = this.dialog.open(AppKanbanDialogComponent, {
      width: '900px', 
      maxWidth: '90vw',
      data: {
        action: 'Add',
        type: 'task',
        due_date: date,
        company_id: this.companyId,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Add') {
        const taskData = {
          goal: result.data.goal,
          recommendations: result.data.recommendations,
          due_date: result.data.due_date,
          priority: result.data.priority,
          recurrent: result.data.recurrent,
          company_id: result.data.company_id,
          employee_id: result.data.employee_id,
          comments: result.data.comments,
          task_attachments: result.data.task_attachments,
        };

        this.ratingsService.submit(taskData).subscribe({
          next: (response: any) => {
            const newEvent: CustomCalendarEvent = {
              id: response.id,
              title: response.goal,
              start: new Date(response.due_date),
              allDay: false,
              color: this.getPriorityColor(response.priority),
              priority: response.priority,
              employee_id: response.employee_id,
              company_id: response.company_id,
              recommendations: response.recommendations,
              comments: response.comments,
              task_attachments: response.task_attachments,
              recurrent: response.recurrent,
            };

            this.events.set([...this.events(), newEvent]);
            this.refresh.next(newEvent);
            this.openSnackBar('Task created successfully!', 'Close');
          },
          error: (error) => {
            this.openSnackBar('Error creating task: ' + error.message, 'Close');
          },
        });
      }
    });
  }

  handleEvent(action: string, event: CustomCalendarEvent): void {
    const dialogRef = this.dialog.open(AppKanbanDialogComponent, {
      width: '900px', 
      maxWidth: '90vw',
      data: {
        action: 'Edit',
        type: 'task',
        id: event.id,
        goal: event.title,
        due_date: event.start,
        dueTime: this.formatTime(event.start),
        priority: event.priority,
        employee_id: event.employee_id,
        company_id: event.company_id,
        recommendations: event.recommendations,
        comments: event.comments,
        task_attachments: event.task_attachments,
        recurrent: event.recurrent,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Edit') {
        const taskData = {
          id: event.id,
          goal: result.data.goal,
          recommendations: result.data.recommendations,
          due_date: result.data.due_date,
          priority: result.data.priority,
          recurrent: result.data.recurrent,
          company_id: result.data.company_id,
          employee_id: result.data.employee_id,
          comments: result.data.comments,
          task_attachments: result.data.task_attachments,
        };

        this.ratingsService.submit(taskData, taskData.id).subscribe({
          next: (response: any) => {
            const updatedEvent: CustomCalendarEvent = {
              ...event,
              title: response.goal,
              start: new Date(response.due_date),
              color: this.getPriorityColor(response.priority),
              priority: response.priority,
              employee_id: response.employee_id,
              company_id: response.company_id,
              recommendations: response.recommendations,
              comments: response.comments,
              task_attachments: response.task_attachments,
              recurrent: response.recurrent,
            };

            this.events.set(
              this.events().map((iEvent: CustomCalendarEvent) =>
                iEvent.id === updatedEvent.id ? updatedEvent : iEvent
              )
            );
            this.refresh.next(updatedEvent);
            this.openSnackBar('Task updated successfully!', 'Close');
          },
          error: (error) => {
            this.openSnackBar('Error updating task: ' + error.message, 'Close');
          },
        });
      }
    });
  }

  setView(view: CalendarView | any): void {
    this.view.set(view);
  }

  goToPreviousMonth(): void {
    this.viewDate.set(subMonths(this.viewDate(), 1));
  }

  goToNextMonth(): void {
    this.viewDate.set(addMonths(this.viewDate(), 1));
  }

  goToToday() {
    this.viewDate.set(new Date());
  }

  goToNext(): void {
    if (this.view() === 'week') {
      this.viewDate.set(addWeeks(this.viewDate(), 1));
    } else {
      this.viewDate.set(addMonths(this.viewDate(), 1));
    }
  }

  goToPrevious(): void {
    if (this.view() === 'week') {
      this.viewDate.set(subWeeks(this.viewDate(), 1));
    } else {
      this.viewDate.set(subMonths(this.viewDate(), 1));
    }
  }

  private getPriorityColor(priority: number): any {
    switch (priority) {
      case 1:
        return colors.red;
      case 2:
        return colors.yellow;
      case 4:
        return colors.green;
      default:
        return colors.blue;
    }
  }
  private formatTime(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  }
}
