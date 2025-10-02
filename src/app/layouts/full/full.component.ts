import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatSidenav, MatSidenavContent } from '@angular/material/sidenav';
import { CoreService } from 'src/app/services/core.service';
import { AppSettings } from 'src/app/config';
import { filter } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';
import { getNavItems } from './vertical/sidebar/sidebar-data';
import { AppNavItemComponent } from './vertical/sidebar/nav-item/nav-item.component';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './vertical/sidebar/sidebar.component';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { TablerIconsModule } from 'angular-tabler-icons';
import { HeaderComponent } from './vertical/header/header.component';
import { AppHorizontalHeaderComponent } from './horizontal/header/header.component';
import { AppHorizontalSidebarComponent } from './horizontal/sidebar/sidebar.component';
import { AppBreadcrumbComponent } from './shared/breadcrumb/breadcrumb.component';
import { CustomizerComponent } from './shared/customizer/customizer.component';
import { BrandingComponent } from './vertical/sidebar/branding.component';
import { AuthService } from 'src/app/services/auth.service';
import { WebSocketService } from 'src/app/services/socket/web-socket.service';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
import { environment } from 'src/environments/environment';
import { UsersService } from 'src/app/services/users.service';

export function jwtOptionsFactory() {
  return {
    tokenGetter: () => localStorage.getItem('jwt'),
    allowedDomains: ['localhost:3000', 'home.inimbleapp.com'],
    disallowedRoutes: ['/auth/signin', '/auth/signup'],
  };
}

const MOBILE_VIEW = 'screen and (max-width: 768px)';
const TABLET_VIEW = 'screen and (min-width: 769px) and (max-width: 1024px)';
const MONITOR_VIEW = 'screen and (min-width: 1024px)';
const BELOWMONITOR = 'screen and (max-width: 1023px)';

// for mobile app sidebar
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
  selector: 'app-full',
  imports: [
    RouterModule,
    AppNavItemComponent,
    MaterialModule,
    CommonModule,
    SidebarComponent,
    NgScrollbarModule,
    TablerIconsModule,
    HeaderComponent,
    AppHorizontalHeaderComponent,
    AppHorizontalSidebarComponent,
    AppBreadcrumbComponent,
    CustomizerComponent,
    BrandingComponent
  ],
  providers: [AuthService,WebSocketService,
        JwtHelperService,
      { provide: JWT_OPTIONS, useFactory: jwtOptionsFactory },],
  standalone: true,
  templateUrl: './full.component.html',
  styleUrl: 'full.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class FullComponent implements OnInit {
  role: any = localStorage.getItem('role');
  navItems = getNavItems(this.role);
  company: any;
  userName:any;
  userId:any;
  profilePicture:any = 'assets/images/default-user-profile-pic.png';
  assetsPath: string = environment.assets;

  @ViewChild('leftsidenav')
  public sidenav: MatSidenav;
  resView = false;
  @ViewChild('content', { static: true }) content!: MatSidenavContent;
  //get options from service
  options = this.settings.getOptions();
  private layoutChangesSubscription = Subscription.EMPTY;
  public isMobileScreen = false;
  private isContentWidthFixed = true;
  private isCollapsedWidthFixed = false;
  private htmlElement!: HTMLHtmlElement;
  @ViewChild('filterNavRight', { static: false }) filterNavRight: MatSidenav;

  get isOver(): boolean {
    return this.isMobileScreen;
  }

  get isTablet(): boolean {
    return this.resView;
  }

  // for mobile app sidebar
  apps: apps[] = [
    // ...(this.role != '1' && this.role != '4' 
    // ? [{
    //     id: 12,
    //     img: '/assets/images/svgs/icon-speech-bubble.svg',
    //     title: 'Help Center',
    //     subtitle: 'Support & FAQs',
    //     link: '/apps/chat/support',
    //   }]
    // : []),
    ...(this.role != '2' ||
    environment.allowedReportEmails.includes(localStorage.getItem('email') || '')
    ? [{
        id: 13,
        img: '/assets/images/svgs/icon-office-bag.svg',
        title: 'Talent Match',
        subtitle: 'Find top talent',
        link: '/apps/talent-match',
      }]
    : []),
    ...(this.role == '3'
    ? [{
        id: 14,
        img: '/assets/images/svgs/icon-account.svg',
        title: 'Expert Match',
        subtitle: 'Connect with experts',
        link: '/apps/expert',
      }]
    : []),
    ...(this.role == '3'
    ? [{
        id: 15,
        img: '/assets/images/svgs/icon-connect.svg',
        title: 'Content Creator',
        subtitle: 'Create and manage content',
        link: '/apps/scrapper',
      }]
    : []),
    {
      id: 1,
      img: '/assets/images/svgs/icon-dd-chat.svg',
      title: 'Chat',
      subtitle: 'Internal communication',
      link: '/apps/chat',
    },
    {
      id: 4,
      img: '/assets/images/svgs/icon-dd-date.svg',
      title: 'Calendar',
      subtitle: 'Manage tasks by date',
      link: '/apps/calendar',
    },
    {
      id: 6,
      img: '/assets/images/svgs/icon-dd-lifebuoy.svg',
      title: 'Kanban',
      subtitle: 'Create tickets',
      link: '/apps/kanban',
    },
    {
      id: 7,
      img: '/assets/images/svgs/icon-dd-application.svg',
      title: 'Time tracker',
      subtitle: 'Track your team time',
      link: 'apps/time-tracker',
    },
    {
      id: 8,
      img: '/assets/images/svgs/icon-dd-invoice.svg',
      title: 'Notes',
      subtitle: 'Keep personal notes',
      link: '/apps/notes',
    },
    {
      id: 10,
      img: '/assets/images/svgs/icon-tasks.svg',
      title: 'To Do',
      subtitle: 'Manage your daily to-dos',
      link: '/apps/todo',
    },
    ...(localStorage.getItem('role') == '3'
    ? [{
        id: 11,
        img: '/assets/images/svgs/icon-inbox.svg',
        title: 'History',
        subtitle: 'Monitor your team’s actions',
        link: '/apps/history',
      }]
    : [])
  ];

  constructor(
    private settings: CoreService,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private usersService: UsersService,
  ) {
    this.htmlElement = document.querySelector('html')!;
    this.layoutChangesSubscription = this.breakpointObserver
      .observe([MOBILE_VIEW, TABLET_VIEW, MONITOR_VIEW, BELOWMONITOR])
      .subscribe((state) => {
        this.isMobileScreen = state.breakpoints[BELOWMONITOR];
        this.resView = state.breakpoints[BELOWMONITOR];
        if (!this.resView && this.filterNavRight && this.filterNavRight.opened) {
          this.filterNavRight.close();
        }

        this.options.sidenavOpened = !this.resView;
      });


    // Initialize project theme with options
    this.receiveOptions(this.options);

    // This is for scroll to top
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((e) => {
        this.content.scrollTo({ top: 0 });
      });
  }

  ngOnInit(): void {
    this.usersService.profilePicUpdated$.subscribe(() => {
      this.loadProfilePicture();
    });
    this.userData();
  }

  ngOnDestroy() {
    this.layoutChangesSubscription.unsubscribe();
  }

  toggleCollapsed() {
    this.isContentWidthFixed = false;
    this.options.sidenavCollapsed = !this.options.sidenavCollapsed;
    this.resetCollapsedState();
  }

  resetCollapsedState(timer = 400) {
    setTimeout(() => this.settings.setOptions(this.options), timer);
  }

  onSidenavClosedStart() {
    this.isContentWidthFixed = false;
  }

  onSidenavOpenedChange(isOpened: boolean) {
    this.isCollapsedWidthFixed = !this.isOver;
    this.options.sidenavOpened = isOpened;
    this.settings.setOptions(this.options);
  }

  receiveOptions(options: AppSettings): void {
    this.toggleDarkTheme(options);
    this.toggleColorsTheme(options);
  }

  toggleDarkTheme(options: AppSettings) {
    if (options.theme === 'dark') {
      this.htmlElement.classList.add('dark-theme');
      this.htmlElement.classList.remove('light-theme');
    } else {
      this.htmlElement.classList.remove('dark-theme');
      this.htmlElement.classList.add('light-theme');
    }
  }

  toggleColorsTheme(options: AppSettings) {
    // Remove any existing theme class dynamically
    this.htmlElement.classList.forEach((className) => {
      if (className.endsWith('_theme')) {
        this.htmlElement.classList.remove(className);
      }
    });

    // Add the selected theme class
    this.htmlElement.classList.add(options.activeTheme);
  }

  logOut(){
    this.authService.logout();
  }

  userData(){
    this.userName = localStorage.getItem('username');
    this.userId = localStorage.getItem('id');
    this.loadProfilePicture();
  }

  loadProfilePicture() {
    this.usersService.getProfilePic(this.userId).subscribe({
      next: (image: any) => {
        if (image != null) {
          this.profilePicture = image;
        } else {
          this.profilePicture = 'assets/images/default-user-profile-pic.png';
        }
      },
    });
  }
}
