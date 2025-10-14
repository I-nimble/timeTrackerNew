import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { ViewportScroller, CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterLink } from '@angular/router';
import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';
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
  imports: [MaterialModule, ButtonComponent, TablerIconsModule, RouterLink, BrandingComponent, CommonModule],
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
