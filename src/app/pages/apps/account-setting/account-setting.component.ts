import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatDividerModule } from '@angular/material/divider';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NotificationStore } from 'src/app/stores/notification.store';
import { UsersService } from 'src/app/services/users.service';
import { MatDialog } from '@angular/material/dialog';
import { NgIf } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CompaniesService } from 'src/app/services/companies.service';
import { PlansService } from 'src/app/services/plans.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-account-setting',
  imports: [
    MatCardModule, 
    MatIconModule, 
    TablerIconsModule, 
    MatTabsModule, 
    MatFormFieldModule, 
    MatSlideToggleModule, 
    MatSelectModule, 
    MatInputModule, 
    MatButtonModule, 
    MatDividerModule, 
    MatDatepickerModule, 
    MatNativeDateModule, 
    NgIf,
    ReactiveFormsModule
  ],
  templateUrl: './account-setting.component.html'
})
export class AppAccountSettingComponent implements OnInit {
  notificationStore = inject(NotificationStore);
  user: any = {
    name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    employee: {
        company: '',
        position_name: '',
        emergency_contact: {
            name: '',
            relationship: '',
            phone: ''
        },
        medical_conditions: '',
        social_media: {
            facebook: '',
            instagram: '',
            twitter: '',
            linkedin: ''
        },
        start_date: '',
        insurance_data: {
            provider: '',
            policy_number: '',
            coverage_details: '',
            createdAt: ''
        }
    }
  };
  picture: string = 'assets/images/default-profile-pic.png';
  personalForm!: FormGroup;
  medicalForm!: FormGroup;
  socialMediaForm!: FormGroup;
  isSubmitting: boolean = false;
  showInsuranceDetails: boolean = false;
  selectedTag: string = 'general';
  role: string;
  currentPlan: any = {
    id: '',
    name: ''
  };
  
  constructor(
    public companiesService: CompaniesService,  
    private usersService: UsersService, 
    private fb: FormBuilder,
    private dialog: MatDialog,
    private plansService: PlansService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.getTM();

    if(this.role == '3'){
      this.getCurrentPlan();
    }
  }

  initForms(): void {
    // Personal form
    this.personalForm = this.fb.group({
      name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: ['']
    });

    // Medical form
    this.medicalForm = this.fb.group({
      medical_conditions: [''],
      emergency_contact: this.fb.group({
        name: [''],
        relationship: [''],
        phone: ['']
      }),
      insurance_data: this.fb.group({
        provider: [''],
        policy_number: [''],
        coverage_details: [''],
        createdAt: [null]
      })
    });

    // Social media form
    this.socialMediaForm = this.fb.group({
      social_media: this.fb.group({
        facebook: [''],
        instagram: [''],
        twitter: [''],
        linkedin: ['']
      })
    });
  }

  getCurrentPlan() {
    this.companiesService.getByOwner().subscribe((company: any) => {
      this.plansService.getCurrentPlan(company.company_id).subscribe((plan: any) => {
        this.currentPlan.id = plan.plan.id
        this.currentPlan.name = plan.plan.name;
      });
    });
  }

  getTM() {
    const userEmail = localStorage.getItem('email') || '';
    this.role = localStorage.getItem('role') || '';
    const userFilter = {
        searchField: '',
        filter: {
            currentUser: this.role == '2' ? true : false,
            email: userEmail
        }
    };
    this.usersService.getUsers(userFilter).subscribe({
        next: (users: any) => {
            this.user = users[0];

            this.populateForms();
            
            this.usersService.getProfilePic(this.user.id).subscribe({
                next: (url: any) => {
                    if (url) {
                        this.picture = url;
                    }
                }
            });
        },
    });
  }

  populateForms(): void {
    // Populate personal form
    this.personalForm.patchValue({
      name: this.user.name,
      last_name: this.user.last_name,
      email: this.user.email,
      phone: this.user.phone,
      address: this.user.address
    });

    // Populate medical form
    if (this.role === '2' && this.user.employee) {
      this.medicalForm.patchValue({
        medical_conditions: this.user.employee.medical_conditions,
        emergency_contact: {
          name: this.user.employee.emergency_contact?.name || '',
          relationship: this.user.employee.emergency_contact?.relationship || '',
          phone: this.user.employee.emergency_contact?.phone || ''
        },
        insurance_data: {
          provider: this.user.employee.insurance_data?.provider || '',
          policy_number: this.user.employee.insurance_data?.policy_number || '',
          coverage_details: this.user.employee.insurance_data?.coverage_details || '',
          createdAt: this.user.employee.insurance_data?.createdAt || null
        }
      });

      // Populate social media form
      this.socialMediaForm.patchValue({
        social_media: {
          facebook: this.user.employee.social_media?.facebook || '',
          instagram: this.user.employee.social_media?.instagram || '',
          twitter: this.user.employee.social_media?.twitter || '',
          linkedin: this.user.employee.social_media?.linkedin || ''
        }
      });
    }
  }

  uploadProfilePicture(): void {

  }

  resetProfilePicture(): void {
    this.picture = 'assets/images/default-profile-pic.png';
  }

  saveUserData(): void {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    const userData = {
      ...this.personalForm.value,
      id: this.user.id
    };
    
    this.usersService.update(userData)
      .pipe(
        catchError(error => {
          this.notificationStore.addNotifications(error.message, 'error');
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {

          if (this.role === '2') {
            this.saveMedicalData();
          } else {
            this.isSubmitting = false;
            this.notificationStore.addNotifications('User data updated successfully!');
            this.user = response;
            this.populateForms();
          }
        } else {
          this.isSubmitting = false;
        }
      });
  }
  
  saveMedicalData(): void {
    const medicalData = {
      medical_conditions: this.medicalForm.value.medical_conditions,
      emergency_contact: this.medicalForm.value.emergency_contact,
      insurance_data: this.medicalForm.value.insurance_data,
      social_media: this.socialMediaForm.value.social_media
    };

    this.usersService.updateEmployeeMedical(this.user.id, medicalData)
      .pipe(
        catchError(error => {
          console.error('Error updating medical data:', error);
          this.notificationStore.addNotifications('Error updating medical data. Please try again.', 'error');
          return of(null);
        }),
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe(response => {
        if (response) {

          this.notificationStore.addNotifications('User data updated successfully!');

          this.getTM();
        }
      });
  }

  cancelChanges(): void {
    this.populateForms();
    this.notificationStore.addNotifications('Changes cancelled', 'error');
  }
}