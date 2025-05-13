import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationStore } from 'src/app/stores/notification.store';
import { UsersService } from 'src/app/services/users.service';
import { MatDialog } from '@angular/material/dialog';
import { NgIf } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CompaniesService } from 'src/app/services/companies.service';
import { PlansService } from 'src/app/services/plans.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment';

@Component({
  standalone: true,
  selector: 'app-account-setting',
  imports: [MatCardModule, ReactiveFormsModule, MatIconModule, TablerIconsModule, MatTabsModule, MatFormFieldModule, MatSlideToggleModule, MatSelectModule, MatInputModule, MatButtonModule, MatDividerModule, MatDatepickerModule, MatNativeDateModule, NgIf],
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
    },
    company: {
      name: '',
      headquarter: '',
      employees_amount: '',
      bussiness_segment: ''
    }
  };
  picture: string = 'assets/images/default-profile-pic.png';
  profileForm: FormGroup = this.fb.group({
    name: [''],
    last_name: [''],
    logo: [''],
    email: [''],
    phone: ['', Validators.pattern(/^\+\d{1,4}\s\(\d{1,4}\)\s\d{3}(?:-\d{4})?$/)],
    companyName: [''],
    headquarter: [''],
    employees_amount: [null, [Validators.min(0)]],
    bussiness_segment: [''],
    old_password: ['', [Validators.minLength(8)]],
    new_password: ['', [Validators.minLength(8)]]
  },  {
    validators: this.passwordValidator
  });
  showInsuranceDetails: boolean = false;
  selectedTag: string = 'general';
  role: string | null = localStorage.getItem('role');
  currentPlan: any = {
    id: '',
    name: ''
  };
  logo: string = 'assets/images/default-logo.jpg';
  originalLogo: string = '';
  
  constructor(public companiesService: CompaniesService,  
            private usersService: UsersService, 
            private fb: FormBuilder,
            private dialog: MatDialog,
            private plansService: PlansService,
            public snackBar: MatSnackBar,
            private cdr: ChangeDetectorRef
          ) {}

  ngOnInit(): void {
    this.getUser();
  }

  getUser() {
    if(this.role === '3') { // Client user
      this.usersService.getUsers(
        { searchField: '', filter: { currentUser: true } }
      ).subscribe({
          next: (users: any) => {
            this.user = users[0];
            this.companiesService.getByOwner().subscribe((company: any) => {
              if(company.company.logo) {
                  this.logo = `${environment.upload}/company-logos/${company.company.logo}`;
                  this.originalLogo = this.logo; // Store the previous logo
              }

              this.plansService.getCurrentPlan(company.company_id).subscribe({
                next: (plan: any) => {
                  this.currentPlan.id = plan.plan.id
                  this.currentPlan.name = plan.plan.name;
                },
                complete: () => {
                  // Initialize form after all client data is fetched
                  this.initializeForm();
                }
              });
            });
          },
          error: () => {
            this.openSnackBar('Error loading data', 'Close');
          }, 
      });
    }
    else { // Admin or Team Member
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
              
              this.usersService.getProfilePic(this.user.id).subscribe({
                  next: (url: any) => {
                      if (url) {
                          this.picture = url;
                      }
                  }
              });
          },
          complete: () => {
            // Initialize form after all client data is fetched
            this.initializeForm();
          },
      });
    }
  }

  initializeForm() {
    this.profileForm.patchValue({
      name: this.user.name,
      last_name: this.user.last_name,
      logo: this.logo,
      email: this.user.email,
      phone: this.user.phone,
      companyName: this.user.company.name,
      headquarter: this.user.company.headquarter,
      employees_amount: this.user.company.employees_amount,
      bussiness_segment: this.user.company.bussiness_segment,
    });
  }

  passwordValidator(group: FormGroup) {
    const oldPassword = group.get('old_password')?.value;
    const newPassword = group.get('new_password')?.value;

    if (oldPassword && (!newPassword)) {
      return { newPasswordRequired: true };
    }
    return null;
  }

  onFileSelected(event: any) {
    const img = event.target.files[0];
    if (img) {
      if(img.size > 1000000) {
        this.notificationStore.addNotifications('Image size should be 1 MB or less', 'error')
        return
      }
      if(img.type != 'image/jpeg') {
        this.notificationStore.addNotifications('Only .jpeg files are allowed!', 'error')
        return
      }
      this.previewImage(img);
      this.profileForm.patchValue({ logo: img });
    }
  }

  previewImage(file: File) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.logo = e.target.result;
      };
      reader.readAsDataURL(file);
  }

  deleteImage() {
      this.logo = 'assets/images/default-logo.jpg';
      this.profileForm.patchValue({ logo: null });
  }

  saveProfile() {
    if (!this.profileForm.valid) {
      this.openSnackBar('Please fill all fields', 'Close');
      return;
    }

    const userData = {
      ...this.user,
      ...this.profileForm.value,
      role: localStorage.getItem('role'),
      company: {
        id: this.user.company.id
      }
    };

    const companyData = {
      id: this.user.company.id,
      name: this.profileForm.value.companyName,
      logo: this.logo !== this.originalLogo ? this.profileForm.value.logo : this.originalLogo, // Validate logo changes
      headquarter: this.profileForm.value.headquarter,
      employees_amount: this.profileForm.value.employees_amount,
      bussiness_segment: this.profileForm.value.bussiness_segment
    };

    this.usersService.update(userData).subscribe({
      next: () => {
          this.companiesService.submit(companyData, companyData.id).subscribe({
              complete: () => {
                this.openSnackBar('Profile updated successfully', 'Close');
                this.getUser();
              }
          });
      }
    });

    if(this.profileForm.value.old_password && this.profileForm.value.new_password) {
        const passwordData = {
            old_password: this.profileForm.value.old_password,
            new_password: this.profileForm.value.new_password
        };
        this.usersService.updatePassword(passwordData).subscribe({
            error: (res: any) => {
                this.notificationStore.addNotifications(res.error.message, 'error');
            }
        });
    }
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
} 
