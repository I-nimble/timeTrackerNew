import { Component, Output, EventEmitter, Input, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CoreService } from 'src/app/services/core.service';
import { ViewportScroller } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from 'src/app/components/button/button.component';
import { PricingCardComponent } from './pricing-card/pricing-card.component';
import { PricingPlan } from './pricing.model';
import { SubscriptionService } from 'src/app/services/subscription.service';
import { Router } from '@angular/router';

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
  selector: 'app-pricing',
  styleUrl: './pricing.component.scss',
  imports: [
    MaterialModule,
    ButtonComponent,
    RouterLink,
    TablerIconsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatButtonModule,
    PricingCardComponent,
  ],
  templateUrl: './pricing.component.html',
})
export class AppPricingComponent implements OnInit {
  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();
  private settings = inject(CoreService);
  private scroller = inject(ViewportScroller);
  private subscriptionService = inject(SubscriptionService);
  private router = inject(Router);

  options = this.settings.getOptions();
  currentPlanTitle: string | null = null;

  plans: PricingPlan[] = [
    {
      title: 'Essential',
      description: 'The foundation of operational success.',
      price: 750,
      priceSuffix: '/month',
      featuresLabel: { prefix: 'Services included when working with inimble' },
      features: [
        {
          label: 'Talent Acquisition',
          description:
            'Elite recruitment with specialized vetting (personality, English proficiency, and skill assessments).',
        },
        {
          label: 'HR Infrastructure',
          description:
            'Full HR management, including biweekly payroll, local tax handling, and legal compliance (Employer of Record).',
        },
        {
          label: 'Inimble Platform Access',
          description:
            'Full use of the app for time tracking, activity monitoring (screenshots and alerts), and productivity management.',
        },
        {
          label: 'Training',
          description:
            'Basic training in legal tools (Filevine, Clio, CRM platforms) and specific roles.',
        },
      ],
      buttonText: 'Start today for free',
      buttonLink: 'https://inimbleapp.com/authentication/login',
    },
    {
      title: 'Professional',
      description: 'Total continuity and support.',
      price: 980,
      priceSuffix: '/month',
      featuresLabel: { prefix: 'Everything included in Essential ', highlight: 'Plus', suffix: ':' },
      features: [
        {
          label: 'Premium Infrastructure',
          description:
            'Physical office space with ergonomic furniture, conference room access, and break room amenities.',
        },
        {
          label: 'Reliability Guarantee',
          description:
            'Full electrical power backup with a generator and triple-redundant high-speed internet to eliminate downtime.',
        },
        {
          label: '24/7 IT Support',
          description:
            'Secure account setup, software installation, system maintenance, and direct IT helpdesk support.',
        },
        {
          label: 'Equipment',
          description: 'Provision of a dedicated laptop and professional headset for the team member.',
        },
        {
          label: 'Retention & Culture',
          description:
            'Employee motivation programs, community-building initiatives, and sentiment tracking to ensure long-term talent retention.',
        },
      ],
      buttonText: 'Start today for free',
      buttonLink: 'https://inimbleapp.com/authentication/login',
      isPopular: true,
    },
    {
      title: 'Executive',
      description: 'Elite and customization.',
      price: 1250,
      priceSuffix: '/month',
      featuresLabel: {
        prefix: 'Everything included in Professional ',
        highlight: 'Plus',
        suffix: ':',
      },
      features: [
        {
          label: 'Specialized Headhunting',
          description:
            'Active search for high-complexity roles that require very specific professional profiles.',
        },
        {
          label: 'Onsite Logistics',
          description:
            'Onsite HR coordinator and IT logistics manager, plus daily transportation benefits for the team.',
        },
        {
          label: 'Direct Supervision',
          description:
            'Includes a Success Manager for direct oversight, ensuring that KPIs and firm standards are consistently met.',
        },
      ],
      buttonText: 'Start today for free',
      buttonLink: 'https://inimbleapp.com/authentication/login',
    },
    {
      title: 'AI Legal Agent',
      description: '24/7 Intelligence.',
      price: 500,
      priceSuffix: '/month',
      featuresLabel: {
        prefix: 'An AI agent trained in ',
        highlight: 'basic',
        suffix: ' legal procedures:',
      },
      features: [
        {
          label: 'Intelligent Intake',
          description: '24/7 intake and consultation services with no wait times for clients.',
        },
        {
          label: 'Real-time Scoring',
          description:
            'Automatic data scoring to immediately prioritize cases or relevant information.',
        },
        {
          label: 'Data Processing',
          description: 'Automatic classification and organization of legal documents and files.',
        },
        {
          label: 'Monitoring & Productivity',
          description:
            'Constant activity tracking and real-time interaction alerts (as per the remote monitoring protocol).',
        },
      ],
      buttonText: 'Start today for free',
      buttonLink: 'https://inimbleapp.com/authentication/login',
    },
  ];

  ngOnInit() {
    this.loadCurrentPlan();
  }

  private loadCurrentPlan() {
    // For now, assume no current plan. In real implementation, check subscription status
    // This would need to be implemented based on user's subscription
    this.currentPlanTitle = null; // Set to plan title if user has active subscription
  }

  onPlanSelected(plan: PricingPlan) {
    const planId = this.getPlanId(plan.title);
    if (planId) {
      this.subscriptionService.createPlanSubscription(planId).subscribe({
        next: (response) => {
          if (response.url) {
            window.location.href = response.url;
          } else if (response.updated) {
            this.router.navigate(['/apps/account-settings'], {
              queryParams: { tab: 0, subscription: 'updated' }
            });
          }
        },
        error: (error) => {
          console.error('Error creating subscription:', error);
        }
      });
    }
  }

  private getPlanId(planTitle: string): number | null {
    const planMap: { [key: string]: number } = {
      'Essential': 2,
      'Professional': 3,
      'Executive': 4,
      'AI Legal Agent': 5
    };
    return planMap[planTitle] || null;
  }

  isCurrentPlan(plan: PricingPlan): boolean {
    return this.currentPlanTitle === plan.title;
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

  demos: demos[] = [];

  appdemos: demos[] = [];

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