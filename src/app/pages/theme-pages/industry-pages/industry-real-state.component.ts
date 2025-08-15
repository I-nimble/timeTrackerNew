import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { ViewportScroller, CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterLink } from '@angular/router';
import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';
import { AppBlogsComponent } from '../../apps/blogs/blogs.component';
import { AppFooterComponent } from '../footer/footer.component';
import { AppFaqComponent } from '../faq/faq.component';
import { AppDiscoveryFormComponent } from '../../discovery/discovery-form.component';
import { AppHeaderComponent } from '../header/header.component';
import { QuickContactModalComponent } from '../../quick-contact-form/quick-contact-form.component';
import { MatDialog } from '@angular/material/dialog';
import { ButtonComponent } from 'src/app/components/button/button.component';

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

interface demos {
  id: number;
  name: string;
  subtext?: string;
  url: string;
  imgSrc: string;
}

interface testimonials {
  id: number;
  name: string;
  subtext: string;
  imgSrc: string;
}

interface features {
  id: number;
  icon: string;
  title: string;
  subtext: string;
  color: string;
}

@Component({
  selector: 'app-real-state',
  standalone: true,
  imports: [
    MaterialModule,
    TablerIconsModule,
    RouterLink,
    BrandingComponent,
    AppBlogsComponent,
    AppFooterComponent,
    CommonModule,
    AppFaqComponent,
    AppDiscoveryFormComponent,
    AppHeaderComponent,
    ButtonComponent
  ],
  templateUrl: './industry-real-state.component.html',
})
export class AppIndustryRealStateComponent {
  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  options = this.settings.getOptions();
  panelOpenState = false;

  constructor(
    private settings: CoreService,
    private scroller: ViewportScroller,
    private dialog: MatDialog
  ) {}

  // scroll to demos
  gotoDemos() {
    this.scroller.scrollToAnchor('demos');
  }

  openQuickContact() {
    this.dialog.open(QuickContactModalComponent, {
      width: '520px',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: false,
      restoreFocus: false,
    });
  }

  cards = [
    {
      title: 'Marketing & Brand',
      subtitle: 'Boost your brand with premium strategies.',
      footer: 'Monday.com',
    },
    {
      title: 'Projects & Tasks',
      subtitle: 'Deliver on time, every time.',
      footer: 'Monday.com',
    },
    {
      title: 'CRM & Sales',
      subtitle: 'Manage clients, prioritize deals.',
      footer: 'Monday.com',
    },
    {
      title: 'IT & Support',
      subtitle: 'Resolve tickets 5x faster.',
      footer: 'Monday.com',
    },
    {
      title: 'Operations & Finance',
      subtitle: 'Scale operations seamlessly.',
      footer: 'Monday.com',
    },
    {
      title: 'Creative & Design',
      subtitle: 'Collaborate and create with ease.',
      footer: 'Monday.com',
    },
  ];

  apps: apps[] = [
    {
      id: 1,
      img: 'https://cdn.prod.website-files.com/681e77695ed0fbc63d5d2ce6/685c3544cf55db0b722bc12f_Bookkeeper.svg',
      title: 'Others',
      subtitle: 'Messages & Emails',
      link: '/apps/chat',
    },
    {
      id: 2,
      img: '/assets/images/svgs/icon-dd-cart.svg',
      title: 'Other legal services',
      subtitle: 'New task',
      link: '/apps/todo',
    },
    {
      id: 3,
      img: '/assets/images/svgs/icon-dd-invoice.svg',
      title: 'Personal Injury',
      subtitle: 'Get latest invoice',
      link: '/apps/invoice',
    },
    {
      id: 4,
      img: '/assets/images/svgs/icon-dd-date.svg',
      title: 'Real estate',
      subtitle: 'Get Dates',
      link: '/apps/calendar',
    },
    {
      id: 5,
      img: '/assets/images/svgs/icon-dd-mobile.svg',
      title: 'Workers',
      subtitle: '2 Unsaved Contacts',
      link: '/apps/contacts',
    },
    // {
    //   id: 6,
    //   img: '/assets/images/svgs/icon-dd-lifebuoy.svg',
    //   title: 'Tickets App',
    //   subtitle: 'Create new ticket',
    //   link: '/apps/tickets',
    // },
    // {
    //   id: 7,
    //   img: '/assets/images/svgs/icon-dd-message-box.svg',
    //   title: 'Email App',
    //   subtitle: 'Get new emails',
    //   link: '/apps/email/inbox',
    // },
    // {
    //   id: 8,
    //   img: '/assets/images/svgs/icon-dd-application.svg',
    //   title: 'Courses',
    //   subtitle: 'Create new course',
    //   link: '/apps/courses',
    // },
  ];

  demos: demos[] = [
    {
      id: 1,
      imgSrc: '/assets/images/landingpage/demos/demo-main.jpg',
      name: 'Performance',
      subtext: '',
      url: 'https://spike-angular-pro-main.netlify.app/dashboards/dashboard1',
    },
    {
      id: 2,
      imgSrc: '/assets/images/landingpage/demos/demo-dark.jpg',
      name: 'Productivity',
      subtext: '',
      url: 'https://spike-angular-pro-dark.netlify.app/dashboards/dashboard2',
    },
    {
      id: 5,
      imgSrc: '/assets/images/landingpage/demos/demo-horizontal.jpg',
      name: 'Professional & Communication',
      subtext: '',
      url: 'https://spike-angular-pro-horizontal.netlify.app/dashboards/dashboard2',
    },
    {
      id: 3,
      imgSrc: '/assets/images/landingpage/demos/demo-rtl.jpg',
      name: 'Premium remote management',
      subtext: '',
      url: 'https://spike-angular-pro-rtl.netlify.app/dashboards/dashboard1',
    },
    // {
    //   id: 4,
    //   imgSrc: '/assets/images/landingpage/demos/demo-minisidebar.jpg',
    //   name: 'Performance',
    //   subtext: '',
    //   url: 'https://spike-angular-pro-minisidebar.netlify.app/dashboards/dashboard1',
    // },
    // {
    //   id: 5,
    //   imgSrc: '/assets/images/landingpage/demos/demo-authguard.jpg',
    //   name: 'Authguard',
    //   subtext: 'Demo',
    //   url: 'https://spike-angular-pro-authguard.netlify.app/authentication/login',
    // },
  ];

  appdemos: demos[] = [
    // {
    //   id: 1,
    //   imgSrc: '/assets/images/landingpage/apps/app-calendar.jpg',
    //   name: 'Calendar',
    //   subtext: 'Application',
    //   url: 'https://spike-angular-pro-main.netlify.app/apps/calendar',
    // },
    // {
    //   id: 2,
    //   imgSrc: '/assets/images/landingpage/apps/app-chat.jpg',
    //   name: 'Chat',
    //   subtext: 'Application',
    //   url: 'https://spike-angular-pro-main.netlify.app/apps/chat',
    // },
    // {
    //   id: 3,
    //   imgSrc: '/assets/images/landingpage/apps/app-contact.jpg',
    //   name: 'Contact',
    //   subtext: 'Application',
    //   url: 'https://spike-angular-pro-main.netlify.app/apps/contacts',
    // },
    // {
    //   id: 4,
    //   imgSrc: '/assets/images/landingpage/apps/app-email.jpg',
    //   name: 'Email',
    //   subtext: 'Application',
    //   url: 'https://spike-angular-pro-main.netlify.app/apps/email/inbox',
    // },
    // {
    //   id: 5,
    //   imgSrc: '/assets/images/landingpage/apps/app-courses.jpg',
    //   name: 'Courses',
    //   subtext: 'Application',
    //   url: 'https://spike-angular-pro-main.netlify.app/apps/courses',
    // },
    // {
    //   id: 6,
    //   imgSrc: '/assets/images/landingpage/apps/app-employee.jpg',
    //   name: 'Employee',
    //   subtext: 'Application',
    //   url: 'https://spike-angular-pro-main.netlify.app/apps/employee',
    // },
    // {
    //   id: 7,
    //   imgSrc: '/assets/images/landingpage/apps/app-note.jpg',
    //   name: 'Notes',
    //   subtext: 'Application',
    //   url: 'https://spike-angular-pro-main.netlify.app/apps/notes',
    // },
    // {
    //   id: 8,
    //   imgSrc: '/assets/images/landingpage/apps/app-ticket.jpg',
    //   name: 'Tickets',
    //   subtext: 'Application',
    //   url: 'https://spike-angular-pro-main.netlify.app/apps/tickets',
    // },
    // {
    //   id: 9,
    //   imgSrc: '/assets/images/landingpage/apps/app-invoice.jpg',
    //   name: 'Invoice',
    //   subtext: 'Application',
    //   url: 'https://spike-angular-pro-main.netlify.app/apps/invoice',
    // },
    // {
    //   id: 10,
    //   imgSrc: '/assets/images/landingpage/apps/app-todo.jpg',
    //   name: 'Todo',
    //   subtext: 'Application',
    //   url: 'https://spike-angular-pro-main.netlify.app/apps/todo',
    // },
    // {
    //   id: 11,
    //   imgSrc: '/assets/images/landingpage/apps/app-taskboard.jpg',
    //   name: 'Taskboard',
    //   subtext: 'Application',
    //   url: 'https://spike-angular-pro-main.netlify.app/apps/taskboard',
    // },
    // {
    //   id: 12,
    //   imgSrc: '/assets/images/landingpage/apps/app-blog.jpg',
    //   name: 'Blog List',
    //   subtext: 'Application',
    //   url: 'https://spike-angular-pro-main.netlify.app/apps/blog/post',
    // },
  ];

  testimonials: testimonials[] = [
    {
      id: 1,
      imgSrc: '/assets/images/profile/user-1.jpg',
      name: 'Jenny Wilson',
      subtext: 'Features avaibility',
    },
    {
      id: 2,
      imgSrc: '/assets/images/profile/user-2.jpg',
      name: 'Minshan Cui',
      subtext: 'Features avaibility',
    },
    {
      id: 3,
      imgSrc: '/assets/images/profile/user-3.jpg',
      name: 'Eminson Mendoza',
      subtext: 'Features avaibility',
    },
  ];

  features: features[] = [
    {
      id: 1,
      icon: 'user-plus',
      title: 'Dedicated remote assistants',
      color: 'primary',
      subtext:
        'Get bilingual professionals trained specifically for your industry needs. Available full-time or part-time.',
    },
    {
      id: 2,
      icon: 'school',
      title: 'Custom training & onboarding',
      color: 'primary',
      subtext:
        'Personalized training programs to ensure seamless integration with your workflows and tools.',
    },
    {
      id: 3,
      icon: 'file-invoice',
      title: 'Legal-compliant payroll & contracts',
      color: 'primary',
      subtext:
        'Full compliance with international labor laws and secure contract management.',
    },
    {
      id: 4,
      icon: 'brand-teams',
      title: 'Built-in task management & communication tools',
      color: 'primary',
      subtext:
        'All-in-one platform for task assignment, progress tracking and team collaboration.',
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
      link: '/authentication/side-login',
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
}
