import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { ViewportScroller, CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterLink } from '@angular/router';
import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';
import { AppBlogsComponent } from '../../apps/blogs/blogs.component';
import { AppFooterComponent } from '../footer/footer.component';
import { AppIntakeFormComponent } from '../../intake/intake-form.component';
import { AppHeaderComponent } from '../header/header.component';
import { trigger, transition, style, animate } from '@angular/animations';

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
  selector: 'app-products',
  standalone: true,
  imports: [
    MaterialModule,
    TablerIconsModule,
    RouterLink,
    BrandingComponent,
    AppBlogsComponent,
    AppFooterComponent,
    AppIntakeFormComponent,
    AppHeaderComponent,
    CommonModule,
  ],
  templateUrl: './why-us.component.html',
  animations: [
  trigger('fadeAnimation', [
    transition(':enter', [
      style({ opacity: 0, position: 'absolute', top: 0, left: 0, right: 0 }),
      animate('300ms ease-in', style({ opacity: 1 }))
    ]),
    transition(':leave', [
      animate('300ms ease-out', style({ opacity: 0 }))
    ])
  ])
],
})
export class AppWhyUsComponent {
  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  currentSlide = 0;
  testimonials = [
    {
      id: 1,
      stars: 5,
      text: "We didn’t realize how scattered our operations were until we moved everything into Inimble. One login changed everything—from tracking hours to managing projects.",
      name: 'Steven R.',
      role: 'CEO of a Healthcare Startup',
      image: 'assets/images/profile/testimonial1.png',
    },
    {
      id: 2,
      stars: 5,
      text: "The talent was great, but what really surprised us was the platform. It gave our firm structure we didn’t know we were missing.",
      name: 'Luis G.',
      role: 'CPA & Business Consultant',
      image: 'assets/images/profile/testimonial2.png',
    },
    {
      id: 3,
      stars: 5,
      text: "Our onboarding used to take weeks. With Inimble, new hires are set up and productive within days.",
      name: 'Claudia T.',
      role: 'Managing Partner, Law Firm',
      image: 'assets/images/profile/testimonial3.png',
    },
  ];

  options = this.settings.getOptions();

  constructor(
    private settings: CoreService,
    private scroller: ViewportScroller
  ) {}

  // scroll to demos
  gotoDemos() {
    this.scroller.scrollToAnchor('demos');
  }

  prevSlide(): void {
    this.currentSlide =
      this.currentSlide === 0
        ? this.testimonials.length - 1
        : this.currentSlide - 1;
  }

  nextSlide(): void {
    this.currentSlide =
      this.currentSlide === this.testimonials.length - 1
        ? 0
        : this.currentSlide + 1;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

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
      subtitle: 'New task',
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

  demos: demos[] = [
    {
      id: 1,
      imgSrc: '/assets/images/landingpage/demos/dashboard.png',
      name: 'Performance',
      subtext: '',
      url: 'https://spike-angular-pro-main.netlify.app/dashboards/dashboard1',
    },
    {
      id: 2,
      imgSrc: '/assets/images/landingpage/demos/productivity.png',
      name: 'Productivity',
      subtext: '',
      url: 'https://spike-angular-pro-dark.netlify.app/dashboards/dashboard2',
    },
    {
      id: 5,
      imgSrc: '/assets/images/landingpage/demos/communication.png',
      name: 'Professional & Communication',
      subtext: '',
      url: 'https://spike-angular-pro-horizontal.netlify.app/dashboards/dashboard2',
    },
    {
      id: 3,
      imgSrc: '/assets/images/landingpage/demos/TimeTracker2.png',
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

  features: features[] = [
    {
      id: 1,
      icon: 'wand',
      title: 'Expert recruitment services',
      color: 'primary',
      subtext:
        'Our team of HR professionals recruit the best talent worldwide while also making sure they are the perfect fit for your business.',
    },
    {
      id: 2,
      icon: 'shield-lock',
      title: 'HR integration and management',
      color: 'primary',
      subtext:
        'Once recruited, new team members are smoothly integrated into your remote team through our specialized management tools, focusing on performance, engagement, and collaboration. ',
    },
    {
      id: 3,
      icon: 'archive',
      title: 'Dedicated performance and IT support',
      color: 'primary',
      subtext:
        'Our platform offers ongoing HR management and performance assistance, making sure your team stays productive and performs to the highest level.',
    },
    {
      id: 4,
      icon: 'chart-pie',
      title: 'Integrate tools for remote work',
      color: 'primary',
      subtext:
        'At inimble we have custom-made all-in-one management tools specifically made for remote team management, including communication, project tracking, and culture building.',
    },
    // {
    //   id: 5,
    //   icon: 'tag',
    //   title: 'Material ',
    //   color: 'success',
    //   subtext: 'Its been made with Material and full responsive layout.',
    // },
    // {
    //   id: 9,
    //   icon: 'adjustments',
    //   title: 'Lots of Chart Options',
    //   color: 'error',
    //   subtext: 'You name it and we have it, Yes lots of variations for Charts.',
    // },
    // {
    //   id: 7,
    //   icon: 'language-katakana',
    //   title: 'i18 Angular',
    //   color: 'secondary',
    //   subtext: 'i18 is a powerful internationalization framework.',
    // },
    // {
    //   id: 13,
    //   icon: 'calendar',
    //   title: 'Calendar Design',
    //   color: 'warning',
    //   subtext: 'Calendar is available with our package & in nice design.',
    // },

    // {
    //   id: 6,
    //   icon: 'diamond',
    //   title: '3400+ Font Icons',
    //   color: 'primary',
    //   subtext: 'Lots of Icon Fonts are included here in the package of Admin.',
    // },
    // {
    //   id: 11,
    //   icon: 'refresh',
    //   title: 'Regular Updates',
    //   color: 'primary',
    //   subtext: 'We are constantly updating our pack with new features..',
    // },
    // {
    //   id: 8,
    //   icon: 'arrows-shuffle',
    //   title: 'Easy to Customize',
    //   color: 'secondary',
    //   subtext: 'Customization will be easy as we understand your pain.',
    // },
    // {
    //   id: 10,
    //   icon: 'layers-intersect',
    //   title: 'Lots of Table Examples',
    //   color: 'success',
    //   subtext: 'Tables are initial requirement and we added them.',
    // },
    // {
    //   id: 14,
    //   icon: 'messages',
    //   title: 'Dedicated Support',
    //   color: 'error',
    //   subtext: 'We believe in supreme support is key and we offer that.',
    // },
    // {
    //   id: 12,
    //   icon: 'book',
    //   title: 'Detailed Documentation',
    //   color: 'warning',
    //   subtext: 'Our Detailed Documentation Ensures Ease of Use',
    // },
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
