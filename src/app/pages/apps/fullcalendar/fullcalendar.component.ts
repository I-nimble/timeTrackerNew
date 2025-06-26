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
  options!: UntypedFormGroup;
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
  priorities: any[];

  constructor(
    public dialogRef: MatDialogRef<CalendarDialogComponent>,
    public fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private ratingsService: RatingsService
  ) {}

  ngOnInit(): void {
    this.getPriorities();

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
    if (this.data.action === 'Edit') {
      this.toDoForm.patchValue({
        id: this.data.event.id,
        goal: this.data.event.title,
        recommendations: this.data.event.recommendations,
        due_date: this.data.event.start,
        priority: this.data.event.priority,
        recurrent: this.data.event.recurrent,
        company_id: this.data.event.company_id,
        employee_id: this.data.event.employee_id,
      });
    } else if (this.data.action === 'Create') {
      this.toDoForm.patchValue({
        goal: null,
        recommendations: null,
        due_date: this.data.event.start,
        priority: null,
        recurrent: false,
        company_id: this.data.event.company_id,
        employee_id: this.data.event.employee_id,
      });
    }
  }

  getPriorities() {
    this.ratingsService.getPriorities().subscribe((priorities: any[]) => {
      this.priorities = priorities;
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
            title: formData.goal,
            start: formData.due_date,
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
        next: (response: any) => {
          this.dialogRef.close();
        },
        error: (error) => {
          console.error('Error deleting task:', error);
          this.dialogRef.close();
        },
      });
    }
  }
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
  viewDate = signal<Date>(new Date());
  activeDayIsOpen = signal<boolean>(true);
  userRole: string | null = localStorage.getItem('role');
  teamMembers: any[] = [];
  teamMemberId: number | null = null;
  selectedPriority: number | null = null;
  companyId: number | null = null;
  companies: any[] = [];
  loggedInUser: any = null;

  config: MatDialogConfig = {
    disableClose: false,
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

  events = signal<CalendarEvent[] | any>([]);

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

  handleCompanySelection(event: any) {
    this.companyId = event.value;
    this.getTeamMembers();
  }

  handleTeamMemberSelection(event: any) {
    if (!this.companyId) {
      this.openSnackBar('Please select a company first', 'Close');
      return;
    }
    this.getToDos();
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  getToDos() {
    const filterByPriority = (toDos: any[]) => {
      return toDos
        .filter((toDo: any) => toDo.due_date)
        .filter((toDo: any) =>
          this.selectedPriority ? toDo.priority === this.selectedPriority : true
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
          return {
            title: toDo.goal,
            color,
            start: new Date(toDo.due_date),
            allDay: true,
            recurrent: toDo.recurrent,
            recommendations: toDo.recommendations,
            priority: toDo.priority,
            company_id: toDo.company_id,
            employee_id: toDo.employee_id,
            id: toDo.id,
          };
        });
    };

    if (this.teamMemberId === null) {
      this.ratingsService.get().subscribe({
        next: (toDos: any) => {
          this.events.set(filterByPriority(toDos));
        },
      });
    } else {
      this.ratingsService.getByUser(this.teamMemberId).subscribe({
        next: (toDos: any) => {
          this.events.set(filterByPriority(toDos));
        },
      });
    }
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

    if (!this.teamMemberId || !this.companyId) {
      this.openSnackBar('Select a team member to create a task', 'Close');
      return;
    }

    this.config.data = {
      event: {
        start: date,
        company_id: this.companyId,
        employee_id: this.teamMemberId,
      },
      action: 'Create',
    };
    this.dialogRef.set(this.dialog.open(CalendarDialogComponent, this.config));

    this.dialogRef()
      .afterClosed()
      .subscribe((result: any) => {
        if (!result) {
          return;
        }
        // Add the new event to the events array
        const priority = result.priority;
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
        const newEvent = {
          title: result.title,
          color,
          start: new Date(result.start),
          allDay: true,
          recurrent: result.recurrent,
          recommendations: result.recommendations,
          priority: result.priority,
          company_id: result.company_id,
          employee_id: result.employee_id,
          id: result.id,
        };
        this.events.set(this.events().concat(newEvent));
        this.lastCloseResult.set('Task created successfully');
        this.calendarEventChange.emit();
        this.dialogRef.set(null);
        this.refresh.next(result);
      });
  }

  handleEvent(action: string, event: CalendarEvent): void {
    this.config.data = { event, action };
    this.dialogRef.set(this.dialog.open(CalendarDialogComponent, this.config));

    this.dialogRef()
      .afterClosed()
      .subscribe((result: any) => {
        if (result && action === 'Edit') {
          // Update the event in the events array
          const priority = result.priority;
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
          const newEvent = {
            title: result.title,
            color,
            start: new Date(result.start),
            allDay: true,
            recurrent: result.recurrent,
            recommendations: result.recommendations,
            priority: result.priority,
            company_id: result.company_id,
            employee_id: result.employee_id,
            id: result.id,
          };
          this.events.set(
            this.events().map((iEvent: CalendarEvent<any>) => {
              if (iEvent === event) {
                return newEvent;
              }
              return iEvent;
            })
          );
          this.lastCloseResult.set('Task updated');
        } else {
          this.lastCloseResult.set('Dialog closed');
        }
        this.calendarEventChange.emit();
        this.dialogRef.set(null);
        this.refresh.next(result);
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
}
