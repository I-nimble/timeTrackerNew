import { Component, OnInit, inject, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
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
import { CommonModule, NgIf } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CompaniesService } from 'src/app/services/companies.service';
import { PlansService } from 'src/app/services/plans.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { OlympiaService } from 'src/app/services/olympia.service';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MatProgressBar } from '@angular/material/progress-bar';
import { ApplicationsService } from 'src/app/services/applications.service';
import { SubscriptionService, SubscriptionStatus } from 'src/app/services/subscription.service';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';

@Component({
  standalone: true,
  selector: 'app-account-setting',
  imports: [MatCardModule, ReactiveFormsModule, MatIconModule, TablerIconsModule, MatTabsModule, MatFormFieldModule, MatSlideToggleModule, MatSelectModule, MatInputModule, MatButtonModule, MatDividerModule, MatDatepickerModule, MatNativeDateModule, NgIf, RouterLink, MatProgressBar, CommonModule],
  templateUrl: './account-setting.component.html'
})
export class AppAccountSettingComponent implements OnInit {
  selectedTabIndex: number = 0;
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
      bussiness_segment: '',
      show_info: true
    }
  };
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
    show_info: [true],
    old_password: ['', [Validators.minLength(8)]],
    new_password: ['', [Validators.minLength(8)]]
  },  {
    validators: this.passwordValidator
  });
  personalForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+\d{1,4}\s\(\d{1,4}\)\s\d{3}(?:-\d{4})?$/)]],
    address: ['', Validators.required],
    profile: ['']
  });
  medicalForm: FormGroup = this.fb.group({
    medical_conditions: [''],
    emergency_contact: this.fb.group({
      name: [''],
      relationship: [''],
      phone: ['', Validators.pattern(/^\+\d{1,4}\s\(\d{1,4}\)\s\d{3}(?:-\d{4})?$/)]
    }),
    insurance_data: this.fb.group({
      provider: [''],
      policy_number: [''],
      coverage_details: [''],
      createdAt: [null]
    })
  });
  socialMediaForm: FormGroup = this.fb.group({
    social_media: this.fb.group({
      facebook: [''],
      instagram: [''],
      twitter: [''],
      linkedin: ['']
    })
  });
  isSubmitting: boolean = false;
  showInsuranceDetails: boolean = false;
  selectedTag: string = 'general';
  role: string | null = localStorage.getItem('role');
  currentPlan: any = {
    id: '',
    name: ''
  };
  logo: string = 'assets/images/default-logo.jpg';
  picture: string = this.role === '3' ? 'assets/images/default-user-profile-pic.png' : 'assets/images/default-logo.jpg';
  originalLogo: string = '';
  submitted: boolean = false;
  showForm: boolean = false;
  isOrphan: boolean;
  matchRequested: boolean = false;
  olympiaForm = this.fb.group({
    full_name: ['', Validators.required],
    birth_date: ['', Validators.required],
    location_state_country: ['', Validators.required],
    application_area: ['', Validators.required],
    take_initiative: ['', Validators.required],
    quick_decisions: ['', Validators.required],
    pressure_leadership: ['', Validators.required],
    express_opinions: ['', Validators.required],
    adapt_changes: ['', Validators.required],
    motivate_team: ['', Validators.required],
    social_interactions: ['', Validators.required],
    good_communicator: ['', Validators.required],
    team_projects: ['', Validators.required],
    help_colleagues: ['', Validators.required],
    workplace_harmony: ['', Validators.required],
    structured_environment: ['', Validators.required],
    team_listener: ['', Validators.required],
    support_transitions: ['', Validators.required],
    long_term_strategies: ['', Validators.required],
    detail_oriented: ['', Validators.required],
    follow_procedures: ['', Validators.required],
    plan_ahead: ['', Validators.required],
    precision_work: ['', Validators.required],
    give_feedback: ['', Validators.required],
    childhood_obedience: ['', Validators.required],
    gets_grumpy: ['', Validators.required],
    laughs_dirty_jokes: ['', Validators.required],
    prejudice_free: ['', Validators.required],
    brags_sometimes: ['', Validators.required],
    immediate_responses: ['', Validators.required],
    procrastinates: ['', Validators.required],
    ever_lied: ['', Validators.required],
    accept_win_over_loss: ['', Validators.required],
  });
  videoPreview: string | null = null;
  selectedVideoFile: File | null = null;
  videoUploadProgress: number = 0;
  maxVideoSize: number = 100 * 1024 * 1024; 
  sentinelSubscription: SubscriptionStatus | null = null;
  isLoadingSubscription = false;
  formChanged: boolean = false;
  originalUserData: any = null;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('videoInput') videoInput!: ElementRef<HTMLInputElement>;
  
  constructor(public companiesService: CompaniesService,  
            private usersService: UsersService, 
            private fb: FormBuilder,
            private dialog: MatDialog,
            private plansService: PlansService,
            private olympiaService: OlympiaService,
            public snackBar: MatSnackBar,
            private cdr: ChangeDetectorRef,
            public applicationsService: ApplicationsService,
            private route: ActivatedRoute,
            private router: Router,
            private subscriptionService: SubscriptionService,
          ) {}

  ngOnInit(): void {
    this.getUser();
    this.isOrphan = localStorage.getItem('isOrphan') === 'true';
    this.checkOlympiaStatus();
    this.loadExistingVideo(); 
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab !== undefined && !isNaN(tab)) {
        this.selectedTabIndex = +tab;
      }
      this.checkSubscriptionSuccess();
    }); 
    this.loadSubscriptionStatus();
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
  }

  checkOlympiaStatus(): void {
    this.olympiaService.checkOlympiaForm().subscribe({
      next: (res: boolean) => {
        this.submitted = res;
      },
      error: () => {
        console.error('Error checking Olympia form status');
      }
    });
  }

  loadExistingVideo(): void {
    if (!this.user?.email) return;

    this.usersService.getIntroductionVideo(this.user.email).subscribe({
      next: (res: any) => {
        if (res.videoURL) {
          this.videoPreview = res.videoURL;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.warn('No introduction video found or failed to load', err);
      }
    });
  }

  onVideoSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/mpeg'];
    if (!allowedTypes.includes(file.type)) {
      this.openSnackBar('Only MP4, MOV, and AVI video files are allowed!', 'Close');
      this.resetVideoInput();
      return;
    }

    if (file.size > this.maxVideoSize) {
      this.openSnackBar('Video file size should be 100MB or less', 'Close');
      this.resetVideoInput();
      return;
    }

    this.selectedVideoFile = file;
    this.previewVideo(file);
    this.checkFormChanges();
  }

  previewVideo(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.videoPreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  deleteVideo(): void {
    this.videoPreview = null;
    this.selectedVideoFile = null;
    this.videoUploadProgress = 0;
    this.resetVideoInput();
    
    // this.usersService.deleteIntroductionVideo().subscribe({
    //   next: () => {
    //     this.notificationStore.addNotifications('Video deleted successfully', 'success');
    //   },
    //   error: (error) => {
    //     this.notificationStore.addNotifications('Error deleting video', 'error');
    //   }
    // });
  }

  resetVideoInput(): void {
    if (this.videoInput) {
      this.videoInput.nativeElement.value = '';
    }
  }

  getUser() {
    if(this.role === '3') { // Client user
      this.usersService.getUsers(
        { searchField: '', filter: { currentUser: true } }
      ).subscribe({
          next: (users: any) => {
            this.user = users[0];
            this.checkMatchRequestStatus() 
            this.loadExistingVideo();
            this.usersService.getProfilePic(this.user.id).subscribe({
              next: (url: any) => {
                if (url) {
                    this.picture = url;
                }
              }
            });

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
          currentUser: true,
          email: userEmail,
          includeAdmins: true
        }
      };
      this.usersService.getUsers(userFilter).subscribe({
        next: (users: any) => {
          this.user = users[0];
          this.loadExistingVideo();
          this.checkMatchRequestStatus() 
          this.initializeForm();
          
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
  }

  checkFormChanges(): void {
    if (!this.originalUserData) return;

    const currentFormData = {
      name: this.personalForm.get('name')?.value,
      last_name: this.personalForm.get('last_name')?.value,
      email: this.personalForm.get('email')?.value,
      phone: this.personalForm.get('phone')?.value,
      address: this.personalForm.get('address')?.value
    };

    // Check if any form field has changed
    const formFieldsChanged = 
      currentFormData.name !== this.originalUserData.name ||
      currentFormData.last_name !== this.originalUserData.last_name ||
      currentFormData.email !== this.originalUserData.email ||
      currentFormData.phone !== this.originalUserData.phone ||
      currentFormData.address !== this.originalUserData.address;

    // Check if profile picture or video has changed
    const mediaChanged = this.personalForm.get('profile')?.value || this.selectedVideoFile;

    this.formChanged = formFieldsChanged || mediaChanged;
  }

  initializeForm() {
    if(this.role === '3') {
      this.profileForm.patchValue({
        name: this.user.name,
        last_name: this.user.last_name,
        logo: this.logo,
        picture: this.picture,
        email: this.user.email,
        phone: this.user.phone,
        companyName: this.user.company.name,
        headquarter: this.user.company.headquarter,
        employees_amount: this.user.company.employees_amount,
        bussiness_segment: this.user.company.bussiness_segment,
        show_info: this.user.company.show_info ?? true
      });
    }
    else {
      this.originalUserData = {
        name: this.user.name,
        last_name: this.user.last_name,
        email: this.user.email,
        phone: this.user.phone,
        address: this.user.address
      };

      // Populate personal form
      this.personalForm.patchValue({
        name: this.user.name,
        last_name: this.user.last_name,
        email: this.user.email,
        phone: this.user.phone,
        address: this.user.address,
        picture: this.picture
      });

      // Populate medical form
      this.medicalForm.patchValue({
        medical_conditions: this.user.employee?.medical_conditions,
        emergency_contact: {
          name: this.user.employee?.emergency_contact?.name || '',
          relationship: this.user.employee?.emergency_contact?.relationship || '',
          phone: this.user.employee?.emergency_contact?.phone || ''
        },
        insurance_data: {
          provider: this.user.employee?.insurance_data?.provider || '',
          policy_number: this.user.employee?.insurance_data?.policy_number || '',
          coverage_details: this.user.employee?.insurance_data?.coverage_details || '',
          createdAt: this.user.employee?.insurance_data?.createdAt || null
        }
      });

      // Populate social media form
      this.socialMediaForm.patchValue({
        social_media: {
          facebook: this.user.employee?.social_media?.facebook || '',
          instagram: this.user.employee?.social_media?.instagram || '',
          twitter: this.user.employee?.social_media?.twitter || '',
          linkedin: this.user.employee?.social_media?.linkedin || ''
        }
      });

      this.personalForm.valueChanges.subscribe(() => {
        this.checkFormChanges();
      });
    }
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
    const file = event.target.files[0];
    if (!file) return;
      if (file.size > 1000000) {
        this.notificationStore.addNotifications('Image size should be 1 MB or less', 'error')
        return
      }
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        this.notificationStore.addNotifications('Only JPG or PNG files are allowed!', 'error');
        return;
      }
      this.previewImage(file);
      // if(this.role === '3') this.profileForm.patchValue({ logo: img })
      // else this.personalForm.patchValue({ profile: img });
      this.personalForm.patchValue({ profile: file });
      this.checkFormChanges(); 
  }

  previewImage(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      // if (this.role === '3') this.logo = e.target.result;
      // else this.picture = e.target.result;
      this.picture = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  deleteImage() {
    // if(this.role ==='3') {
    //   this.logo = 'assets/images/default-logo.jpg';
    //   this.profileForm.patchValue({ logo: null });
    // }
    // else {
      this.picture = this.role === '3' ? 'assets/images/default-user-profile-pic.png' : 'assets/images/default-logo.jpg';
      this.personalForm.patchValue({ profile: null });
      this.resetFileInput();
    // }
  }

  resetFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  isSaveEnabled(): boolean {
    if (this.role === '3') {
      return this.profileForm.valid;
    } else {
      return this.personalForm.valid && this.formChanged;
    }
  }
  
  saveProfile() {
    this.isSubmitting = true;

    if(this.role === '3') {
      if (!this.profileForm.valid) {
        this.openSnackBar('Please fill all fields', 'Close');
        this.isSubmitting = false;
        return;
      }
  
      const userData = {
        ...this.user,
        ...this.profileForm.value,
        role: this.role,
        company: {
          id: this.user.company.id
        },
        profile: this.personalForm.get('profile')?.value
      };
  
      const companyData = {
        id: this.user.company.id,
        name: this.profileForm.value.companyName,
        logo: this.logo !== this.originalLogo ? this.profileForm.value.logo : this.originalLogo, // Validate logo changes
        headquarter: this.profileForm.value.headquarter,
        employees_amount: this.profileForm.value.employees_amount,
        bussiness_segment: this.profileForm.value.bussiness_segment,
        show_info: this.profileForm.value.show_info
      };
  
      this.usersService.updateProfile(userData).subscribe({
        next: () => {
            this.companiesService.submit(companyData, companyData.id).subscribe({
                complete: () => {
                  this.openSnackBar('Profile updated successfully', 'Close');
                  this.isSubmitting = false;
                  this.getUser();
                }
            });
        },
        error: (res: any) => {
          this.openSnackBar('Error updating profile.', 'Close');
          this.isSubmitting = false;
        }
      });
  
      if(this.profileForm.value.old_password && this.profileForm.value.new_password) {
          const passwordData = {
              old_password: this.profileForm.value.old_password,
              new_password: this.profileForm.value.new_password
          };
          this.usersService.updatePassword(passwordData).subscribe({
              error: (res: any) => {
                this.isSubmitting = false;
                this.notificationStore.addNotifications(res.error.message, 'error');
              }
          });
      }
    }
    else {
      if(!this.personalForm.valid) {
        this.openSnackBar('Please fill all fields', 'Close');
        this.isSubmitting = false;
        return;
      }
  
      const userData = {
        ...this.user,
        ...this.personalForm.value,
        role: this.role,
        employee: {
          ...this.user.employee,
          medical_conditions: this.medicalForm.get('medical_conditions')?.value,
          emergency_contact: {
            name: this.medicalForm.get('emergency_contact.name')?.value,
            relationship: this.medicalForm.get('emergency_contact.relationship')?.value,
            phone: this.medicalForm.get('emergency_contact.phone')?.value
          },
          insurance_data: {
            provider: this.medicalForm.get('insurance_data.provider')?.value,
            policy_number: this.medicalForm.get('insurance_data.policy_number')?.value,
            coverage_details: this.medicalForm.get('insurance_data.coverage_details')?.value,
            createdAt: this.medicalForm.get('insurance_data.createdAt')?.value
          },
          social_media: {
            facebook: this.socialMediaForm.get('social_media.facebook')?.value,
            instagram: this.socialMediaForm.get('social_media.instagram')?.value,
            twitter: this.socialMediaForm.get('social_media.twitter')?.value,
            linkedin: this.socialMediaForm.get('social_media.linkedin')?.value
          }
        }
      };
    
      this.usersService.updateProfile(userData)
        .pipe(
          catchError(error => {
            this.openSnackBar(error.error.message, 'Close');
            this.isSubmitting = false;
            return of(null);
          })
        )
        .subscribe(response => {
          if (this.selectedVideoFile) {
            this.uploadVideo();
          } else {
            this.openSnackBar('User data updated successfully!', 'Close');
            this.user = response;
            this.isSubmitting = false;
            this.getUser();
          }
        });
    }
  }

  uploadVideo(): void {
    if (!this.selectedVideoFile) return;

    this.usersService.uploadIntroductionVideo(this.selectedVideoFile, this.user.email)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.selectedVideoFile = null;
          this.videoUploadProgress = 0;
        })
      )
      .subscribe({
        next: (res: any) => {
          this.openSnackBar('Video uploaded successfully!', 'Close');
          this.videoPreview = res.videoURL;
        },
        error: (error) => {
          this.openSnackBar('Error uploading video: ' + error.error?.message, 'Close');
          console.error('Video upload error:', error);
        }
      });
  }

  submitOlympiaForm(): void {
    this.isSubmitting = true;
    if (!this.olympiaForm.valid) {
      this.openSnackBar('Please fill all the required fields', 'close');
      this.isSubmitting = false;
      return;
    }

    const data = this.olympiaForm.value;
    this.olympiaService.submitOlympiaForm(data).subscribe({
      next: () => {
        this.openSnackBar('Form submitted successfully', 'close');
        this.isSubmitting = false;
        this.submitted = true;
      },
      error: () => {
        this.openSnackBar('Error submitting form', 'close');
        this.isSubmitting = false;
      },
    });
  }

  checkMatchRequestStatus() {
    if (!this.user?.id) return;
    
    this.usersService.checkMatchStatus(this.user.id).subscribe({
      next: (status: boolean) => {
        this.matchRequested = status;
      },
      error: (error) => {
        console.error('Error checking match status', error);
      }
    });
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  loadSubscriptionStatus(): void {
    this.subscriptionService.getSubscriptionStatus().subscribe({
      next: (status) => {
        this.sentinelSubscription = status;
      },
      error: (error) => {
        console.error('Error loading subscription status:', error);
      }
    });
  }

  enableSentinel(): void {
    this.isLoadingSubscription = true;
    
    this.subscriptionService.createSubscription().subscribe({
      next: (response) => {
        // Stripe checkout
        window.location.href = response.url;
      },
      error: (error) => {
        console.error('Error creating subscription:', error);
        this.openSnackBar('Error creating subscription. Please try again.', 'Close');
        this.isLoadingSubscription = false;
      }
    });
  }

  disableSentinel(): void {
    const dialogRef = this.dialog.open(ModalComponent, {
      width: '400px',
      data: {
        action: 'cancel',
        subject: 'Sentinel subscription',
        message: 'Note: You will have access until the end of your billing period.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoadingSubscription = true;
        
        this.subscriptionService.cancelSubscription().subscribe({
          next: (response) => {
            this.openSnackBar('Subscription will be canceled at the end of the billing period.', 'Close');
            this.loadSubscriptionStatus();
            this.isLoadingSubscription = false;
          },
          error: (error) => {
            console.error('Error canceling subscription:', error);
            this.openSnackBar('Error canceling subscription. Please try again.', 'Close');
            this.isLoadingSubscription = false;
          }
        });
      }
    });
  }

  checkSubscriptionSuccess(): void {
    this.route.queryParams.subscribe(params => {
      if (params['subscription'] === 'success') {
        this.openSnackBar('Sentinel subscription activated successfully!', 'Close');
        this.loadSubscriptionStatus();
        this.router.navigate(['/apps/account-settings']);

      } else if (params['subscription'] === 'canceled') {
        this.openSnackBar('Subscription process was canceled.', 'Close');

        this.router.navigate(['/apps/account-settings']);
      }
    });
  }
} 
