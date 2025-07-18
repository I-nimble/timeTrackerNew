import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';
import { SharedModule } from 'src/app/components/shared.module';
import { NotificationStore } from 'src/app/stores/notification.store';
import { RatingsService } from 'src/app/services/ratings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeesService } from 'src/app/services/employees.service';
import { Frequency } from 'src/app/models/Frequency.model';
import { UsersService } from 'src/app/services/users.service';
import { NgIf } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ToDoFormPopupComponent } from 'src/app/components/to-do-form-popup/to-do-form-popup.component';
import * as moment from 'moment';

@Component({
  selector: 'app-to-do',
  standalone: true,
  imports: [SharedModule, NgIf, MatSelectModule, MatFormFieldModule, MatInputModule],
  templateUrl: './to-do.component.html',
  styleUrl: './to-do.component.scss',
})
export class ToDoComponent implements OnInit {
  @Output() toDoListUpdated = new EventEmitter();
  store = inject(NotificationStore);
  now = new Date()
  userId?: any;
  email?: any;
  employerId?: any;
  teamMember?: any = '';
  companyId?: any;
  positionId?: any;
  role = localStorage.getItem('role');
  managementForm: FormGroup = this.fb.group({
    rating: this.fb.group({
      goal: ['', [Validators.required]],
      frequency_id: [null],
      recommendations: [''],
      due_date: [null],
      priority: [null],
      recurrent: [false],
      is_numeric: [false],
      numeric_goal: [null],
      company_id: [null, [Validators.required]], 
      employee_id: [null, [Validators.required]],
      updatedAt: [this.now, []],
    }, 
    { validators: this.recurrentDueDateValidator }
    ),
  });
  show: boolean = false;
  noUser: boolean = false;
  timezones: any = '';
  companies: any = [];
  formHeader: any = {
    mode: 'Create',
    title: 'To Do',
  };
  firefox: boolean = false;
  selectedForm: any;
  isAllSelected: boolean = false;
  public newOptions: any = {
    positions: {
      title: 'Ratings',
    },
  };

  public options: any = [
    {
      title: 'To Do',
      label: 'Set and rate the employee To Do',
      active: true,
      formGroup: 'rating',
      form: [
        { name: 'goal', type: 'text' }, 
        { name: 'recommendations', type: 'textarea' }, 
        { name: 'due_date', type: 'date' }, 
        { name: 'priority', type: 'select' },
        { name: 'recurrent', type: 'checkbox' },
      ],
      elements: [],
      method: this.ratingsService,
    },
  ];
  usersList: any[] = [];
  defaultTeamMember: any;

  constructor(
    private fb: FormBuilder,
    private ratingsService: RatingsService,
    private employeesService: EmployeesService,
    private userService: UsersService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    if (window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
      this.firefox = true;
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

    this.options.forEach((option: any) => {
      let formGroup = this.managementForm.get(option.formGroup) as FormGroup;
      option.form.forEach((form: any) => {
        for (let control in formGroup.controls) {
          if (form.name == control) {
            form.label =
              control.slice(0, 1).toUpperCase() +
              control.slice(1).replace('_id', '');
            form.control = control;
          }
        }
      });
    });

    this.getTeamMembers(); 
    this.initializeData();
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
    if(this.role === '1') {
      this.employeesService.get().subscribe((employees: any) => {
        this.usersList = employees;
        if (this.usersList.length > 0) { 
          this.getOptionsInfo();
        }
      });
    }
    if (this.role === '3') {
      this.employeesService.get().subscribe({
        next: (employees: any) => {
          this.usersList = employees.filter((user: any) => user.user.active == 1 && user.user.role == 2);
          if (this.usersList.length > 0) { 
            this.getOptionsInfo();
          }
        },
      });
      this.getEmployee();
    }
  }

  selectedTeamMember(tm: any){
    console.log('tm', tm)
    tm.user_id == null ? this.noUser = true : this.noUser = false;
    this.teamMember = tm.user_id || null;
    this.companyId = tm.company_id || null;
    this.userService.setTeamMember(tm.user_id);
    //this.managementForm.get('rating.team_member_id')?.setValue(this.teamMember);
    this.getOptionsInfo();
    this.getEmployee();
  }

  public getEmail() {
    this.email = localStorage.getItem('email') || '';
  }

  public initializeData() {
    this.getEmail();

    if (this.role === '1') {
        this.userId = this.route.snapshot.paramMap.get('id');
        this.getEmployee();
        this.getOptionsInfo();
    } else {
        this.getUsers();
    }
  }

  getUsers() {
      let body = {};
      this.userService.getUsers(body).subscribe({
        next: (users) => {
        const user = users.filter((user: any) => user.active == 1 && user.email === this.email);
        this.userId = user[0]?.id
        this.companyId = user[0].company?.id
        this.getEmployee();
        this.getOptionsInfo();
        },
        error: () => {},
      });
  }

  getEmployee() {
    if (this.role == '2' ) {
      this.employeesService.getById(this.userId).subscribe((employee:any) => {
        if(employee?.length > 0) {
          this.companyId = employee[0].company_id
          this.positionId = employee[0].position_id
          this.managementForm?.get('rating')?.patchValue({
            company_id: this.companyId,
            employee_id: this.userId
          });
        } else {
          this.store.addNotifications('Invalid employee ID', 'error');
          if (this.role === '1') {
            this.router.navigate(['/admin/ratings/']);
          }
        }
      });
    } else {
      this.managementForm?.get('rating')?.patchValue({
        company_id: this.companyId,
        employee_id: this.teamMember
      });
    }
  }


  handleSelection(
    i: number,
    selectedOption: any = null,
    selection: any = null
  ) {
    if (selection) {
      this.openFormModal(selection, 'Edit');
    } else {
      // Existing logic for handling selection
      if (selectedOption && !selectedOption.active) {
        this.resetForm();
      }
      this.options.forEach((option: any, index: number) => {
        option.elements.forEach((element: any) => {
          if (selection == element) {
            this.fillForm(option, selection);
            this.show = true;
          }
        });

        if (index != i) {
          option.active = false;
        } else {
          option.active = true;
          this.formHeader.title = option.title;
        }
      });
      this.formHeader.mode = this.selectedForm ? 'Edit' : 'Create';
    }
  }

  fillForm(option: any, select: any) {
    this.managementForm.reset();
    this.managementForm.get('recurrent')?.setValue(false);
    if (this.selectedForm == select) {
      this.selectedForm = null;
      return;
    }
    if (this.selectedForm != select) {
      this.managementForm.get(option.formGroup)?.patchValue(select);
      this.selectedForm = select;
    }
  }

  resetForm(open: boolean = false) {
    this.selectedForm = null;
    this.managementForm.reset();
    this.managementForm.get('recurrent')?.setValue(false);
    this.formHeader.mode = 'Create';
    const ratingData = {
      company_id: this.companyId,
      employee_id: this.role === '2' ? this.userId : this.teamMember,
      recurrent: false
    };
    this.managementForm?.get('rating')?.patchValue(ratingData);
    this.managementForm?.get('rating.is_numeric')?.setValue(false);
    if (open) {
      this.show = true;
    }
  }
  getOptionsInfo() {
    if (this.role == '2') {
      forkJoin([
        this.ratingsService.getByUser(this.userId)
      ]).subscribe({
        next: (selectsInfo) => {
          this.options.forEach((option: any, i: number) => {
            option.elements = selectsInfo[i];
          });
        },
      });
    } else {
      if(this.teamMember == null){
        forkJoin([
          this.ratingsService.getByNullUser(this.companyId)
        ]).subscribe({
          next: (selectsInfo) => {
            this.options.forEach((option: any, i: number) => {
              option.elements = selectsInfo[i];
            });
          },
        });
      } else {
        console.log('teamMember', this.teamMember)
        forkJoin([
          this.ratingsService.getByUser(this.teamMember)
        ]).subscribe({
          next: (selectsInfo) => {
            console.log(selectsInfo)
            this.options.forEach((option: any, i: number) => {
              option.elements = selectsInfo[i];
            });
          },
        });
      }
    }
  }

  openFormModal(selectedForm: any = null, mode: string = 'Create') {
    if (!selectedForm) {
      this.resetForm();
    }
  
    const dialogRef = this.dialog.open(ToDoFormPopupComponent, {
      data: {
        formHeader: { mode, title: 'To Do' },
        managementForm: this.managementForm,
        selectedForm,
        role: this.role,
        teamMember: this.teamMember,
        options: this.options,
      },
      width: '600px',
      backdropClass: 'blur',
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'submit') {
        this.selectedForm = selectedForm
        this.sendForms(result.option);
      } else if (result?.action === 'delete') {
        this.deleteOption(selectedForm.id, result.option);
      } 
    });
  }
  

  sendForms(option: any, formValue?: any) {
    const formGroup = this.managementForm.get(option.formGroup) as FormGroup;
    if (formValue) {
      // Format due_date using moment.utc
      if (formValue?.due_date) {
        formValue.due_date = moment.utc(formValue.due_date).format('YYYY-MM-DDTHH:mm:ss.000Z');
      }
      formGroup.patchValue(formValue); // Patch the form values into the managementForm
    }

    // Ensure due_date in managementForm is formatted if formValue is not provided
    const dueDateControl = formGroup.get('due_date');
    if (dueDateControl?.value) {
      dueDateControl.setValue(moment.utc(dueDateControl.value).format('YYYY-MM-DDTHH:mm:ss.000Z'));
    }
  
    if (this.managementForm.get(option.formGroup)?.valid) {
      this.ratingsService
        .submit(
          this.managementForm.get(option.formGroup)?.value,
          this.selectedForm ? this.selectedForm.id : null
        )
        .subscribe({
          next: (response: any) => {
            this.toDoListUpdated.emit();
            if (!this.selectedForm) {
              this.options[0].elements.push(response);
              this.resetForm();
              return;
            }
            option.elements = option.elements.map((item: any) => {
              if (item.id == response.id) {
                item = response;
                this.selectedForm = response;
              }
              return item;
            });
          },
          error: (err: ErrorEvent) => {
            const { error } = err;
            this.store.addNotifications(error.message, 'error');
          },
        });
    } else {
      this.store.addNotifications('Fill the required fields');
    }
  }
  
  deleteOption(id: number, option: any) {
    const dialog = this.dialog.open(ModalComponent, {
      data: { subject: option.formGroup },
    });
    dialog.afterClosed().subscribe((modal: boolean) => {
      if (modal) {
        option.method.delete(id).subscribe({
          next: () => {
            this.resetForm();
            option.elements = option.elements.filter(
              (option: any) => option.id != id
            );
            this.toDoListUpdated.emit();
            // this.store.addNotifications('Success Operation');
          },
          error: (err: ErrorEvent) => {
            const { error } = err;
            this.store.addNotifications(error.message, 'error');
          },
        });
      }
    });
  }
  isNumeric() {
    const isNumericControl = this.managementForm.get('rating.is_numeric');
    isNumericControl?.setValue(!isNumericControl?.value);
    if (!this.managementForm.get('rating.is_numeric')?.value) {
      this.managementForm.get('rating.numeric_goal')?.setValue(null);
    }
  }
}
