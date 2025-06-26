import {
  Component,
  Output,
  EventEmitter,
  Input,
  signal,
  ViewEncapsulation,
  OnInit,
} from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { MatDialog } from '@angular/material/dialog';
import { getNavItems } from '../sidebar/sidebar-data';
import { TranslateService } from '@ngx-translate/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { AppSettings } from 'src/app/config';
import { CompaniesService } from 'src/app/services/companies.service';
import { environment } from 'src/environments/environment';
import { ApplicationsService } from 'src/app/services/applications.service';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { WebSocketService } from 'src/app/services/socket/web-socket.service';
import { Router } from '@angular/router';

interface notifications {
  id: number;
  img: string;
  title: string;
  subtitle: string;
}

interface profiledd {
  id: number;
  img: string;
  title: string;
  subtitle: string;
  link: string;
  color: string;
}

interface apps {
  id: number;
  img: string;
  title: string;
  subtitle: string;
  link: string;
}

interface quicklinks {
  id: number;
  title: string;
  link: string;
}

@Component({
  selector: 'app-header',
  imports: [
    RouterModule,
    CommonModule,
    NgScrollbarModule,
    TablerIconsModule,
    MaterialModule,
  ],
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent implements OnInit {
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  isCollapse: boolean = false; // Initially hidden
  company: any;
  userName:any;
  companyLogo:any = "assets/images/default-logo.jpg";
  userEmail: any;
  assetsPath: string = environment.assets;
  applications: any[] = [];
  recentNotifications: any[] = [];
  hasPendingNotifications: boolean = false;
  hasNewTalentMatch: boolean = false;
  role: any = localStorage.getItem('role');

  toggleCollpase() {
    this.isCollapse = !this.isCollapse; // Toggle visibility
  }

  showFiller = false;

  public selectedLanguage: any = {
    language: 'English',
    code: 'en',
    type: 'US',
    icon: '/assets/images/flag/icon-flag-en.svg',
  };

  public languages: any[] = [
    {
      language: 'English',
      code: 'en',
      type: 'US',
      icon: '/assets/images/flag/icon-flag-en.svg',
    },
    {
      language: 'Español',
      code: 'es',
      icon: '/assets/images/flag/icon-flag-es.svg',
    },
    {
      language: 'Français',
      code: 'fr',
      icon: '/assets/images/flag/icon-flag-fr.svg',
    },
    {
      language: 'German',
      code: 'de',
      icon: '/assets/images/flag/icon-flag-de.svg',
    },
  ];

  @Output() optionsChange = new EventEmitter<AppSettings>();

  constructor(
    private settings: CoreService,
    private vsidenav: CoreService,
    public dialog: MatDialog,
    private translate: TranslateService,
    private companieService: CompaniesService,
    private applicationsService: ApplicationsService,
    private authService: AuthService,
    public notificationsService: NotificationsService,
    public webSocketService: WebSocketService,
    private router: Router
  ) {
    translate.setDefaultLang('en');
  }

  options = this.settings.getOptions();

  ngOnInit(): void {
    this.getUserData();
    this.getApplications();
    this.loadNotifications();
    this.webSocketService.getNotifications().subscribe(event => {
      if (event === 'update') {
        this.loadNotifications();
      }
    });
    this.webSocketService.getNotifications().subscribe(event => {
      if (event === 'new-talent-match') {
        this.getApplications();
      }
    });
    this.notificationsService.notificationsChanged.subscribe(() => {
      this.loadNotifications();
    });
    this.applicationsService.applicationsSeen$.subscribe(() => {
      this.hasNewTalentMatch = false;
    });
  }

  getUserData(){
    this.userName = localStorage.getItem('username');
    this.userEmail = localStorage.getItem('email');
    const role = localStorage.getItem('role');
    if (role == '3') {
      this.loadCompanyLogo();
      this.companieService.getByOwner().subscribe((company: any) => {
        this.company = company.company.name;
      });
    }
  }

  loadCompanyLogo() {
    this.companieService.getByOwner().subscribe((company) => {
      this.companieService
        .getCompanyLogo(company.company_id)
        .subscribe((logo) => {
          if(logo != null) this.companyLogo = logo;
        });
    });
  }

  getApplications() {
    this.applicationsService.get().subscribe({
      next: (apps) => {
        this.applications = apps;
        const role = localStorage.getItem('role');
        
        let filteredApplications: any[] = this.applicationsService.getFilteredApplicationsByDay(apps);
        
        if(role === '3' && filteredApplications.find((app: any) => app.status_id === 1)) {
          this.hasNewTalentMatch = true;
        } else {
          this.hasNewTalentMatch = false;
        }
      },
    });
  }

  clearTalentMatchNotification() {
    this.hasNewTalentMatch = false;
  }

  formatMessage(message: string): string {
    return message.replace(/\n/g, '<br>')
  }

  openDialog() {
    const dialogRef = this.dialog.open(AppSearchDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }

  changeLanguage(lang: any): void {
    this.translate.use(lang.code);
    this.selectedLanguage = lang;
  }

  setlightDark(theme: string) {
    this.options.theme = theme;
    this.emitOptions();
  }

  private emitOptions() {
    this.optionsChange.emit(this.options);
  }

  logout() {
    this.authService.logout();
  }
  
  notificationIcons = [
    {
      icon: 'fa-solid fa-circle-info',
      color: '#92b46c',
      type: 'Notification'
    },
    {
      icon: 'fa-solid fa-bell',
      color: '#d0bf45',
      type: 'Reminder'
    },
    {
      icon: 'fa-solid fa-envelope',
      color: '#92b46c',
      type: 'Message'
    },
    {
      icon: 'fa-solid fa-clock',
      color: '#d0bf45',
      type: 'Lateness alert'
    },
    {
      icon: 'fa-solid fa-calendar-check',
      color: '#d0bf45',
      type: 'Leave request'
    },
    {
      icon: 'fa-solid fa-briefcase',
      color: '#b54343',
      type: 'Job application'
    }
  ];

  profiledd: profiledd[] = [
    {
      id: 1,
      img: 'wallet',
      color: 'primary',
      title: 'My Profile',
      subtitle: 'Account Settings',
      link: 'apps/account-settings',
    },
    {
      id: 2,
      img: 'shield',
      color: 'success',
      title: 'My Inbox',
      subtitle: 'Notifications',
      link: '/dashboards/notifications',
    },
    ...(Number(this.role) !== 2 ? [{
      id: 3,
      img: 'users',
      color: 'error',
      title: 'My Team',
      subtitle: 'Team members',
      link: '/apps/team',
    }] : []),
  ];

  apps: apps[] = [
    {
      id: 1,
      img: '/assets/images/svgs/icon-dd-chat.svg',
      title: 'Chat Application',
      subtitle: 'Messages & Emails',
      link: '/apps/chat',
    },
    {
      id: 2,
      img: '/assets/images/svgs/icon-dd-cart.svg',
      title: 'Todo App',
      subtitle: 'Completed task',
      link: '/apps/todo',
    },
    {
      id: 3,
      img: '/assets/images/svgs/icon-dd-invoice.svg',
      title: 'Invoice App',
      subtitle: 'Get latest invoice',
      link: '/apps/invoice',
    },
    {
      id: 4,
      img: '/assets/images/svgs/icon-dd-date.svg',
      title: 'Calendar App',
      subtitle: 'Get Dates',
      link: '/apps/calendar',
    },
    {
      id: 5,
      img: '/assets/images/svgs/icon-dd-mobile.svg',
      title: 'Contact Application',
      subtitle: '2 Unsaved Contacts',
      link: '/apps/contacts',
    },
    {
      id: 6,
      img: '/assets/images/svgs/icon-dd-lifebuoy.svg',
      title: 'Tickets App',
      subtitle: 'Create new ticket',
      link: '/apps/tickets',
    },
    {
      id: 7,
      img: '/assets/images/svgs/icon-dd-message-box.svg',
      title: 'Email App',
      subtitle: 'Get new emails',
      link: '/apps/email/inbox',
    },
    {
      id: 8,
      img: '/assets/images/svgs/icon-dd-application.svg',
      title: 'Courses',
      subtitle: 'Create new course',
      link: '/apps/courses',
    },
  ];

  quicklinks: quicklinks[] = [
    {
      id: 1,
      title: 'Pricing Page',
      link: '/theme-pages/pricing',
    },
    {
      id: 2,
      title: 'Authentication Design',
      link: '/authentication/login',
    },
    {
      id: 3,
      title: 'Register Now',
      link: '/authentication/side-register',
    },
    {
      id: 4,
      title: '404 Error Page',
      link: '/authentication/error',
    },
    {
      id: 5,
      title: 'Notes App',
      link: '/apps/notes',
    },
    {
      id: 6,
      title: 'Employee App',
      link: '/apps/employee',
    },
    {
      id: 7,
      title: 'Todo Application',
      link: '/apps/todo',
    },
    {
      id: 8,
      title: 'Treeview',
      link: '/theme-pages/treeview',
    },
  ];

  loadNotifications() {
    this.notificationsService.get().subscribe(notifications => {
      const allNotifications = notifications;
      allNotifications.sort((a:any, b:any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.recentNotifications = allNotifications.slice(0, 5);
      this.hasPendingNotifications = this.recentNotifications?.some(n => n.users_notifications.status === 4);
    });
  }

  addNotification(notification: any) {
    this.recentNotifications.push(notification);
    this.recentNotifications = [...this.recentNotifications]; 
  }

  redirectNotification(notification: any) {
  const message = notification.message?.toLowerCase() || '';

  if (message.includes('clock') || message.includes('late')) {
    this.router.navigate(['/apps/chat/support']);
  } else if (message.includes('board')) {
    this.router.navigate(['/apps/kanban']);
  } else if (notification.type_id === 6) {
    this.router.navigate(['/apps/talent-match']);
  }

  this.notificationsService.update([notification], 2).subscribe(() => {
    this.loadNotifications();
  });
}
}

@Component({
  selector: 'search-dialog',
  imports: [RouterModule, MaterialModule, TablerIconsModule, FormsModule],
  templateUrl: 'search-dialog.component.html',
})
export class AppSearchDialogComponent {
  role: any = localStorage.getItem('role');
  searchText: string = '';
  navItems = getNavItems(this.role);

  navItemsData = getNavItems(this.role).filter((navitem) => navitem.displayName);

  // filtered = this.navItemsData.find((obj) => {
  //   return obj.displayName == this.searchinput;
  // });
}
