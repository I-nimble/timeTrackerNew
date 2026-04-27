import { Component, HostBinding, OnInit, OnDestroy, inject, ChangeDetectorRef, ViewChild } from '@angular/core';
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
import { EmployeesService } from 'src/app/services/employees.service';
import { Loader } from 'src/app/app.models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApplicationsService } from 'src/app/services/applications.service';
import { DepartmentsService } from 'src/app/services/departments.service';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RocketChatService } from 'src/app/services/rocket-chat.service';
import { StripeFactoryService } from 'src/app/components/stripe/stripe-factory.service';
import { StripeService } from 'src/app/services/stripe.service';
import { Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { firstValueFrom } from 'rxjs';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatStepper } from '@angular/material/stepper';

@Component({
  selector: 'app-side-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    RouterLink,
    TablerIconsModule
  ],
  providers: [
    AuthService,
  ],
  templateUrl: './side-register.component.html',
  styleUrls: ['./side-register.component.scss']
})
export class AppSideRegisterComponent implements OnInit, OnDestroy {
  options = this.settings.getOptions();
  assetPath = 'assets/images/login.png';
  registerClientForm = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)], [this.emailTakenValidator()]],
    name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    company_name: ['', [Validators.required], [this.companyExistsValidator()]],
    departments: [[''], [Validators.required]],
    otherDepartment: [''],
    phone: ['', [
      Validators.pattern(/^[0-9]+$/),
      Validators.minLength(10),
      Validators.maxLength(15)
    ]],
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
    name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)], [this.emailTakenValidator()]],
    password: ['', [Validators.required, Validators.minLength(8)]],
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
  isImportantInformationVisible: boolean = false;
  hasInvitation: boolean = false;
  departmentsOptions: any = [];
  selectedDepartments: any[] = [];
  otherDepartment: string = '';
  signedWithGoogleClicked: boolean = false;

  @ViewChild('clientStepper') clientStepper?: MatStepper;
  private registrationStripe: Stripe | null = null;
  private registrationElements: StripeElements | null = null;
  private registrationPaymentElement: StripePaymentElement | null = null;
  registrationSetupClientSecret: string | null = null;
  registrationPaymentMethodId: string | null = null;
  isPaymentStepLoading = false;
  isPaymentProcessing = false;
  paymentStepError: string | null = null;

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
    private applicationsService: ApplicationsService,
    private usersService: UsersService,
    private departmentsService: DepartmentsService,
    private cdr: ChangeDetectorRef,
    private rocketChatService: RocketChatService,
    private stripeFactory: StripeFactoryService,
    private stripeService: StripeService,
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

    this.setupNameTrimming(this.registerClientForm, 'name');
    this.setupNameTrimming(this.registerClientForm, 'last_name');

    this.setupNameTrimming(this.registerInvitedTeamMemberForm, 'name');
    this.setupNameTrimming(this.registerInvitedTeamMemberForm, 'last_name');

    this.setupNameTrimming(this.registerTeamMemberForm, 'name');
    this.setupNameTrimming(this.registerTeamMemberForm, 'last_name');
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(async (params) => {
      const clientSecret = params['setup_intent_client_secret'];
      const redirectStatus = params['redirect_status'];
      if (!clientSecret) return;
      if (redirectStatus === 'succeeded') {
        await this.handleStripeReturn(clientSecret);
      } else {
        sessionStorage.removeItem('reg_pending');
        this.openSnackBar('Payment authentication failed. Please try again.', 'error');
      }
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

  showImportantInformation() {
    this.isImportantInformationVisible = true;
  }

  showRegisterForm(userRole: string) {
    this.isRegisterFormVisible = true;
    this.userRole = userRole;
    if (userRole === '2' && !this.hasInvitation) {
      this.getLocations();
    }
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

  async submit() {
    if (this.userRole === '3') {
      if (!this.registerClientForm.valid) {
        this.openSnackBar('Please fill all the fields correctly', 'error');
        return;
      }
      if (this.registrationElements && this.registrationStripe) {
        sessionStorage.setItem('reg_pending', JSON.stringify({
          firstName: this.registerClientForm.value.name,
          lastName: this.registerClientForm.value.last_name,
          company: this.registerClientForm.value.company_name,
          departments: this.registerClientForm.value.departments,
          otherDepartment: this.registerClientForm.value.otherDepartment,
          email: this.registerClientForm.value.email,
          phone: this.registerClientForm.value.phone,
          password: this.registerClientForm.value.password,
          google_user_id: this.registerClientForm.value.google_user_id === '' ? null : this.registerClientForm.value.google_user_id,
        }));
        this.isPaymentProcessing = true;
        this.paymentStepError = null;
        try {
          const { error, setupIntent } = await this.registrationStripe.confirmSetup({
            elements: this.registrationElements,
            confirmParams: {
              return_url: `${window.location.origin}/authentication/register`,
            },
            redirect: 'if_required',
          });
          if (error) {
            sessionStorage.removeItem('reg_pending');
            this.isPaymentProcessing = false;
            this.paymentStepError = error.message ?? 'Payment setup failed.';
            this.openSnackBar(this.paymentStepError ?? 'Payment setup failed.', 'error');
            return;
          }
          sessionStorage.removeItem('reg_pending');
          this.registrationPaymentMethodId = (setupIntent?.payment_method as string) ?? null;
        } catch (err: any) {
          sessionStorage.removeItem('reg_pending');
          this.isPaymentProcessing = false;
          this.paymentStepError = err.message ?? 'Payment setup failed.';
          this.openSnackBar(this.paymentStepError ?? 'Payment setup failed.', 'error');
          return;
        }
      }
      const clientData = {
        firstName: this.registerClientForm.value.name,
        lastName: this.registerClientForm.value.last_name,
        company: this.registerClientForm.value.company_name,
        departments: this.registerClientForm.value.departments,
        otherDepartment: this.registerClientForm.value.otherDepartment,
        email: this.registerClientForm.value.email,
        phone: this.registerClientForm.value.phone,
        password: this.registerClientForm.value.password,
        google_user_id: this.registerClientForm.value.google_user_id === '' ? null : this.registerClientForm.value.google_user_id,
        payment_method_id: this.registrationPaymentMethodId,
      };
      await this.registerAndLogin(clientData);
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
                const chatCredentials = loginResponse.chatCredentials;
                localStorage.setItem('id', id);
                localStorage.setItem('role', role);
                localStorage.setItem('name', name);
                localStorage.setItem('username', name + ' ' + lastName);
                localStorage.setItem('email', email);
                localStorage.setItem('isOrphan', isOrphan);
                localStorage.setItem('jwt', jwt);
                this.rocketChatService.loginWithCredentials(chatCredentials);
                this.socketService.joinAuthenticatedRoom(jwt);
                this.authService.setUserType(role);
                this.authService.userTypeRouting(role);
                this.notificationsService.loadNotifications();
                this.entriesService.loadEntries();
                localStorage.setItem('showWelcomePopup', 'true');
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

      const teamMemberData = {
        name: this.registerTeamMemberForm.value.name,
        last_name: this.registerTeamMemberForm.value.last_name,
        email: this.registerTeamMemberForm.value.email,
        password: this.registerTeamMemberForm.value.password,
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
                const chatCredentials = loginResponse.chatCredentials;
                localStorage.setItem('id', id);
                localStorage.setItem('role', role);
                localStorage.setItem('name', name);
                localStorage.setItem('username', name + ' ' + lastName);
                localStorage.setItem('email', email);
                localStorage.setItem('isOrphan', isOrphan);
                localStorage.setItem('jwt', jwt);
                this.rocketChatService.loginWithCredentials(chatCredentials);
                this.socketService.joinAuthenticatedRoom(jwt);
                this.authService.setUserType(role);
                this.authService.userTypeRouting(role);
                this.notificationsService.loadNotifications();
                this.entriesService.loadEntries();
                localStorage.setItem('showWelcomePopup', 'true');
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

  private async handleStripeReturn(clientSecret: string): Promise<void> {
    const raw = sessionStorage.getItem('reg_pending');
    sessionStorage.removeItem('reg_pending');
    if (!raw) {
      this.openSnackBar('Registration session expired. Please start again.', 'error');
      return;
    }
    try {
      const stripe = await this.stripeFactory.getStripe();
      if (!stripe) throw new Error('Failed to load payment processor.');
      const { setupIntent, error } = await stripe.retrieveSetupIntent(clientSecret);
      if (error || !setupIntent || setupIntent.status !== 'succeeded') {
        throw new Error(error?.message ?? 'Payment authentication failed.');
      }
      const clientData = {
        ...JSON.parse(raw),
        payment_method_id: setupIntent.payment_method as string,
      };
      await this.registerAndLogin(clientData);
    } catch (err: any) {
      this.openSnackBar(err.message ?? 'Registration failed. Please try again.', 'error');
    }
  }

  private registerAndLogin(clientData: any): Promise<void> {
    return new Promise((resolve, reject) => {
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
                const chatCredentials = loginResponse.chatCredentials;
                localStorage.setItem('id', id);
                localStorage.setItem('role', role);
                localStorage.setItem('name', name);
                localStorage.setItem('username', name + ' ' + lastName);
                localStorage.setItem('email', email);
                localStorage.setItem('isOrphan', isOrphan);
                localStorage.setItem('jwt', jwt);
                this.rocketChatService.initializeRocketChat(chatCredentials);
                this.socketService.joinAuthenticatedRoom(jwt);
                this.authService.setUserType(role);
                this.authService.userTypeRouting(String(role));
                this.notificationsService.loadNotifications();
                this.entriesService.loadEntries();
                localStorage.setItem('showWelcomePopup', 'true');
                resolve();
              },
              error: (loginError) => {
                this.openSnackBar('Error logging in', 'error');
                console.error(loginError);
                reject(loginError);
              },
            });
        },
        error: (e) => {
          this.isPaymentProcessing = false;
          console.error(e);
          this.openSnackBar(e.error.message, 'error');
          reject(e);
        },
      });
    });
  }

  ngOnDestroy() {
    if (this.registrationPaymentElement) {
      this.registrationPaymentElement.destroy();
    }
  }

  async onClientStepChange(event: StepperSelectionEvent) {
    if (this.clientStepper && event.selectedStep === this.clientStepper.steps.last) {
      await this.initPaymentStep();
    }
  }

  async initPaymentStep() {
    if (this.registrationSetupClientSecret) return;
    this.isPaymentStepLoading = true;
    this.paymentStepError = null;
    try {
      const email = this.registerClientForm.value.email ?? '';
      const name = `${this.registerClientForm.value.name ?? ''} ${this.registerClientForm.value.last_name ?? ''}`.trim();
      const response = await firstValueFrom(
        this.stripeService.createRegistrationSetupIntent({ email, name }),
      );
      this.registrationSetupClientSecret = response.clientSecret;
      if (!this.registrationStripe) {
        this.registrationStripe = await this.stripeFactory.getStripe();
      }
      if (!this.registrationStripe) {
        this.paymentStepError = 'Failed to load payment processor. Please try again.';
        this.isPaymentStepLoading = false;
        return;
      }
      this.registrationElements = this.registrationStripe.elements({
        clientSecret: this.registrationSetupClientSecret,
        appearance: { theme: 'stripe' as const },
      });
      this.registrationPaymentElement = (this.registrationElements as any).create('payment', {
        layout: { type: 'accordion', defaultCollapsed: false },
      });
      setTimeout(() => {
        const container = document.getElementById('registration-payment-element');
        if (container) {
          this.registrationPaymentElement?.mount(container);
        }
        this.isPaymentStepLoading = false;
      }, 100);
    } catch (error: any) {
      console.error('Error initializing payment step:', error);
      this.paymentStepError = 'Failed to initialize payment. Please check your information.';
      this.isPaymentStepLoading = false;
    }
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
