import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
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
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';
import { AppFullcalendarComponent } from '../fullcalendar/fullcalendar.component';
import { MatSelectModule } from '@angular/material/select';
import { RatingsService } from 'src/app/services/ratings.service';
import { RatingsEntriesService } from 'src/app/services/ratings_entries.service';
import { UsersService } from 'src/app/services/users.service';
import { SchedulesService } from 'src/app/services/schedules.service';
import { provideNativeDateAdapter } from '@angular/material/core';
import { EmployeesService } from 'src/app/services/employees.service';
import { BoardsService } from 'src/app/services/apps/kanban/boards.service';
import { CompaniesService } from 'src/app/services/companies.service';

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
    AppFullcalendarComponent,
  ],
  providers: [provideNativeDateAdapter()],
})
export class AppTodoComponent implements OnInit {
  @Output() toDoDataChange = new EventEmitter<any[]>();
  @Output() selectedDateChange = new EventEmitter<any>();
  @Input() selectedDateFromChart: any;
  sidePanelOpened = signal<boolean>(true);
  public showSidebar = signal<boolean>(false);
  public toDoArray: any = [];
  selectedCategory = signal<string>('all');
  totalTodos = signal<number>(0);
  totalCompleted = signal<number>(0);
  totalIncomplete = signal<number>(0);
  allCheckedFlag: boolean = false;
  selectedDate = new Date();
  selectedDateStr: any = this.formatDate(this.selectedDate);
  isDateFuture: boolean = false;
  toDoData: any = [];
  goalsStatus: boolean = false;
  userRole = localStorage.getItem('role');
  teamMemberId: number | null = null;
  companyId: number | null = null;
  toDoToEdit!: any;
  teamMembers: any[] = [];
  priorities: any[] = [];
  filteredArray: any[] = [];
  loggedInUser: any;
  dueTime: string = '';
  isLoading: boolean = true;
  @ViewChild(AppFullcalendarComponent) calendar!: AppFullcalendarComponent;
  boards: any[] = [];
  newTaskForm: FormGroup = this.fb.group(
    {
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
      board_id: [null],
      updatedAt: [new Date(), []],
    },
    { validators: this.recurrentDueDateValidator }
  );

  toDoForm: FormGroup = this.fb.group({
    toDo: this.fb.array([]),
  });

  constructor(
    public fb: UntypedFormBuilder,
    public snackBar: MatSnackBar,
    private dialog: MatDialog,
    public ratingsService: RatingsService,
    public ratingsEntriesService: RatingsEntriesService,
    public schedulesService: SchedulesService,
    private userService: UsersService,
    public employeesService: EmployeesService,
    public companiesService: CompaniesService,
    public kanbanService: BoardsService
  ) {}

  isOver(): boolean {
    return window.matchMedia(`(max-width: 960px)`).matches;
  }

  mobileSidebar(): void {
    this.showSidebar.set(!this.showSidebar);
  }

  ngOnInit(): void {
    this.initilizeTaskForm();
    this.loadBoards();
  }

  ngOnChanges(changes: any) {
    if (
      changes['selectedDateFromChart'] &&
      changes['selectedDateFromChart'].currentValue
    ) {
      this.selectedDate = new Date(
        changes['selectedDateFromChart'].currentValue
      );
      this.selectedDateStr = this.formatDate(this.selectedDate);
      this.toDoFormArray.clear();
      this.buildToDoForm();
    }
    this.selectedDateChange.emit(this.selectedDate);
  }

  initilizeTaskForm() {
    this.getTeamMembers();
    this.getPriorities();

    this.newTaskForm
      .get('recurrent')
      ?.valueChanges.subscribe((recurrent: boolean) => {
        const dueDateControl = this.newTaskForm.get('due_date');
        if (recurrent) {
          dueDateControl?.setValue(null);
          dueDateControl?.disable();
        } else {
          dueDateControl?.enable();
        }
      });
  }

  loadBoards(): void {
    this.kanbanService.getBoards().subscribe((boards) => {
      this.boards = boards;
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
    if (this.userRole === '1') {
      // Get all employees
      this.employeesService.get().subscribe((employees: any) => {
        this.teamMembers = employees;
        if (this.teamMemberId === null) {
          this.buildToDoForm();
        }
      });
    } else if (this.userRole == '2') {
      // Get current employee
      this.userService
        .getUsers({ searchField: '', filter: { currentUser: true } })
        .subscribe({
          next: (res: any) => {
            const userId = res[0].id;
            this.employeesService.getById(userId).subscribe((employee: any) => {
              if (employee?.length > 0) {
                this.companyId = employee[0].company_id;
                this.newTaskForm.patchValue({
                  company_id: this.companyId,
                  employee_id: userId,
                });
              }
            });
            this.teamMemberId = userId;
            this.buildToDoForm();
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
          this.teamMembers = employees.filter(
            (user: any) => user.user.active == 1 && user.user.role == 2
          );
          this.companiesService
            .getEmployer(this.teamMembers[0].company_id)
            .subscribe((data) => {
              this.loggedInUser = {
                name: data.user?.name,
                last_name: data.user?.last_name,
                id: data?.user?.id,
                company_id: this.teamMembers[0]?.company_id,
              };
              this.companyId = this.teamMembers[0]?.company_id;
              if (this.teamMemberId === null) {
                this.buildToDoForm();
              }
            });
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
    if (event.value === null) {
      this.teamMemberId = null;
      if (!this.companyId && this.teamMembers.length > 0) {
        this.companyId = this.teamMembers[0].company_id;
      }
      this.buildToDoForm();
      return;
    }
    if (event.value === this.loggedInUser?.id) {
      this.teamMemberId = this.loggedInUser.id;
      this.newTaskForm.patchValue({
        company_id: this.loggedInUser.company_id,
        employee_id: this.loggedInUser.id,
      });
    } else {
      const selectedTeamMember = this.teamMembers.find(
        (tm) => tm.user.id === event.value
      );
      if (selectedTeamMember) {
        this.teamMemberId = selectedTeamMember.user.id;
        this.newTaskForm.patchValue({
          company_id: selectedTeamMember.company_id,
          employee_id: selectedTeamMember.id,
        });
      }
    }
    this.buildToDoForm();
  }

  public onDateChange(event: MatDatepickerInputEvent<Date>) {
    const today = new Date();
    this.selectedDate = event.value ? new Date(event.value) : new Date();
    this.selectedDateStr = this.formatDate(this.selectedDate);
    this.isDateFuture = this.selectedDate.getTime() > today.getTime();
    this.buildToDoForm();
  }

  private formatDate(date: Date): string {
    if (!date || isNaN(date.getTime())) return '';
    
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  formatDateForComparison = (dateString: string | Date | null) => {
    if (!dateString) return null;
    
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return null;
    }
    
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  async buildToDoForm() {
    this.isLoading = true;
    this.toDoFormArray.clear();

    if (
      (this.userRole === '1' && this.teamMemberId === null) ||
      this.userRole === '2' ||
      (this.userRole === '3' && this.teamMemberId === null && this.companyId)
    ) {
      this.ratingsService.get().subscribe({
        next: (array: any) => {
          const activeArray = (array || []).filter((task: any) => {
            if (!task.active) return false;
            
            if (!task.due_date) return true;
            
            const taskDueDate = this.formatDateForComparison(task.due_date);
            if (!taskDueDate) return false;
            
            return taskDueDate === this.selectedDateStr;
          });

          this.toDoArray = activeArray;
          this.filteredArray = activeArray.filter((todo: any) => {
            if (this.selectedCategory() === 'all') return true;
            if (this.selectedCategory() === 'complete') return !todo.active;
            if (this.selectedCategory() === 'uncomplete') return todo.active;
            return true;
          });

          for (let toDo of this.filteredArray) {
            let toDoField = this.fb.group({
              rating_id: [toDo.id],
              goal: [toDo.goal],
              date: [this.selectedDateStr],
              achieved: [false, Validators.required],
              wasAchieved: [toDo.achieved],
              is_numeric: [false],
              due_date: [toDo.due_date || null],
              priority: [toDo.priority || 3],
              details: [null, this.detailsRequiredValidator()],
            });
            this.toDoFormArray.push(toDoField);
          }

          this.updateCounts();
          this.isLoading = false;
        },
        error: () => {
          this.openSnackBar('Error loading To Do', 'Close');
          this.isLoading = false;
        },
      });
      return;
    }

    this.ratingsService.getByUser(this.teamMemberId).subscribe({
      next: (array: any) => {
        const activeArray = (array || []).filter((task: any) => 
          task.active && 
          (!task.due_date || this.formatDateForComparison(task.due_date) === this.selectedDateStr)
        );
      
        this.ratingsEntriesService
          .getByUser(this.teamMemberId as number)
          .subscribe({
            next: (ratingsEntries: any[]) => {
              if (!activeArray || !Array.isArray(activeArray)) {
                this.openSnackBar(
                  'No To Do data found or data is not an array.',
                  'Close'
                );
                return;
              }
              this.toDoArray = array;

              this.toDoArray.forEach((todo: any) => {
                const entry = ratingsEntries.find(
                  (re: any) =>
                    re.rating_id === todo.id && re.date == this.selectedDateStr
                );
                if (entry) {
                  todo.achieved = entry.achieved;
                  todo.justification = entry.justification;
                  todo.details = entry.justification;
                } else {
                  todo.achieved = false;
                  todo.justification = null;
                  todo.details = null;
                }
              });

              this.filteredArray = this.toDoArray.filter((todo: any) => {
                if (this.selectedCategory() === 'all') return true;
                if (this.selectedCategory() === 'complete') return !todo.active;
                if (this.selectedCategory() === 'uncomplete')
                  return todo.active;
                return true;
              });

              for (let toDo of this.filteredArray) {
                let toDoField = this.fb.group({
                  rating_id: [toDo.id],
                  goal: [toDo.goal],
                  date: [this.selectedDateStr],
                  achieved: [toDo.achieved, Validators.required],
                  wasAchieved: [toDo.achieved],
                  is_numeric: [false],
                  due_date: [toDo.due_date || null],
                  priority: [toDo.priority || 3], // 3 = Normal
                  details: [toDo.details || null], // remove validator so it's not required for already completed
                  justification: [toDo.justification || null],
                  recommendations: [toDo.recommendations || null],
                });
                this.toDoFormArray.push(toDoField);
              }
              this.updateCounts();
              this.isLoading = false;
            },
          });
      },
      error: () => {
        this.openSnackBar('Error loading To Do', 'Close');
        this.isLoading = false;
      },
    });
  }

  onRecommendationsChange(event: any) {
    const rawValue = event.target.value;
    this.newTaskForm.get('recommendations')?.setValue(rawValue);
  }

  detailsRequiredValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const parent = control.parent;
      if (parent) {
        const achieved = parent.get('achieved')?.value;
        const wasAchieved = parent.get('wasAchieved')?.value;
        const details = control.value;
        if (achieved && !wasAchieved && (!details || details.trim() === '')) {
          return { detailsRequired: true };
        }
      }
      return null;
    };
  }

  updateCounts() {
    this.totalTodos.set(this.toDoArray.length);
    this.totalCompleted.set(
      this.toDoArray.filter((todo: any) => !todo.active).length
    );
    this.totalIncomplete.set(
      this.toDoArray.filter((todo: any) => todo.active).length
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

    const userId = this.teamMemberId;
    // Only submit tasks that are marked achieved and were not already achieved (i.e., just completed now)
    const updatedToDoFormArray = this.toDoFormArray.value
      .filter(
        (todo: any, idx: number) =>
          todo.achieved && !this.toDoFormArray.at(idx).get('wasAchieved')?.value
      )
      .map((toDo: any) => ({
        rating_id: Number(toDo.rating_id),
        date: String(toDo.date),
        achieved: toDo.achieved === true || toDo.achieved === 1,
        user_id: Number(userId),
        justification: toDo.details ? String(toDo.details) : null,
      }));

    if (!this.toDoToEdit) {
      this.ratingsEntriesService.submit(updatedToDoFormArray).subscribe({
        next: () => {
          this.selectedCategory.set('uncomplete');
          this.buildToDoForm();
          this.calendar?.getToDos();
        },
        error: (res: any) => {
          this.openSnackBar('There was an error submitting the goal', 'Close');
        },
      });
    }
  }

  onAchievedChange(index: number) {
    const goal = this.toDoFormArray.at(index);
    if (!goal.get('achieved')?.value) {
      goal.get('details')?.reset();
    }
    this.allCheckedFlag = this.toDoFormArray.controls.every(
      (todo: any) => todo.get('achieved')?.value === true
    );
    this.updateCounts();
  }

  todayStr(): Date {
    const today = new Date();
    return today;
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

    if (!this.newTaskForm.get('recurrent')?.value) {
      const dueDateControl = this.newTaskForm.get('due_date');
      const dueTime = this.dueTime;

      if (!dueDateControl?.value && !dueTime) {
        const now = new Date();
        const dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        dueDateControl?.setValue(dueDate);
        this.dueTime = `${dueDate
          .getHours()
          .toString()
          .padStart(2, '0')}:${dueDate
          .getMinutes()
          .toString()
          .padStart(2, '0')}`;
      }
    }

    const taskData = {
      ...this.newTaskForm.value,
      board_id: this.newTaskForm.value.board_id || null, // Send null if no board is selected
    };

    this.ratingsService
      .submit(taskData, this.toDoToEdit?.id || null)
      .subscribe({
        next: (response: any) => {
          if (!this.toDoToEdit) {
            // Create a new element
            this.toDoArray.push(response);
          } else {
            // Update an existing element
            const taskIndex = this.toDoArray.findIndex(
              (task: any) => task.id == this.toDoToEdit.id
            );
            this.toDoArray[taskIndex] = response;
          }
          this.buildToDoForm();
          this.calendar?.getToDos();
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
      recurrent: false,
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

    const dueDate = this.toDoToEdit?.due_date
      ? new Date(this.toDoToEdit.due_date)
      : null;
    if (dueDate && !isNaN(dueDate.getTime())) {
      const hours = dueDate.getHours().toString().padStart(2, '0');
      const minutes = dueDate.getMinutes().toString().padStart(2, '0');
      this.dueTime = `${hours}:${minutes}`;
    } else {
      this.dueTime = '';
    }
  }

  deleteTodo(id: number): void {
    const dialogRef = this.dialog.open(ModalComponent, {
      data: {
        action: 'delete',
        subject: 'task',
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result === true) {
        // Only delete if user confirmed
        this.ratingsService.delete(id).subscribe({
          next: () => {
            this.toDoArray = this.toDoArray.filter(
              (task: any) => task.id != id
            );
            this.buildToDoForm();
            this.calendar?.getToDos();
            this.openSnackBar('Todo successfully deleted!', 'Close');
          },
          error: (error: ErrorEvent) => {
            this.openSnackBar('Error deleting task', 'Close');
          },
        });
      }
    });
  }

  hasAnyAchieved(): boolean {
    return this.toDoFormArray.controls.some(
      (ctrl) => ctrl.get('achieved')?.value
    );
  }

  onDueDateChange(event: any) {
    const date = event.value;
    let time = this.dueTime || '00:00';
    this.setDueDateTime(date, time);
  }

  onDueTimeChange(event: any) {
    this.dueTime = event.target.value;
    const date = this.newTaskForm.value.due_date;
    this.setDueDateTime(date, this.dueTime);
  }

  setDueDateTime(date: Date | string, time: string) {
    if (!date || !time) return;
    // Si date es string, conviértelo a Date correctamente
    let localDate = typeof date === 'string' ? new Date(date) : new Date(date);
    const [hours, minutes] = time.split(':').map(Number);

    // Ajusta la hora localmente
    localDate.setHours(hours, minutes, 0, 0);

    // Actualiza el formControl con el nuevo Date (con hora local)
    this.newTaskForm.patchValue({ due_date: localDate });
  }

  stripHtml(html: string): string {
    if (!html) return '';
    const imgMatch = html.match(/<img[^>]+src="([^">]+)"/);
    let imgUrl = '';
    if (imgMatch && imgMatch[1]) {
      imgUrl = imgMatch[1];
    }
    let text = html
      .replace(/<\/?(div|p|br|li|ul|ol)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{2,}/g, '\n')
      .trim();
    if (imgUrl) {
      text = text ? `${text} ${imgUrl}` : imgUrl;
    }
    return text;
  }
}
