import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { ViewportScroller, CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterLink } from '@angular/router';
import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';
import { AppFooterComponent } from '../footer/footer.component';
import { MatSidenav } from '@angular/material/sidenav';
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
  selector: 'app-header',
  standalone: true,
  imports: [
    MaterialModule, 
    ButtonComponent, 
    TablerIconsModule, 
    RouterLink, 
    BrandingComponent, 
    AppFooterComponent, 
    CommonModule, 
  ],
  templateUrl: './header.component.html',
})
export class AppHeaderComponent {
  @Input() showToggle = true;
  @Input() showMenus: boolean = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();
  @Input() filterNavRight?: MatSidenav;

  options = this.settings.getOptions();
  panelOpenState = false;

  constructor(
    private settings: CoreService,
    private scroller: ViewportScroller
  ) {}

  // scroll to demos
  gotoDemos() {
    this.scroller.scrollToAnchor('demos');
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
        img: '/assets/images/svgs/Bookkeeper.svg',
        title: 'Others',
        subtitle: 'Tech Startups, Marketing Services, General Business Support',
        link: '/landingpage/industry/other',
      },
      {
        id: 2,
        img: '/assets/images/svgs/Case-Manager.svg',
        title: 'Other legal services',
        subtitle: 'Specialized legal services for companies and individuals. Access case management, consulting, and legal documentation.',
        link: '/landingpage/industry/legal-services',
      },
      {
        id: 3,
        img: '/assets/images/svgs/injury.svg',
        title: 'Personal Injury',
        subtitle: 'Manage personal injury cases, track files, and communicate with affected clients.',
        link: '/landingpage/industry/personal-injury',
      },
      {
        id: 4,
        img: '/assets/images/svgs/real-state.svg',
        title: 'Real estate',
        subtitle: 'Tools for real estate agents: property management, contracts, and client tracking.',
        link: '/landingpage/industry/real-state',
      },
      {
        id: 5,
        img: '/assets/images/svgs/workers-compensation.svg',
        title: 'Workers compensation',
        subtitle: 'Solutions for managing workers compensation cases, file handling, and employee communication.',
        link: '/landingpage/industry/workers-compensation',
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
      subtext: 'Our platform offers ongoing HR management and performance assistance, making sure your team stays productive and performs to the highest level.',
    },
    {
      id: 4,
      icon: 'chart-pie',
      title: 'Integrate tools for remote work',
      color: 'primary',
      subtext: 'At inimble we have custom-made all-in-one management tools specifically made for remote team management, including communication, project tracking, and culture building.',
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
