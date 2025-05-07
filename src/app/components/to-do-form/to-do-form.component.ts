import { Component, EventEmitter, OnInit, Output, Input, inject, OnChanges } from '@angular/core';
import { RatingsService } from 'src/app/services/ratings.service';
import { RatingsEntriesService } from 'src/app/services/ratings_entries.service';
import { SchedulesService } from 'src/app/services/schedules.service';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { NotificationStore } from 'src/app/stores/notification.store';
import { ReactiveFormsModule , FormArray, FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-to-do-form',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf, ReactiveFormsModule, RouterLink],
  templateUrl: './to-do-form.component.html',
  styleUrl: './to-do-form.component.scss'
})
export class ToDoFormComponent implements OnInit, OnChanges {
  @Output() toDoDataChange = new EventEmitter<any[]>(); 
  @Output() selectedDateChange = new EventEmitter<any>(); 
  @Input() selectedDateFromChart: any; 
  store = inject(NotificationStore);
  public toDoArray:any = []
  toDoForm!: FormGroup
  validForm:boolean = false
  selectedDate = new Date()
  selectedDateStr: any = this.formatDate(this.selectedDate)
  showForm: boolean = true
  emptyToDo: boolean = false
  isDateFuture: boolean = false
  toDoData: any = [];
  goalsStatus: boolean  = false;
  userRole = localStorage.getItem('role');
  teamMemberId: number | null = null;


  constructor (
    private fb: FormBuilder,
    public ratingsService: RatingsService,
    public ratingsEntriesService: RatingsEntriesService,
    public schedulesService: SchedulesService,
    private userService: UsersService,
  ) {}

  ngOnInit(): void {
    this.toDoForm = this.fb.group({
      toDo: this.fb.array([])
    });

    this.checkToDoLogged();
    if (this.userRole === '2') {
      this.buildToDoForm();
    }

    this.toDoForm.valueChanges.subscribe({
      next: (form: any) => {
        this.validForm = this.toDoForm.valid;
      }
    });

    this.userService.teamMember$.subscribe(id => {
      this.teamMemberId = id;
      this.filterToDo();
    });
  }

  ngOnChanges(changes: any) {
    if (changes['selectedDateFromChart'] && changes['selectedDateFromChart'].currentValue) {
      this.selectedDate = new Date(changes['selectedDateFromChart'].currentValue);
      this.selectedDateStr = this.formatDate(this.selectedDate);
      this.toDoFormArray.clear();
      this.checkToDoLogged();
      this.filterToDo();
    }
    this.selectedDateChange.emit(this.selectedDate); 
  }

  public onDateChange(event:any) {
    const today = new Date()
    this.selectedDate = new Date(`${event.target.value}T00:00:00`);
    this.selectedDateStr = this.formatDate(this.selectedDate);
    (this.selectedDate.getTime() > today.getTime()) ? this.isDateFuture = true : this.isDateFuture = false
    this.toDoFormArray.clear();
    this.checkToDoLogged();
    if (this.userRole === '2') {
      this.buildToDoForm();
    }
    this.selectedDateChange.emit(this.selectedDate); 
    this.filterToDo();
  }

  public filterToDo() {
    if (this.userRole === '3') {
      this.checkUserToDo();
      this.ratingsService.getByUser(this.teamMemberId!).subscribe(toDoData => {  
        this.ratingsService.getToDo(this.selectedDate).subscribe({
          next: (toDo) => {
            if (!toDo || !Array.isArray(toDo)) {
              this.store.addNotifications('No to do data found or data is not an array.', 'error');
              return;
            }
            this.emptyToDo = toDo.length === 0;
            this.toDoFormArray.clear(); 
  
            toDo.forEach(todoItem => { 
              let matchingItem = toDoData.find(item => item.id === todoItem.id);
  
              if (matchingItem) { 
                let toDoField = this.fb.group({
                  rating_id: [todoItem.id],
                  date: [this.selectedDateStr],
                  achieved: [false, Validators.required],
                  amount_achieved: [null],
                  justification: [null],
                  goal: [matchingItem.goal] 
                }, 
                // { validators: this.justificationRequiredValidator() }
                );
  
                this.toDoFormArray.push(toDoField);
              }
            });
          },
          error: () => {
            this.store.addNotifications('Error loading To Do', 'error');
          }
        });
      });
    }
  }  

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async buildToDoForm() {
    this.toDoFormArray.clear();
    this.ratingsService.getToDo(this.selectedDate).subscribe({
      next: (array) => {
        if (!array || !Array.isArray(array)) {
          this.store.addNotifications('No To Do data found or data is not an array.', 'error');
          return;
        }
        this.emptyToDo = array.length === 0;
        this.toDoArray = array;
  
        for (let toDo of array) {
            let toDoField = this.fb.group({
            rating_id: [toDo.id],
            date: [this.selectedDateStr],
            achieved: [false, Validators.required],
            is_numeric: [false],
            justification: [null],
            due_date: [toDo.due_date || null],
            priority: [toDo.priorityAssociation?.name || 'Normal'],
            details: [null, this.detailsRequiredValidator()]
            }, 
          // { validators: this.justificationRequiredValidator() }
          );
  
          this.toDoFormArray.push(toDoField);
        }
      },
      error: () => {
        this.store.addNotifications('Error loading To Do', 'error');
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

  public checkToDoLogged() {
    if (this.userRole !== '3') {
      this.ratingsService.checkToDoLogged(this.selectedDate).subscribe({
        next: (res) => {
          if(res.result == 'done') {
            this.showForm = false
          }
          else if (res.result == 'pending') {
            this.showForm = true
          }
        },
        error: (err) => {
          this.store.addNotifications('Error checking today goals', 'error');
        }
      })
    }
  }

  checkUserToDo(): void {
    if (this.teamMemberId && this.selectedDate) {
    this.ratingsEntriesService.getUserGoalsByDate(this.teamMemberId!, this.selectedDate).subscribe({
      next: (response) => {
        this.toDoData = response.ratings;
        this.toDoDataChange.emit(this.toDoData); 
        if (response.status === 'done') {
          this.goalsStatus = true;
        } else {
          this.goalsStatus = false;
        }
      },
      error: (error) => {
        console.error('Error fetching user goals:', error);
      }
    });
    }
  }

  justificationRequiredValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const achieved = formGroup.get('achieved')?.value;
      const justification = formGroup.get('justification')?.value;
      if (!achieved && !justification) {
        return { justificationRequired: true };
      }
      return null;
    };
  }

  todayStr() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get toDoFormArray() {
    return this.toDoForm?.get('toDo') as FormArray;
  }

  checkAchievedAmount(amount:number, i:number) {
    if((amount != null) && this.toDoArray[i].numeric_goal) {
      this.toDoFormArray.at(i).patchValue({achieved: amount >= this.toDoArray[i].numeric_goal})
    }
  }

  handleSubmit() {
    if (this.toDoForm.valid) {
      const updatedToDoFormArray = this.toDoFormArray.value.map((toDo: any) => ({
        ...toDo,
        user_id: this.toDoArray[0].employee_id,
      }));
  
      this.ratingsEntriesService.submit(updatedToDoFormArray).subscribe({
        next: (res: any) => {
          this.store.addNotifications('Goal submitted successfully!', 'success');
          this.checkToDoLogged();
        },
        error: (res: any) => {
          this.store.addNotifications('There was an error submitting the goal', 'error');
        }
      });
    }
  }
  
  onAchievedChange(index: number) {
    const goal = this.toDoFormArray.at(index);
    if (!goal.get('achieved')?.value) {
      goal.get('details')?.reset();
    }
  }
}



  


