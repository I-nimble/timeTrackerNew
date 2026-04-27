import { NgClass, NgFor, NgIf } from '@angular/common';
import {
  Component,
  OnInit,
  ElementRef,
  inject,
  Input,
  EventEmitter,
  Output,
  OnDestroy,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { Loader } from 'src/app/app.models';
import { ApplicationDetails } from 'src/app/components/application-details/application-details.component';
import { User } from 'src/app/models/User.model';
import { UsersService } from 'src/app/services/users.service';
import { NotificationStore } from 'src/app/stores/notification.store';


import { CompaniesService } from 'src/app/services/companies.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { EntriesService } from 'src/app/services/entries.service';


import { environment } from 'src/environments/environment';
import { PlansService } from 'src/app/services/plans.service';



import { AuthService } from '../../services/auth.service';
import { ClientSidebarComponent } from '../navigation-client-sidebar/navigation-client-sidebar/navigation-client-sidebar.component';
import { NewPasswordComponent } from '../new-password/new-password.component';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    NewPasswordComponent,
    NgIf,
    NgFor,
    ClientSidebarComponent,
    FormsModule,
    NgClass,
    RouterLink,
  ],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit, OnDestroy {
  userService = inject(UsersService);
  authenticated = false;
  isAdmin = false;
  userType: any;
  isActive = false;
  notificationsExpanded = false;
  notificationStore = inject(NotificationStore);
  @Input() selectedUser: any;
  @Output() onSaveSelectedUser: EventEmitter<any> = new EventEmitter<any>();
  @Output() onDeletedUser: EventEmitter<any> = new EventEmitter<any>();
  @Output() onMobileCloseForm: EventEmitter<any> = new EventEmitter<any>();
  applicationDetailsDialog: any = ApplicationDetails;
  img: any;
  email!: string;
  usersList: any;
  company!: any;
  newUser: User = {
    id: '',
    company: {
      id: null,
    },
    name: '',
    last_name: '',
    email: '',
    password: '',
    role: 0,
    active: 1,
  };
  loader: Loader = new Loader(false, false, false);
  title = 'New User';
  userForm!: FormGroup;
  message = '';
  companies: any;
  ADMIN_ROLE = '1';
  EMPLOYEE_ROLE = '2';
  EMPLOYER_ROLE = '3';
  timezones!: any;
  companyLogo: any = null;
  assetsPath: string = environment.assets + '/inimble.png';
  store = inject(NotificationStore);
  plan = false;
  notificationIcons = [
    {
      icon: 'fa-solid fa-circle-info',
      color: '#92b46c',
      type: 'Notification',
    },
    {
      icon: 'fa-solid fa-bell',
      color: '#d0bf45',
      type: 'Reminder',
    },
    {
      icon: 'fa-solid fa-envelope',
      color: '#92b46c',
      type: 'Message',
    },
    {
      icon: 'fa-solid fa-clock',
      color: '#d0bf45',
      type: 'Lateness alert',
    },
    {
      icon: 'fa-solid fa-calendar-check',
      color: '#d0bf45',
      type: 'Leave request',
    },
    {
      icon: 'fa-solid fa-briefcase',
      color: '#b54343',
      type: 'Job application',
    },
  ];

  constructor(
    private authService: AuthService,
    private element: ElementRef,
    private fb: FormBuilder,
    private companiesService: CompaniesService,
    public notificationsService: NotificationsService,
    public entriesService: EntriesService,
    public plansService: PlansService,
    private dialog: MatDialog,
  ) {
    this.authService.isLoggedIn().subscribe((isLogged) => {
      this.authenticated = isLogged;
    });
    this.userForm = this.fb.group({
      password: [''],
      cpassword: [''],
    });
  }

  ngOnInit() {
    document.addEventListener('click', this.hideNav.bind(this));
    this.authService.getUserType().subscribe((role) => {
      this.userType = role;
      if (this.userType === '3') {
        this.loadCompanyLogo();
      }
    });
    this.getEmail();
    this.getUsers();
    const role = localStorage.getItem('role');
    if (role == '1') {
      this.entriesService.loadEntries();
    }
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  loadCompanyLogo() {
    this.companiesService.getByOwner().subscribe((company) => {
      this.company = company.company;
      this.companiesService
        .getCompanyLogo(company.company_id)
        .subscribe((logo) => {
          this.companyLogo = logo;
        });
      this.plansService.getCurrentPlan(company.company_id).subscribe({
        next: (userPlan: any) => {
          const plan = userPlan?.plan;
          this.plan = plan?.name === 'Basic' ? false : true;
        },
        error: (error: any) => {
          this.store.addNotifications('Error loading plan data', 'error');
        },
      });
    });
  }

  public get currentType() {
    return this.authService.userType$;
  }

  closeSession() {
    this.authService.logout();
  }

  toggleMenu() {
    this.isActive = !this.isActive;
  }

  handleDocumentClick(event: MouseEvent) {
    const clickedInside = this.element.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.onDropdownClosed();
    }
  }
  toggleNotifications() {
    this.notificationsExpanded = !this.notificationsExpanded;
    if (!this.notificationsExpanded) {
      const shownNotifications = this.notificationsService.recentNotifications
        .concat(this.notificationsService.earlierNotifications)
        .splice(0, 4);
      this.notificationsService.update(shownNotifications, 2);
    }
  }
  onDropdownClosed() {
    this.notificationsExpanded = false;
  }

  hideNav(event: Event): void {
    if (!this.element.nativeElement.contains(event.target)) {
      this.isActive = false;
    }
  }

  clearSelectedUser() {
    this.userService.resetUser();
  }

  public getEmail() {
    const email = localStorage.getItem('email');
    this.email = email || '';
    return email;
  }

  getUsers() {
    const body = {};
    this.userService.getUsers(body).subscribe({
      next: (users) => {
        this.usersList = users.filter(
          (user: any) => user.active == 1 && user.email === this.email,
        );
        this.newUser = {
          id: this.usersList[0].id,
          name: this.usersList[0].name,
          company: {
            id: this.company?.company_id,
          },
          last_name: this.usersList[0].last_name,
          email: this.usersList[0].email,
          password: '',
          role: this.usersList[0].role,
          active: 1,
        };
      },
      error: (err) => {},
    });
  }

  handlePasswordValidity() {
    const password = this.userForm.get('password');

    if (this.selectedUser && password?.value == '') {
      password?.clearValidators();
    } else {
      password?.setValidators([Validators.required, Validators.minLength(8)]);
    }

    password?.updateValueAndValidity();
  }

  resetForm() {
    this.userForm.get('password')?.setValue('');
    this.userForm.get('cpassword')?.setValue('');
  }

  public submitUserForm() {
    this.getUsers();
    this.loader = new Loader(true, false, false);
    const password = this.userForm.get('password');
    const confirmPassword = this.userForm.get('cpassword');
    if (
      password &&
      confirmPassword &&
      password.value === confirmPassword.value
    ) {
      this.newUser.password = this.userForm.value.password;
      this.userService.createUser(this.newUser).subscribe({
        next: (user) => {
          this.onSaveSelectedUser.emit(user);
          this.loader = new Loader(true, true, false);
          // const message = 'Password Updated Successfully';
          // this.notificationStore.addNotifications(message, 'success');
          this.resetForm();
        },
        error: (err) => {
          this.loader = new Loader(true, false, true);
          this.notificationStore.addNotifications(err.error.message, 'error');
        },
      });
    } else {
      this.loader = new Loader(true, false, true);
      this.notificationStore.addNotifications(
        'Passwords do not match',
        'error',
      );
    }
  }

  ngOnDestroy() {
    // Clean up the event listener when the component is destroyed
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
  }

  newPassword() {
    const dialog = this.dialog.open(NewPasswordComponent, {
      width: '55%',
      minWidth: '320px',
    });
    dialog.afterClosed().subscribe((option: boolean) => {});
  }
}
