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
import { MatTabChangeEvent } from '@angular/material/tabs';
import {
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  AbstractControl,
  ValidatorFn,
  ValidationErrors
} from '@angular/forms';
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
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { OlympiaService } from 'src/app/services/olympia.service';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { MatProgressBar } from '@angular/material/progress-bar';
import { ApplicationsService } from 'src/app/services/applications.service';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MaterialModule } from '../../../material.module';
import { CertificationsService } from 'src/app/services/certifications.service';
import { MatMenuModule } from '@angular/material/menu';
import { AppCertificationModalComponent } from './certification-modal.component';
import { LoaderComponent } from 'src/app/components/loader/loader.component';
import { Loader } from 'src/app/app.models';
import { PermissionService } from 'src/app/services/permission.service';

@Component({
  standalone: true,
  selector: 'app-account-setting',
  imports: [MaterialModule, MatCardModule, ReactiveFormsModule, MatIconModule, TablerIconsModule, MatTabsModule, MatFormFieldModule, MatSlideToggleModule, MatSelectModule, MatInputModule, MatButtonModule, MatDividerModule, MatDatepickerModule, MatNativeDateModule, NgIf, RouterLink, MatProgressBar, CommonModule, MatMenuModule, LoaderComponent, ModalComponent],
  templateUrl: './account-setting.component.html'
})
export class AppAccountSettingComponent implements OnInit {
  selectedTabIndex: number = 0;
  selectedTabLabel: string = '';
  isCandidate = false;
  notificationStore = inject(NotificationStore);
  private fb = inject(FormBuilder);
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
    phone: ['', [
      Validators.pattern(/^[0-9]+$/),
      Validators.minLength(10),
      Validators.maxLength(15)
    ]],
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
    phone: ['', [
      Validators.pattern(/^[0-9]+$/),
      Validators.minLength(10),
      Validators.maxLength(15)
    ]],
    address: [''],
    profile: [''],
    availability: [false]
  });
  medicalForm: FormGroup = this.fb.group({
    medical_conditions: [''],
    emergency_contact: this.fb.group({
      name: [''],
      relationship: [''],
      phone: ['', [
        Validators.pattern(/^[0-9]+$/),
        Validators.minLength(10),
        Validators.maxLength(15)
      ]]
    }),
    insurance_data: this.fb.group({
      provider: [''],
      policy_number: [''],
      coverage_details: [''],
      createdAt: ['']
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
  applicationForm: FormGroup = this.fb.group({
    location: ['', Validators.required],
    role: ['', Validators.required],
    appliedWhere: ['', Validators.required],
    referred: ['no', Validators.required],
    referredName: [''],
    age: ['', [Validators.required, Validators.min(18)]],
    contactPhone: ['', [
      Validators.required,
      Validators.pattern(/^[0-9]+$/),
      Validators.minLength(10),
      Validators.maxLength(15)
    ]],
    additionalPhone: ['', [
      Validators.pattern(/^[0-9]+$/),
      Validators.minLength(10),
      Validators.maxLength(15)
    ]],
    currentResidence: [''],
    address: ['', Validators.required],
    children: [0, [Validators.required, Validators.min(0)]],
    englishLevel: ['', Validators.required],
    competencies: ['', Validators.required],
    technicalSkills: ['', Validators.required],
    techProficiency: ['', [Validators.required, Validators.min(1), Validators.max(10)]],
    educationHistory: ['', Validators.required],
    workExperience: ['', Validators.required],
    workReferences: ['', Validators.required],
    hobbies: ['', Validators.required],
    scheduleAvailability: [null, Validators.requiredTrue],
    resume: [null],
    picture: [null],
    portfolio: [null],
    google_user_id: [''],
    salaryRange: [null, [Validators.required, Validators.min(1)]],
    programmingLanguages: ['']
  });
  locations: any[] = [];
  positions: any[] = [];
  careerRoles: any[] = [
    { title: "Virtual Assistant", position_id: 16 },
    { title: "Technology", position_id: 41 }
  ];
  englishLevels: string[] = ['Beginner', 'Intermediate', 'Advanced'];
  applicationId: number | null = null;
  resumeFileName: string | null = null;
  resumeFile: File | null = null;
  portfolioFileName: string | null = null;
  portfolioFile: File | null = null;
  application!: any;
  videoPreview: string | null = null;
  selectedVideoFile: File | null = null;
  videoUploadProgress: number = 0;
  maxVideoSize: number = 100 * 1024 * 1024; 
  maxPictureSize: number =  1 * 1024 * 1024;
  isLoadingSubscription = false;
  formChanged: boolean = false;
  originalUserData: any = null;
  isLoadingReceipt = false;
  certifications: any[] = [];
  isLoadingCertifications = false;
  loader: Loader = new Loader(false, false, false);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('videoInput') videoInput!: ElementRef<HTMLInputElement>;
  
  constructor(public companiesService: CompaniesService,  
            private usersService: UsersService, 
            private dialog: MatDialog,
            private plansService: PlansService,
            private olympiaService: OlympiaService,
            public snackBar: MatSnackBar,
            private cdr: ChangeDetectorRef,
            public applicationsService: ApplicationsService,
            private route: ActivatedRoute,
            private router: Router,
            private certificationsService: CertificationsService,
            private permissionService: PermissionService,
          ) {}

  ngOnInit(): void {
    this.isOrphan = localStorage.getItem('isOrphan') === 'true';    
    this.getUser();
    this.checkOlympiaStatus();
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab !== undefined && !isNaN(tab)) {
        this.selectedTabIndex = +tab;
        this.selectedTabLabel = '';
      }
    }); 

    if (this.isOrphan) {
      this.getLocations();
      this.getPositions();
      this.setupConditionalValidation();
      
      this.personalForm.get('phone')?.clearValidators();
      this.personalForm.get('address')?.clearValidators();
      this.personalForm.get('phone')?.updateValueAndValidity();
      this.personalForm.get('address')?.updateValueAndValidity();
    }

    this.setupNameTrimming(this.personalForm, 'name');
    this.setupNameTrimming(this.personalForm, 'last_name');
    this.setupNameTrimming(this.profileForm, 'name');
    this.setupNameTrimming(this.profileForm, 'last_name');
  }

  getLocations(): void {
    this.applicationsService.getLocations().subscribe((locations: any) => {
      this.locations = locations;
    });
  }

  getPositions(): void {
    // Using careerRoles directly instead of positions from API
    // since we only need VA and IT positions for orphan TM
  }

  private evaluateApplicationVisibility(): void {
    if (this.isOrphan) {
      this.isCandidate = true;
      return;
    }
    this.isCandidate =
      !!this.user?.application &&
      this.user.application.inmediate_availability == 1;
  }

  private initializeApplicationFormDependencies(): void {
    this.getLocations();
    this.getPositions();
    this.setupConditionalValidation();
    this.personalForm.get('phone')?.clearValidators();
    this.personalForm.get('address')?.clearValidators();
    this.personalForm.get('phone')?.updateValueAndValidity();
    this.personalForm.get('address')?.updateValueAndValidity();
  }

  setupConditionalValidation(): void {
    const referredControl = this.applicationForm.get('referred');
    if (referredControl) {
      referredControl.valueChanges.subscribe(value => {
        const referredNameControl = this.applicationForm.get('referredName');
        if (value === 'yes') {
          referredNameControl?.setValidators(Validators.required);
        } else {
          referredNameControl?.clearValidators();
        }
        referredNameControl?.updateValueAndValidity();
      });
    }

    const roleControl = this.applicationForm.get('role');
    if (roleControl) {
      roleControl.valueChanges.subscribe(value => {
        const programmingLanguagesControl = this.applicationForm.get('programmingLanguages');
        if (value && value.position_id === 41) {
          programmingLanguagesControl?.setValidators(Validators.required);
        } else {
          programmingLanguagesControl?.clearValidators();
        }
        programmingLanguagesControl?.updateValueAndValidity();
      });
    }
  }


  onTabChange(event: any) {
    this.selectedTabLabel = event.tab.textLabel;
    this.selectedTabIndex = event.index;
  }

  availabilityChange(event: MatSlideToggleChange): void {
    const availability = event.checked;
    if (this.user.application) {
      this.user.application.inmediate_availability = availability;
      this.evaluateApplicationVisibility();
    }
    this.personalForm.get('availability')?.setValue(availability, { emitEvent: false });
    this.formChanged = true;
    this.checkFormChanges();
    this.applicationsService.updateAvailability(this.user.id, availability).subscribe({
      next: () => {
        this.loadApplicationDetails(this.user.id);
        this.permissionService.notifyPermissionsUpdated();
      },
      error: (err) => {
        console.error('Error updating availability:', err);
      }
    });
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
          this.videoPreview = this.addCacheBust(res.videoURL);
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
          this.evaluateApplicationVisibility();
          this.initializeForm();
          if (this.role === '2') {
             this.loadCertifications();
             if (this.user.availability || this.isOrphan) {
              this.loadApplicationDetails(this.user.id);
              this.loadExistingVideo();
              this.checkMatchRequestStatus();
              this.checkOlympiaStatus();
              this.initializeApplicationFormDependencies();              
             }
          }
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

  loadApplicationDetails(userId: number): void {
    this.applicationsService.getUserApplication(userId).subscribe({
      next: (application: any) => {
        this.application = application;
        this.user.application = application;
        this.initializeApplicationFormDependencies();
        this.evaluateApplicationVisibility();
        if (application) {
          this.applicationId = application.id;
          this.personalForm.patchValue({
            availability: application.inmediate_availability == 1
          });
          const roleFromPosition = this.careerRoles.find(
            r => r.title === application.current_position
          );
          
          this.applicationForm.patchValue({
            location: application.location_id,
            role: roleFromPosition || null,
            appliedWhere: application.applied_where,
            referred: application.referred || 'no',
            referredName: application.referrer_name,
            age: application.age,
            contactPhone: application.phone,
            additionalPhone: application.additional_phone,
            currentResidence: application.current_residence,
            address: application.address,
            children: application.children || 0,
            englishLevel: application.english_level,
            competencies: application.competencies,
            technicalSkills: application.skills,
            techProficiency: application.tech_proficiency,
            educationHistory: application.education_history,
            workExperience: application.work_experience,
            workReferences: application.work_references,
            scheduleAvailability: application.schedule_availability,
            hobbies: application.hobbies,
            google_user_id: application.google_user_id,
            salaryRange: application.salary_range,
            programmingLanguages: application.programming_languages,
          });
          if (application.resume) {
            this.resumeFileName = application.resume;
          }
          if (application.portfolio) {
            this.portfolioFileName = application.portfolio;
          }
          const loc = this.locations.find((l: any) => l.id === application.location_id) || this.locations[application.location_id - 1] || null;
          const locationString = loc ? `${loc.city || ''}${loc.city && loc.country ? ', ' : ''}${loc.country || ''}` : '';
          const roleTitle = roleFromPosition ? roleFromPosition.title : null;

          this.olympiaForm.patchValue({
            full_name: this.user.name + ' ' + this.user.last_name,
            location_state_country: locationString,
            application_area: roleTitle,
          })
        }
      },
      error: (error) => {
        console.error('Error loading applications', error);
      }
    });
  }


  checkFormChanges(): void {
    if (!this.originalUserData) return;

    const currentFormData = {
      name: this.personalForm.get('name')?.value,
      last_name: this.personalForm.get('last_name')?.value,
      email: this.personalForm.get('email')?.value,
      phone: this.personalForm.get('phone')?.value,
      address: this.personalForm.get('address')?.value,
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
        address: this.user.address,
        availability: this.user.application?.inmediate_availability ?? false,
      };

      // Populate personal form
      this.personalForm.patchValue({
        name: this.user.name,
        last_name: this.user.last_name,
        email: this.user.email,
        phone: this.user.phone,
        address: this.user.address,
        picture: this.picture,
        availability: this.user.application?.inmediate_availability ?? false
      });

      this.personalForm.get('phone')?.markAsTouched();
      this.personalForm.get('address')?.markAsTouched();
      this.applicationForm.get('contactPhone')?.markAsTouched();
      this.applicationForm.get('additionalPhone')?.markAsTouched();

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

      if(this.isOrphan) {
        this.applicationForm.markAllAsTouched();
      }

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
      if (file.size > this.maxPictureSize) {
        this.notificationStore.addNotifications('Image size should be 1 MB or less', 'error')
        this.openSnackBar('Image size should be 1 MB or less', 'Close');
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
      if (this.isCandidate) {
        return this.personalForm.valid && this.applicationForm.valid;
      }
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
            this.usersService.updateUsername(`${userData.name} ${userData.last_name}`);
            this.companiesService.submit(companyData, companyData.id).subscribe({
                complete: () => {
                  this.permissionService.notifyPermissionsUpdated();
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
          if (response){
            this.usersService.updateUsername(`${userData.name} ${userData.last_name}`);
            if (this.applicationId) {
              this.usersService.submitApplicationDetails(
                {
                  name: `${userData.name} ${userData.last_name}`
                },
                this.applicationId
              ).subscribe();
            }
            if (this.isCandidate && this.applicationId) {
              this.submitApplicationDetailsInternal();
            } 
            if (this.selectedVideoFile) {
              this.uploadVideo();
            } else {
              this.openSnackBar('User data updated successfully!', 'Close');
              this.user = response;
              this.isSubmitting = false;
              this.getUser();
            }
          }
        });
    }
  }

  uploadVideo(): void {
    if (!this.selectedVideoFile) return;

    this.usersService.uploadIntroductionVideo(this.selectedVideoFile, this.user.email, this.applicationId || undefined)
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
          this.videoPreview = this.addCacheBust(res.videoURL);
        },
        error: (error) => {
          this.openSnackBar('Error uploading video: ' + error.error?.message, 'Close');
          console.error('Video upload error:', error);
        }
      });
  }

  submitApplicationDetails(): void {
    if (this.applicationForm.invalid) {
      this.applicationForm.markAllAsTouched();
      this.openSnackBar('Please fill all required fields', 'Close');
      return;
    }

    if (!this.applicationId) {
      this.openSnackBar('Application not found', 'Close');
      return;
    }

    if(!this.resumeFileName) {
      this.openSnackBar('Resume is required', 'Close');
      return;
    }

    this.isSubmitting = true;
    this.submitApplicationDetailsInternal();
  }

  private submitApplicationDetailsInternal(): void {
    const formValues = this.applicationForm.value;
    
    const formData: any = {
      name: this.user.name + ' ' + this.user.last_name,
      location_id: formValues.location,
      position_id: null,
      current_position: formValues.role?.title,
      applied_where: formValues.appliedWhere,
      referred: formValues.referred,
      referrer_name: formValues.referredName,
      age: formValues.age,
      phone: formValues.contactPhone,
      additional_phone: formValues.additionalPhone,
      current_residence: `${this.locations[formValues.location - 1].city}, ${this.locations[formValues.location - 1].country}`,
      address: formValues.address,
      children: formValues.children || '0',
      english_level: formValues.englishLevel,
      competencies: formValues.competencies,
      skills: formValues.technicalSkills,
      tech_proficiency: formValues.techProficiency,
      education_history: formValues.educationHistory,
      work_experience: formValues.workExperience,
      work_references: formValues.workReferences,
      hobbies: formValues.hobbies,
      schedule_availability: formValues.scheduleAvailability,
      salary_range: formValues.salaryRange,
      programming_languages: formValues.programmingLanguages,
    };

    if (this.resumeFile) {
      formData.resume = this.resumeFile;
    }

    if (this.portfolioFile) {
      formData.portfolio = this.portfolioFile;
    }

    // TODO: We could send picture and introduction_video here too instead
    
    this.usersService.submitApplicationDetails(formData, this.applicationId!).subscribe({
      next: (res: any) => {
        if (this.selectedVideoFile) {
          this.uploadVideo();
        } else {
          this.openSnackBar('Profile and application details updated successfully', 'Close');
          this.isSubmitting = false;
          this.loadApplicationDetails(this.user.id);
          this.getUser();
        }
      },
      error: (err: any) => {
        this.openSnackBar('Error updating application details', 'Close');
        this.isSubmitting = false;
        console.error(err);
      }
    });
  }

  onResumeSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.resumeFile = file;
      this.resumeFileName = file.name;
    }
  }

  onPortfolioSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.portfolioFile = file;
      this.portfolioFileName = file.name;
    }
  }

  maxFileSizeValidator(maxSize: number) {
    return (control: any) => {
      const file = control.value;
      if (file && file.size > maxSize) {
        return { maxFileSize: true };
      }
      return null;
    };
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

  private addCacheBust(url: string): string {
    if (!url) return url;
    const lower = url.toLowerCase();
    // Do not touch signed URLs (adding params breaks signature)
    if (lower.includes('x-amz-signature') || lower.includes('amazonaws.com')) {
      return url;
    }
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  }

  restrictPhoneInput(event: KeyboardEvent) {
    const allowedKeys = ['+', ' ', '(', ')', '-', 'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];
    const key = event.key;
    
    // Allow control keys
    if (allowedKeys.includes(key)) {
      return;
    }
    
    // Allow only numbers
    if (!/^\d$/.test(key)) {
      event.preventDefault();
    }
  }
  loadCertifications() {
    this.isLoadingCertifications = true;
    this.loader.started = true;
    this.certificationsService.getAll().subscribe({
      next: (res: any) => {
        this.certifications = res;
        this.isLoadingCertifications = false;
        this.loader.started = false;
      },
      error: (err) => {
        console.error('Error loading certifications', err);
        this.openSnackBar('Error loading certifications', 'Close');
        this.isLoadingCertifications = false;
        this.loader.started = false;
      }
    });
  }

  deleteCertification(id: number) {
    const dialogRef = this.dialog.open(ModalComponent, {
      data: {
        action: 'delete',
        subject: 'certification'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loader.started = true;
        this.certificationsService.delete(id).subscribe({
            next: () => {
                this.openSnackBar('Certification deleted successfully', 'Close');
                this.loadCertifications();
            },
            error: () => {
                 this.openSnackBar('Error deleting certification', 'Close');
                 this.loader.started = false;
            }
        })
      }
    });
  }

  openCertificationDialog(action: string, obj: any): void {
    obj.action = action;
    const dialogRef = this.dialog.open(AppCertificationModalComponent, {
      data: obj,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.event !== 'Cancel') {
          this.handleCertificationAction(result);
      }
    });
  }

  handleCertificationAction(result: any) {
     const { event, data, file } = result;
     this.loader.started = true;

     if (event === 'Add') {
        const createObs = file
          ? this.certificationsService.uploadAttachment(file).pipe(
              switchMap((uploadRes: any) => {
                  data.attachment_url = uploadRes.url;
                  return this.certificationsService.create(data);
              })
            )
          : this.certificationsService.create(data);

        createObs.subscribe({
            next: () => {
                this.openSnackBar('Certification added successfully', 'Close');
                this.loadCertifications();
            },
             error: (err) => {
                console.error(err);
                this.openSnackBar('Error adding certification', 'Close');
                this.loader.started = false;
            }
        });

     } else if (event === 'Edit') {
        const updateObs = file
          ? this.certificationsService.uploadAttachment(file).pipe(
              switchMap((uploadRes: any) => {
                  data.attachment_url = uploadRes.url;
                  return this.certificationsService.update(data.id, data);
              })
            )
          : this.certificationsService.update(data.id, data);
          
        updateObs.subscribe({
            next: () => {
                this.openSnackBar('Certification updated successfully', 'Close');
                this.loadCertifications();
            },
             error: (err) => {
                console.error(err);
                this.openSnackBar('Error updating certification', 'Close');
                this.loader.started = false;
            }
        });
     }
  }

  editCertification(cert: any) {
    this.openCertificationDialog('Edit', cert);
  }

  addCertification() {
    this.openCertificationDialog('Add', {});
  }

  isImage(url: string | undefined): boolean {
    if (!url) return false;
    const imageExtensions = ['jpg', 'jpeg', 'png'];
    const extension = url.split('.').pop()?.toLowerCase();
    return extension ? imageExtensions.includes(extension) : false;
  }

  getFileName(url: string | undefined): string {
    if (!url) return '';
    const decodedUrl = decodeURIComponent(url);
    return decodedUrl.split('/').pop() || 'Attachment';
  }

  setupNameTrimming(form: FormGroup, controlName: string) {
    const control = form.get(controlName);
    if (control) {
      control.valueChanges.subscribe(value => {
        if (value && typeof value === 'string' && value !== value.trim()) {
          control.setValue(value.trim(), { emitEvent: false });
        }
      });
    }
  }
} 