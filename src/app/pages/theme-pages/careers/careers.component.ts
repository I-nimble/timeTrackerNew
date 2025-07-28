import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { Highlight, HighlightAuto } from 'ngx-highlightjs';
import { HighlightLineNumbers } from 'ngx-highlightjs/line-numbers';
import { allSkills } from '../../intake/skills';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IntakeService } from 'src/app/services/intake.service';
import { AppHeaderComponent } from '../header/header.component';
import { AppFooterComponent } from '../footer/footer.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterLink } from '@angular/router';
import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';
import { AppBlogsComponent } from '../../apps/blogs/blogs.component';

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

interface features {
  id: number;
  icon: string;
  title: string;
  subtext: string;
  color: string;
}

@Component({
  standalone: true,
  selector: 'app-careers',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    HighlightLineNumbers,
    Highlight,
    HighlightAuto,
    AppHeaderComponent,
    AppFooterComponent,
    TablerIconsModule,
    RouterLink,
    BrandingComponent,
    AppBlogsComponent,
    CommonModule
  ],
  templateUrl: './careers.component.html',
  styleUrl: './careers.component.scss',
})
export class AppCareersComponent implements OnInit {
  contactInfo = this.fb.group({
    companyName: ['', Validators.required],
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    countryCode: ['+1', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^\d{7,11}$/)]
    ],
  });
  roleInfo = this.fb.group({
    jobNameAndDescription: ['', Validators.required],
    requiredSkillsCategory: ['', Validators.required],
    otherSkillsCategory: [''],
    requiredSkills: [[], Validators.required],
    routineOriented: ['', Validators.required],
    socialOriented: ['', Validators.required],
    decisionMaking: ['', Validators.required],
    attentionToDetail: ['', Validators.required],
  });
  personalInfo = this.fb.group({
    managementStyle: ['', Validators.required],
    feedbackStyle: ['', Validators.required],
    communicationStyle: ['', Validators.required],
    conflictHandling: ['', Validators.required],
    acceptOtherCommunications: [true, Validators.requiredTrue],
    acceptPersonalData: [true, Validators.requiredTrue],
  });
  skills: any[] = [];
  formSubmitted = false;
  otherSkillset = false;

  constructor(
    private fb: FormBuilder,
    public snackBar: MatSnackBar,
    private intakeService: IntakeService,
  ) {}

  ngOnInit(): void {
    this.roleInfo.get('requiredSkillsCategory')?.valueChanges.subscribe((value) => {
      this.roleInfo.get('requiredSkills')?.enable();
      this.roleInfo.get('requiredSkills')?.reset();
      if(value === 'other') {
        this.otherSkillset = true;
        this.filterSkillsByCategory()
      }
      else {
        this.otherSkillset = false;
        this.roleInfo.get('otherSkillsCategory')?.reset();
        this.filterSkillsByCategory(value as string)
      }
    });
  }

  filterSkillsByCategory(category?: string) {
    if(category) {
      this.skills = allSkills.filter((skill) => skill.category === category);
    }
    else {
      this.skills = allSkills;
    }
  }

  sendForm() {
    // check if the email is valid
    if (!this.contactInfo.get('email')?.valid) {
      this.openSnackBar('Please enter a valid email address', 'Close');
      return;
    }
    // check if the phone number is valid
    if (!this.contactInfo.get('phone')?.valid) {
      this.openSnackBar('Please enter a valid phone number', 'Close');
      return;
    }
    // check if all required fields are filled
    if (
      !this.contactInfo.valid ||
      !this.roleInfo.valid ||
      !this.personalInfo.valid
    ) {
      this.openSnackBar('Fill all the required fields', 'Close');
      return;
    }
    // check if the terms and conditions are checked
    if (!this.personalInfo.get('acceptOtherCommunications')?.valid || !this.personalInfo.get('acceptPersonalData')?.valid) {
      this.openSnackBar('Please accept the terms and conditions', 'Close');
      return;
    }

    const data = {
      ...this.contactInfo.value,
      ...this.roleInfo.value,
      ...this.personalInfo.value,
    };
    this.intakeService.submit(data).subscribe({
      next: () => {
        this.openSnackBar('Form submitted successfully', 'Close');
        this.formSubmitted = true;
        this.contactInfo.reset();
        this.roleInfo.reset();
        this.personalInfo.reset();
      },
      error: () => {
        this.openSnackBar('Error submitting form', 'Close');
      },
    });
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
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
  ];

  appdemos: demos[] = [
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
