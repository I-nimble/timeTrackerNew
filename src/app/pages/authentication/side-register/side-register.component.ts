import { Component, HostBinding, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
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
import { Router, RouterModule, ActivatedRoute, RouterLink } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../../services/auth.service';
import { Login, SignUp } from 'src/app/models/Auth';
import { WebSocketService } from 'src/app/services/socket/web-socket.service';
import { NotificationStore } from 'src/app/stores/notification.store';
import { NotificationsService } from 'src/app/services/notifications.service';
import { PositionsService } from 'src/app/services/positions.service';
import { EntriesService } from 'src/app/services/entries.service';
import { NgIf, CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { SignupDataService } from 'src/app/models/SignupData.model';
import { UsersService } from 'src/app/services/users.service';
import { CompaniesService } from 'src/app/services/companies.service';
import { CometChatService } from 'src/app/services/apps/chat/chat.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { Loader } from 'src/app/app.models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApplicationsService } from 'src/app/services/applications.service';
import { DepartmentsService } from 'src/app/services/departments.service';

@Component({
  selector: 'app-side-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    BrandingComponent,
    NgIf,
    RouterLink
  ],
  providers: [
    AuthService,
    WebSocketService
  ],
  templateUrl: './side-register.component.html',
  styleUrls: ['./side-register.component.scss']
})
export class AppSideRegisterComponent {
  options = this.settings.getOptions();
  assetPath = 'assets/images/login.png';
  registerClientForm = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)], [this.emailTakenValidator()]],
    name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    company_name: ['', [Validators.required], [this.companyExistsValidator()]],
    departments: [[''], [Validators.required]],
    otherDepartment: [''],
    countryCode: ['+1', Validators.required],
    phone: ['', [Validators.pattern(/^\d{7,11}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    google_user_id: [''],
  }, { validators: this.crossFieldValidator() });
  registerInvitedTeamMemberForm = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)], [this.emailTakenValidator()]],
    name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    company: ['', [Validators.required]],
    position: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    hourly_rate: [0, [Validators.min(0), Validators.max(1000)]],
    google_user_id: [''],
  });
  registerTeamMemberForm: FormGroup = this.fb.group({
    location: ['', Validators.required],
    role: ['', Validators.required],
    email: ['', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)], [this.emailTakenValidator()]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    appliedWhere: ['', Validators.required],
    referred: ['no', Validators.required],
    referredName: [''],
    fullName: ['', Validators.required],
    age: ['', [Validators.required, Validators.min(18)]],
    contactPhone: ['', [Validators.required, Validators.pattern(/^\+?\d{7,15}$/)]],
    additionalPhone: ['', [Validators.pattern(/^\+?\d{7,15}$/)]],
    currentResidence: ['', Validators.required],
    address: ['', Validators.required],
    children: ['0', Validators.required],
    englishLevel: ['', Validators.required],
    competencies: ['', Validators.required],
    technicalSkills: ['', Validators.required],
    techProficiency: ['', [Validators.required, Validators.min(1), Validators.max(10)]],
    educationHistory: ['', Validators.required],
    workExperience: ['', Validators.required],
    workReferences: ['', Validators.required],
    hobbies: ['', Validators.required],
    resume: [null, [Validators.required, this.maxFileSizeValidator(10 * 1024 * 1024 * 1024)]],
    picture: [null, [this.maxFileSizeValidator(10 * 1024 * 1024 * 1024)]],
    google_user_id: [''],
  });
  userRole: string = '3';
  companyId: string = '';
  companies: any[] = [];
  positions: any[] = [];
  locations: any[] = [];
  careerRoles: any[] = [{
    title: "Virtual Assistant",
    position_id: 16
  }, 
  {
    title: "IT and Technology",
    position_id: 41
  }];
  englishLevels = ['Beginner', 'Intermediate', 'Advanced'];
  isRegisterFormVisible: boolean = false;
  hasInvitation: boolean = false;
  departmentsOptions: any = [];
  selectedDepartments: any[] = [];
  otherDepartment: string = '';
  signedWithGoogleClicked: boolean = false;

  constructor(
    private settings: CoreService,
    private router: Router,
    private fb: FormBuilder,
    public snackBar: MatSnackBar,
    private companiesService: CompaniesService,
    private authService: AuthService,
    private socketService: WebSocketService,
    private notificationsService: NotificationsService,
    private entriesService: EntriesService,
    private route: ActivatedRoute,
    private positionsService: PositionsService,
    private employeesService: EmployeesService,
    private chatService: CometChatService,
    private applicationsService: ApplicationsService,
    private usersService: UsersService,
    private departmentsService: DepartmentsService,
    private cdr: ChangeDetectorRef,
  ) {
    this.getCompanies();
    this.getPositions();
    this.getDepartments();

    this.route.queryParams.subscribe((params: any) => {
      if (params['company_id']) this.companyId = params['company_id'];
      if (params['user_role']) this.userRole = params['user_role'];
      if (this.userRole == '2' && this.companyId) {
        this.hasInvitation = true;
        this.registerInvitedTeamMemberForm.patchValue({
          company: this.companyId,
          email: params['email'],
          name: params['name'].split(' ')[0],
          last_name: params['name'].split(' ')[1] || '',
          hourly_rate: params['hr'],
        });
        this.showRegisterForm(this.userRole);
      }
    });

    this.registerClientForm.get('departments')?.valueChanges.subscribe(() => {
      this.registerClientForm.updateValueAndValidity();
    });

    this.registerClientForm.get('otherDepartment')?.valueChanges.subscribe(() => {
      this.registerClientForm.updateValueAndValidity();
    });
  }

  emailTakenValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) {
        return Promise.resolve(null);
      }
      return new Promise(resolve => {
        this.authService.checkEmailExists(control.value).subscribe(
          (exists: boolean) => {
            resolve(exists ? { emailTaken: true } : null);
          },
          () => resolve(null)
        );
      });
    };
  }

  crossFieldValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const departments = formGroup.get('departments')?.value;
      const otherDepartment = formGroup.get('otherDepartment')?.value;

      if (departments && Array.isArray(departments) && departments.includes('Other')) {
        if (!otherDepartment || otherDepartment.trim() === '') {
          formGroup.get('otherDepartment')?.setErrors({ required: true });
          return { otherDepartmentRequired: true };
        } else {
          formGroup.get('otherDepartment')?.setErrors(null);
        }
      } else {
        formGroup.get('otherDepartment')?.setErrors(null);
      }

      return null;
    };
  }

  companyExistsValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) {
        return Promise.resolve(null);
      }
      return new Promise(resolve => {
        this.companiesService.checkCompanyExists(control.value).subscribe(
          ({ exists }: { exists: boolean }) => {
            resolve(exists ? { companyExists: true } : null);
          },
          () => resolve(null)
        );
      });
    };
  }

  getLocations() {
    this.applicationsService.getLocations().subscribe((locations: any) => {
      this.locations = locations;
    });
  }

  showRegisterForm(userRole: string) {
    this.isRegisterFormVisible = true;
    this.userRole = userRole;
    if (userRole === '2' && !this.hasInvitation) {
      this.getLocations();
      this.setupConditionalValidation();
    }
  }

  private setupConditionalValidation() {
    if (!this.registerTeamMemberForm) return;

    const referredControl = this.registerTeamMemberForm?.get('referred');
    if (referredControl) {
      referredControl.valueChanges.subscribe(value => {
        if (value === 'yes') {
          this.registerTeamMemberForm?.get('referredName')?.setValidators(Validators.required);
        } else {
          this.registerTeamMemberForm?.get('referredName')?.clearValidators();
        }
        this.registerTeamMemberForm?.get('referredName')?.updateValueAndValidity();
      });
    }

    const locationControl = this.registerTeamMemberForm?.get('location');
    if (locationControl) {
      locationControl.valueChanges.subscribe(() => this.updateConditionalControls());
    }
    const roleControl = this.registerTeamMemberForm?.get('role');
    if (roleControl) {
      roleControl.valueChanges.subscribe(() => this.updateConditionalControls());
    }
  }

  private updateConditionalControls() {
    const locationControl = this.registerTeamMemberForm.get('location');
    const roleControl = this.registerTeamMemberForm.get('role');
    if (locationControl && roleControl) {
      const location = locationControl.value;
      const role = roleControl.value;

      ['availability', 'salaryRange', 'portfolio', 'programmingLanguages'].forEach(ctrl => {
        (this.registerTeamMemberForm as FormGroup<any>).removeControl(ctrl);
      });

      if (!location || !role) return;

      if (role.title === 'Virtual Assistant') {
        (this.registerTeamMemberForm as FormGroup<any>).addControl(
          'availability',
          this.fb.control('', [Validators.required, this.mustBeYesValidator()])
        );
      } else if (role.title === 'IT and Technology' && location !== 'Medellin') {
        (this.registerTeamMemberForm as FormGroup<any>).addControl(
          'availability',
          this.fb.control('', [Validators.required, this.mustBeYesValidator()])
        );
      }

      if (location && role) {
        (this.registerTeamMemberForm as FormGroup<any>).addControl(
          'salaryRange',
          this.fb.control('', [Validators.required, this.mustBeYesValidator()])
        );
      }

      if (role.title === 'Virtual Assistant') {
        (this.registerTeamMemberForm as FormGroup<any>).addControl('portfolio', this.fb.control(null, this.maxFileSizeValidator(10 * 1024 * 1024 * 1024)));
      }

      if (role.title === 'IT and Technology' && location !== 'Medellin') {
        (this.registerTeamMemberForm as FormGroup<any>).addControl('programmingLanguages', this.fb.control('', Validators.required));
      }
    }
  }

  getSalaryRangeText(): string {
    const locationControl = this.registerTeamMemberForm.get('location');
    const roleControl = this.registerTeamMemberForm.get('role');

    if (locationControl && roleControl) {
      const location = locationControl.value;
      const role = roleControl.value;

      if (location === 'Maracaibo') {
        return role.title === 'Virtual Assistant'
          ? '$480-$560 USD'
          : '$400-$900 USD';
      } else if (location === 'Medellin') {
        return '$700-$800 USD';
      }
      return '$400-$900 USD';
    }
    return '';
  }

  onFileChange(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (file.size > 10737418240) {
        this.registerTeamMemberForm.get(controlName)?.setErrors({ maxFileSize: true });
      } else {
        this.registerTeamMemberForm.get(controlName)?.setValue(file);
      }
      this.registerTeamMemberForm.get(controlName)?.updateValueAndValidity();
    }
  }


  maxFileSizeValidator(maxSizeBytes: number): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null;
      }

      const file = control.value as File;
      if (file.size > maxSizeBytes) {
        return {
          maxFileSize: {
            requiredSize: maxSizeBytes,
            actualSize: file.size,
            message: `File size exceeds the maximum allowed size of ${this.formatFileSize(maxSizeBytes)}`
          }
        };
      }
      return null;
    };
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getCompanies() {
    this.companiesService.getCompanies().subscribe((companies: any) => {
      this.companies = companies;
    });
  }

  getPositions() {
    this.positionsService.get().subscribe((positions: any) => {
      this.positions = positions;
    });
  }

  get getCompanyName() {
    if (!this.companyId) return '';
    return this.companies.find((c: any) => c.id = this.companyId).name;
  }

  get f() {
    return this.registerClientForm.controls;
  }

  getDepartments() {
    this.departmentsService.get().subscribe((departments: any) => {
      const activeDepartments = departments.filter((d: any) => d.active === 1);
      this.departmentsOptions = [...activeDepartments, { id: -1, name: 'Other' }];
    })
  }

  hasOtherDepartment(): boolean {
    return this.selectedDepartments.some(dept => dept.name === 'Other');
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  // googleSignUp() {
  //   this.authService.singUpWithGoogle().subscribe((data) => {
  //     if (this.userRole === '3') {
  //       this.registerClientForm.patchValue({
  //         name: data.name.split(' ')[0],
  //         last_name: data.name.split(' ')[1] || '',
  //         email: data.email,
  //         google_user_id: data.googleId,
  //       });
  //     }
  //     else if (this.userRole === '2' && this.hasInvitation) {
  //       this.registerInvitedTeamMemberForm.patchValue({
  //         name: data.name.split(' ')[0],
  //         last_name: data.name.split(' ')[1] || '',
  //         email: data.email,
  //         google_user_id: data.googleId,
  //       });
  //     }
  //     else if (this.userRole === '2') {
  //       this.registerTeamMemberForm.patchValue({
  //         fullName: data.name,
  //         email: data.email,
  //         google_user_id: data.googleId,
  //       });
  //     }
  //     else { return };
  //     this.signedWithGoogleClicked = true;
  //     this.openSnackBar('Google account linked. Please complete the rest of the form.', 'success');
  //   });
  // }

  submit() {
    if (this.userRole === '3') {
      if (!this.registerClientForm.valid) {
        this.openSnackBar('Please fill all the fields correctly', 'error');
        return;
      }

      let phone = this.registerClientForm.value.phone;
      if (phone && this.registerClientForm.controls.phone.valid) {
        phone = `${this.registerClientForm.value.countryCode}${phone}`;
      }

      const clientData = {
        firstName: this.registerClientForm.value.name,
        lastName: this.registerClientForm.value.last_name,
        company: this.registerClientForm.value.company_name,
        departments: this.registerClientForm.value.departments,
        otherDepartment: this.registerClientForm.value.otherDepartment,
        email: this.registerClientForm.value.email,
        phone: phone,
        password: this.registerClientForm.value.password,
        google_user_id: this.registerClientForm.value.google_user_id === '' ? null : this.registerClientForm.value.google_user_id,
      };
      const fullName = this.registerClientForm.value.name + ' ' + this.registerClientForm.value.last_name;

      this.companiesService.createPossible(clientData).subscribe({
        next: () => {
          this.openSnackBar('Your information was sent successfully', 'success');

          this.authService
            .login(clientData.email as string, clientData.password as string)
            .subscribe({
              next: (loginResponse: any) => {
                const id = loginResponse.id;
                const jwt = loginResponse.token;
                const name = loginResponse.username;
                const lastName = loginResponse.last_name;
                const role = loginResponse.role_id;
                const email = loginResponse.email;
                const isOrphan = loginResponse.isOrphan;
                localStorage.setItem('id', id);
                localStorage.setItem('role', role);
                localStorage.setItem('name', name);
                localStorage.setItem('username', name + ' ' + lastName);
                localStorage.setItem('email', email);
                localStorage.setItem('isOrphan', isOrphan);
                this.socketService.socket.emit('client:joinRoom', jwt);
                localStorage.setItem('jwt', jwt);
                this.authService.setUserType(role);
                this.authService.userTypeRouting(role);
                this.notificationsService.loadNotifications();
                this.entriesService.loadEntries();
                this.chatService.initializeCometChat();
                localStorage.setItem('showWelcomePopup', 'true');
              },
              error: (loginError) => {
                this.openSnackBar('Error logging in', 'error');
                console.error(loginError);
                return;
              },
            });
        },
        error: (e) => {
          console.error(e);
          this.openSnackBar(e.error.message, 'error'); // Email already exists
          return;
        },
      })
    }
    else if (this.userRole === '2' && this.hasInvitation) {
      if (!this.registerInvitedTeamMemberForm.valid) {
        this.openSnackBar('Please fill all the fields correctly', 'error');
        return;
      }

      const teamMemberData = {
        name: this.registerInvitedTeamMemberForm.value.name,
        last_name: this.registerInvitedTeamMemberForm.value.last_name,
        email: this.registerInvitedTeamMemberForm.value.email,
        password: this.registerInvitedTeamMemberForm.value.password,
        company_id: this.companyId,
        position_id: this.registerInvitedTeamMemberForm.value.position,
        google_user_id: this.registerInvitedTeamMemberForm.value.google_user_id === '' ? null : this.registerInvitedTeamMemberForm.value.google_user_id,
        hourly_rate: this.registerInvitedTeamMemberForm.value.hourly_rate,
      };

      this.employeesService.registerEmployee(teamMemberData).subscribe({
        next: () => {
          this.openSnackBar('Your registration was successful', 'success');

          this.authService
            .login(teamMemberData.email as string, teamMemberData.password as string)
            .subscribe({
              next: (loginResponse: any) => {
                const jwt = loginResponse.token;
                const name = loginResponse.username;
                const lastName = loginResponse.last_name;
                const role = loginResponse.role_id;
                const email = loginResponse.email;
                const id = loginResponse.id;
                const isOrphan = loginResponse.isOrphan;
                localStorage.setItem('id', id);
                localStorage.setItem('role', role);
                localStorage.setItem('name', name);
                localStorage.setItem('username', name + ' ' + lastName);
                localStorage.setItem('email', email);
                localStorage.setItem('isOrphan', isOrphan);
                this.socketService.socket.emit('client:joinRoom', jwt);
                localStorage.setItem('jwt', jwt);
                this.authService.setUserType(role);
                this.authService.userTypeRouting(role);
                this.notificationsService.loadNotifications();
                this.entriesService.loadEntries();
                localStorage.setItem('showWelcomePopup', 'true');
                this.chatService.initializeCometChat();
              },
              error: (loginError) => {
                this.openSnackBar('Error logging in', 'error');
                console.error(loginError);
                return;
              },
            });
        },
        error: (e: any) => {
          console.error(e);
          this.openSnackBar(e.error.message, 'error'); // Email already exists
          return;
        },
      });
    }
    else if (this.userRole === '2' && !this.hasInvitation) {

      if (!this.registerTeamMemberForm.valid) {
        this.openSnackBar('Please fill all the fields correctly', 'error');
        return;
      }

      if ((this.registerTeamMemberForm.value.availability !== "yes" && this.registerTeamMemberForm.value.role.title !== "IT and Technology") || this.registerTeamMemberForm.value.salaryRange !== "yes") {
        this.openSnackBar('Please accept the availability and salary range conditions', 'error');
        return;
      }

      if (this.registerTeamMemberForm.value.role.title === "IT and Technology" && this.registerTeamMemberForm.value.location === "Medellin") {
        this.openSnackBar('There are no available positions in IT and Technology in Medellin', 'error');
      }

      const teamMemberData = {
        location: this.registerTeamMemberForm.value.location,
        position_id: this.registerTeamMemberForm.value.role.position_id,
        email: this.registerTeamMemberForm.value.email,
        password: this.registerTeamMemberForm.value.password,
        applied_where: this.registerTeamMemberForm.value.appliedWhere,
        referred: this.registerTeamMemberForm.value.referred,
        referrer_name: this.registerTeamMemberForm.value.referredName,
        full_name: this.registerTeamMemberForm.value.fullName,
        age: this.registerTeamMemberForm.value.age,
        contact_phone: this.registerTeamMemberForm.value.contactPhone,
        additional_phone: this.registerTeamMemberForm.value.additionalPhone || '',
        current_residence: this.registerTeamMemberForm.value.currentResidence,
        address: this.registerTeamMemberForm.value.address,
        children: this.registerTeamMemberForm.value.children,
        english_level: this.registerTeamMemberForm.value.englishLevel,
        competencies: this.registerTeamMemberForm.value.competencies,
        technical_skills: this.registerTeamMemberForm.value.technicalSkills,
        tech_proficiency: this.registerTeamMemberForm.value.techProficiency,
        education_history: this.registerTeamMemberForm.value.educationHistory || '',
        work_experience: this.registerTeamMemberForm.value.workExperience || '',
        work_references: this.registerTeamMemberForm.value.workReferences,
        hobbies: this.registerTeamMemberForm.value.hobbies || '',
        availability: this.registerTeamMemberForm.value.availability,
        salary_range: this.registerTeamMemberForm.value.salaryRange,
        programming_languages: this.registerTeamMemberForm.value.programmingLanguages || null,
        resume: this.registerTeamMemberForm.get('resume')?.value || null,
        portfolio: this.registerTeamMemberForm.get('portfolio')?.value || null,
        google_user_id: this.registerTeamMemberForm.value.google_user_id === '' ? null : this.registerTeamMemberForm.value.google_user_id,
      };

      this.usersService.registerOrphanTeamMember(teamMemberData).subscribe({
        next: () => {
          this.openSnackBar('Your registration was successful', 'success');

          this.authService
            .login(teamMemberData.email as string, teamMemberData.password as string)
            .subscribe({
              next: (loginResponse: any) => {
                const jwt = loginResponse.token;
                const name = loginResponse.username;
                const lastName = loginResponse.last_name;
                const role = loginResponse.role_id;
                const email = loginResponse.email;
                const id = loginResponse.id;
                const isOrphan = loginResponse.isOrphan;
                localStorage.setItem('id', id);
                localStorage.setItem('role', role);
                localStorage.setItem('name', name);
                localStorage.setItem('username', name + ' ' + lastName);
                localStorage.setItem('email', email);
                localStorage.setItem('isOrphan', isOrphan);
                this.socketService.socket.emit('client:joinRoom', jwt);
                localStorage.setItem('jwt', jwt);
                this.authService.setUserType(role);
                this.authService.userTypeRouting(role);
                this.notificationsService.loadNotifications();
                this.entriesService.loadEntries();
                localStorage.setItem('showWelcomePopup', 'true');
                this.chatService.initializeCometChat();
              },
              error: (loginError) => {
                this.openSnackBar('Error logging in', 'error');
                console.error(loginError);
                return;
              },
            });
        },
        error: (e: any) => {
          console.error(e);
          this.openSnackBar(e.error.message, 'error');
          return;
        },
      });
    }
  }

  toggleDepartment(dept: any) {
    const idx = this.selectedDepartments.findIndex(d => d.id === dept.id);
    if (idx > -1) {
      this.selectedDepartments.splice(idx, 1);
      if (dept.name === 'Other') this.otherDepartment = '';
    } else {
      this.selectedDepartments.push(dept);
    }

    this.registerClientForm.patchValue({
      departments: this.selectedDepartments.map(d => d.name) || [''],
      otherDepartment: this.otherDepartment
    });
  }
  mustBeYesValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      if (control.value === 'no') {
        return { mustBeYes: true };
      }
      return null;
    };
  }
}
