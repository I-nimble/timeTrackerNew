import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import {
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormArray,
  AbstractControl,
  ValidatorFn,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AppDeleteDialogComponent } from '../kanban/delete-dialog/delete-dialog.component';
import { AppFullcalendarComponent } from '../fullcalendar/fullcalendar.component';
import { MatSelectModule } from '@angular/material/select';
import { RatingsService } from 'src/app/services/ratings.service';
import { RatingsEntriesService } from 'src/app/services/ratings_entries.service';
import { UsersService } from 'src/app/services/users.service';
import { SchedulesService } from 'src/app/services/schedules.service';
import { provideNativeDateAdapter } from '@angular/material/core';
import { EmployeesService } from 'src/app/services/employees.service';

@Component({
  selector: 'app-todo',
  standalone: true,
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.scss'],
  imports: [
    MaterialModule,
    CommonModule,
    TablerIconsModule,
    FormsModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    AppFullcalendarComponent
  ],
  providers: [
    provideNativeDateAdapter()
  ]
})

export class AppTodoComponent implements OnInit {
  @Output() toDoDataChange = new EventEmitter<any[]>();
  @Output() selectedDateChange = new EventEmitter<any>();
  @Input() selectedDateFromChart: any;
  sidePanelOpened = signal<boolean>(true);
  public showSidebar = signal<boolean>(false);
  public toDoArray: any = []
  selectedCategory = signal<string>('all');
  totalTodos = signal<number>(0);
  totalCompleted = signal<number>(0);
  totalIncomplete = signal<number>(0);
  allCheckedFlag: boolean = false;
  selectedDate = new Date()
  selectedDateStr: any = this.formatDate(this.selectedDate)
  isDateFuture: boolean = false
  toDoData: any = [];
  goalsStatus: boolean = false;
  userRole = localStorage.getItem('role');
  teamMemberId: number | null = null;
  companyId: number | null = null;
  toDoToEdit!: any;
  teamMembers: any[] = [];
  priorities: any[] = [];

  newTaskForm: FormGroup = this.fb.group({
    goal: ['', [Validators.required]],
    frequency_id: [null],
    recommendations: [''],
    due_date: [null],
    priority: [3], // 3 = Normal
    recurrent: [false],
    is_numeric: [false],
    numeric_goal: [null],
    company_id: [null, [Validators.required]],
    employee_id: [null, [Validators.required]],
    updatedAt: [new Date(), []],
  }, { validators: this.recurrentDueDateValidator });

  toDoForm: FormGroup = this.fb.group({
    toDo: this.fb.array([])
  });

  constructor(
    public fb: UntypedFormBuilder,
    public snackBar: MatSnackBar,
    private dialog: MatDialog,
    public ratingsService: RatingsService,
    public ratingsEntriesService: RatingsEntriesService,
    public schedulesService: SchedulesService,
    private userService: UsersService,
    private employeesService: EmployeesService,
  ) { }

  isOver(): boolean {
    return window.matchMedia(`(max-width: 960px)`).matches;
  }

  mobileSidebar(): void {
    this.showSidebar.set(!this.showSidebar);
  }

  ngOnInit(): void {
    this.initilizeTaskForm();
  }

  ngOnChanges(changes: any) {
    if (changes['selectedDateFromChart'] && changes['selectedDateFromChart'].currentValue) {
      this.selectedDate = new Date(changes['selectedDateFromChart'].currentValue);
      this.selectedDateStr = this.formatDate(this.selectedDate);
      this.toDoFormArray.clear();
      this.buildToDoForm();
    }
    this.selectedDateChange.emit(this.selectedDate);
  }

  initilizeTaskForm() {
    this.getTeamMembers();
    this.getPriorities();

    this.newTaskForm.get('recurrent')?.valueChanges.subscribe((recurrent: boolean) => {
      const dueDateControl = this.newTaskForm.get('due_date');
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

  getTeamMembers() {
    if (this.userRole === '1') { // Get all employees
      this.employeesService.get().subscribe((employees: any) => {
        this.teamMembers = employees;
      });
    }
    else if (this.userRole == '2') { // Get current employee
      this.userService.getUsers({ searchField: "", filter: { currentUser: true } }).subscribe({
        next: (res: any) => {
          const userId = res[0].id;
          this.employeesService.getById(userId).subscribe((employee: any) => {
            if (employee?.length > 0) {
              this.companyId = employee[0].company_id
              this.newTaskForm.patchValue({
                company_id: this.companyId,
                employee_id: userId
              });
            }
          });
          this.teamMemberId = userId;
          this.buildToDoForm();
        },
        error: () => {
          this.openSnackBar('Error fetching user', 'Close');
        }
      });
    }
    if (this.userRole === '3') { // Get client company employees
      this.userService.getEmployees().subscribe({
        next: (employees: any) => {
          this.teamMembers = employees.filter((user: any) => user.user.active == 1 && user.user.role == 2);
        },
      });
    }
  }

  getPriorities() {
    this.ratingsService.getPriorities().subscribe((priorities: any[]) => {
      this.priorities = priorities;
    });
  }

  handleTMSelection(event: any) {
    const selectedTeamMember = this.teamMembers.find(tm => tm.id === event.value);
    this.teamMemberId = selectedTeamMember.user.id;
    this.newTaskForm.patchValue({
      company_id: selectedTeamMember.company_id,
      employee_id: selectedTeamMember.user.id
    });
    this.buildToDoForm();
  }

  public onDateChange(event: any) {
    const today = new Date()
    this.selectedDate = new Date(`${event.target.value}T00:00:00`);
    this.selectedDateStr = this.formatDate(this.selectedDate);
    (this.selectedDate.getTime() > today.getTime()) ? this.isDateFuture = true : this.isDateFuture = false
    this.toDoFormArray.clear();
    this.buildToDoForm();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async buildToDoForm() {
    this.toDoFormArray.clear();

    this.ratingsService.getToDo(this.selectedDate, this.teamMemberId).subscribe({
      next: (array: any) => {
        if (!array || !Array.isArray(array)) {
          this.openSnackBar('No To Do data found or data is not an array.', 'Close');
          return;
        }
        this.toDoArray = array;
        const filteredArray = this.toDoArray.filter((todo: any) => {
          if (this.selectedCategory() === 'all') return true;
          if (this.selectedCategory() === 'complete') return todo.achieved;
          if (this.selectedCategory() === 'uncomplete') return !todo.achieved;
          return true;
        });
        for (let toDo of filteredArray) {
          let toDoField = this.fb.group({
            rating_id: [toDo.id],
            goal: [toDo.goal],
            date: [this.selectedDateStr],
            achieved: [false, Validators.required],
            is_numeric: [false],
            due_date: [toDo.due_date || null],
            priority: [toDo.priority || 3], // 3 = Normal
            details: [null, this.detailsRequiredValidator()]
          });
          this.toDoFormArray.push(toDoField);
        }
        this.updateCounts();
      },
      error: () => {
        this.openSnackBar('Error loading To Do', 'Close');
      }
    });
  }

  detailsRequiredValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const parent = control.parent;
      if (parent) {
        const achieved = parent.get('achieved')?.value;
        const details = control.value;
        if (achieved && (!details || details.trim() === '')) {
          return { detailsRequired: true };
        }
      }
      return null;
    };
  }

  updateCounts() {
    this.totalTodos.set(this.toDoArray.length);
    this.totalCompleted.set(
      this.toDoArray.filter((todo: any) => todo.achieved).length
    );
    this.totalIncomplete.set(
      this.toDoArray.filter((todo: any) => !todo.achieved).length
    );
  }

  get toDoFormArray() {
    return this.toDoForm?.get('toDo') as FormArray;
  }

  handleSubmit() {
    if (!this.toDoForm.valid) {
      this.openSnackBar('Form is not valid', 'Close');
      return;
    }

    const updatedToDoFormArray = this.toDoFormArray.value.map((toDo: any) => ({
      ...toDo,
      user_id: this.toDoArray[0].employee_id,
    })).filter((todo: any) => todo.achieved);

    this.ratingsEntriesService.submit(updatedToDoFormArray).subscribe({
      next: () => {
        this.selectedCategory.set('uncomplete');
        this.buildToDoForm();
      },
      error: (res: any) => {
        this.openSnackBar('There was an error submitting the goal', 'Close');
      }
    });
  }

  onAchievedChange(index: number) {
    const goal = this.toDoFormArray.at(index);
    if (!goal.get('achieved')?.value) {
      goal.get('details')?.reset();
    }
    this.allCheckedFlag = this.toDoFormArray.controls.every((todo: any) => todo.get('achieved')?.value === true);
    this.updateCounts();
  }

  todayStr() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  selectionlblClick(category: string): void {
    this.selectedCategory.set(category);
    this.buildToDoForm();
  }

  addTodo(): void {
    if (!this.newTaskForm.valid) {
      this.openSnackBar('Form is not valid', 'Close');
      return;
    }

    this.ratingsService
      .submit(
        this.newTaskForm.value,
        this.toDoToEdit.id || null
      )
      .subscribe({
        next: (response: any) => {
          if (!this.toDoToEdit) { // Create a new element
            this.toDoArray.push(response);
          }
          else { // Update an existing element
            const taskIndex = this.toDoArray.findIndex(
              (task: any) => task.id == this.toDoToEdit.id
            );
            this.toDoArray[taskIndex] = response;
            this.buildToDoForm();
          }
        },
        error: () => {
          this.openSnackBar('Error submitting form', 'Close');
        },
      });
  }

  resetForm(): void {
    this.newTaskForm.reset();
    this.newTaskForm.get('recurrent')?.setValue(false);
    const ratingData = {
      company_id: this.companyId,
      employee_id: this.teamMemberId,
      recurrent: false
    };
    this.newTaskForm.patchValue(ratingData);
    this.newTaskForm.get('is_numeric')?.setValue(false);
    this.toDoToEdit = null;
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  allTodos(): void {
    this.allCheckedFlag = !this.allCheckedFlag;
    this.toDoFormArray.controls.forEach((todo: any) => {
      todo.get('achieved')?.setValue(this.allCheckedFlag);
    });
    this.updateCounts();
  }

  editTodo(todoId: number): void {
    this.toDoToEdit = this.toDoArray.find((todo: any) => todo.id === todoId);
    this.newTaskForm.patchValue(this.toDoToEdit);
  }

  deleteTodo(id: number): void {
    const dialogRef = this.dialog.open(AppDeleteDialogComponent);

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.ratingsService.delete(id).subscribe({
          next: () => {
            this.toDoArray = this.toDoArray.filter(
              (task: any) => task.id != id
            );
            this.buildToDoForm();
            this.openSnackBar('Todo successfully deleted!', 'Close');
          },
          error: (error: ErrorEvent) => {
            this.openSnackBar('Error deleting task', 'Close');
          },
        });
      }
    });
  }
}
