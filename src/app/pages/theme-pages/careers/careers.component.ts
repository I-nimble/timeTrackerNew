import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  FormGroup,
  FormArray,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { Highlight, HighlightAuto } from 'ngx-highlightjs';
import { HighlightLineNumbers } from 'ngx-highlightjs/line-numbers';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppHeaderComponent } from '../header/header.component';
import { AppFooterComponent } from '../footer/footer.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterLink } from '@angular/router';
import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';
import { AppBlogsComponent } from '../../apps/blogs/blogs.component';
import { CareersService } from 'src/app/services/careers.service';
import { ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { ChangeDetectorRef } from '@angular/core';
import {
    Department,
    FormQuestion,
    Location,
    Position,
    SubmitApplicationPayload
  } from 'src/app/models/Careers';
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
    CommonModule,
    ButtonComponent
  ],
  providers: [
    CareersService
  ],
  templateUrl: './careers.component.html',
  styleUrl: './careers.component.scss',
})
export class AppCareersComponent implements OnInit {
  @ViewChild('stepperRef') stepperRef!: MatStepper;
  personalInfo = this.fb.group({
    managementStyle: ['', Validators.required],
    feedbackStyle: ['', Validators.required],
    communicationStyle: ['', Validators.required],
    conflictHandling: ['', Validators.required],
    acceptOtherCommunications: [true, Validators.requiredTrue],
    acceptPersonalData: [true, Validators.requiredTrue],
  });
  formSubmitted = false;
  options = {
    locations: [] as Location[],
    positions: [] as Position[],
    departments: [] as Department[],
  };
  questions: FormQuestion[] = [];
  paginatedQuestions: FormQuestion[][] = [];
  answersForm: FormGroup = this.fb.group({});
  careerForm: FormGroup;
  combinedApplyOptions: { id: number; name: string; type: 'position' | 'department' }[] = [];
  selectedLocationId: number | null = null;
  selectedPositionId: number | null = null;
  selectedDepartmentId: number | null = null;
  fileAnswers: { [key: number]: File } = {};

  constructor(
    private fb: FormBuilder,
    public snackBar: MatSnackBar,
    private careersService: CareersService,
    private cdr: ChangeDetectorRef
  ) {
    this.careerForm = this.fb.group({
      location_id: [null, Validators.required],
      apply_to: [null, Validators.required],
    });
  }

  ngOnInit() {
    this.careersService.getApplicationOptions().subscribe(data => {
      this.options.locations = data.locations;
      this.options.positions = data.roles.positions;
      this.options.departments = data.roles.departments;

      this.combinedApplyOptions = [
        ...this.options.positions.map(pos => ({
          id: pos.id,
          name: pos.title,
          type: 'position' as const,
        })),
        ...this.options.departments.map(dep => ({
          id: dep.id,
          name: dep.name,
          type: 'department' as const,
        })),
      ];

      this.filteredLocations = [...this.options.locations];
      this.filteredApplyOptions = [...this.combinedApplyOptions];
    });
  }

  filteredLocations: Location[] = [];
  filteredApplyOptions: { id: number; name: string; type: 'position' | 'department' }[] = [];

  getFormControl(questionId: number): FormControl {
    return this.answersForm.get('question_' + questionId) as FormControl;
  }

  onLocationChange() {
    const locationId = this.careerForm.get('location_id')?.value;

    if (!locationId) {
      this.filteredApplyOptions = [...this.combinedApplyOptions];
      this.careerForm.get('apply_to')?.setValue(null);
      return;
    }

    this.careersService.getFilteredApplicationOptions(locationId).subscribe(data => {
      const positions = data.roles?.positions || [];
      const departments = data.roles?.departments || [];

      this.filteredApplyOptions = [
        ...positions.map((pos: Position) => ({
          id: pos.id,
          name: pos.title,
          type: 'position' as const,
        })),
        ...departments.map((dep: Department) => ({
          id: dep.id,
          name: dep.name,
          type: 'department' as const,
        })),
      ];

      const currentApplyTo = this.careerForm.get('apply_to')?.value;
      if (!this.filteredApplyOptions.find(o => o.id === currentApplyTo)) {
        this.careerForm.get('apply_to')?.setValue(null);
        this.questions = [];
        this.paginatedQuestions = [];
      }
    });
  }

  onRoleChange() {
    const applyToId = this.careerForm.get('apply_to')?.value;
    if (!applyToId) {
      this.filteredLocations = [...this.options.locations];
      this.careerForm.get('location_id')?.setValue(null);
      this.questions = [];
      this.paginatedQuestions = [];
      return;
    }

    const selectedOption = this.combinedApplyOptions.find(o => o.id === applyToId);
    if (!selectedOption) return;

    this.careersService.getFilteredApplicationOptions(undefined, selectedOption.type, selectedOption.id).subscribe(data => {
      this.filteredLocations = data.locations || [];

      const currentLocation = this.careerForm.get('location_id')?.value;
      if (!this.filteredLocations.find(l => l.id === currentLocation)) {
        this.careerForm.get('location_id')?.setValue(null);
        this.questions = [];
        this.paginatedQuestions = [];
      }
    });
  }

  loadQuestionsIfReady() {
    const locationId = this.careerForm.get('location_id')?.value;
    const applyToId = this.careerForm.get('apply_to')?.value;
    if (!locationId || !applyToId) {
      this.questions = [];
      this.paginatedQuestions = [];
      return;
    }
    const selectedOption = this.combinedApplyOptions.find(o => o.id === applyToId);
    if (!selectedOption) return;

    if (selectedOption.type === 'position') {
      this.careersService.getFormQuestions(locationId, selectedOption.id, undefined)
        .subscribe(questions => this.processQuestions(questions));
    } else if (selectedOption.type === 'department') {
      this.careersService.getFormQuestions(locationId, undefined, selectedOption.id)
        .subscribe(questions => this.processQuestions(questions));
    }
  }

  onSelectionChange(): void {
    const locationId = this.careerForm.get('location_id')?.value;
    const applyToId = this.careerForm.get('apply_to')?.value;

    if (!locationId || !applyToId) return;

    const selectedOption = this.combinedApplyOptions.find(o => o.id === applyToId);
    if (!selectedOption) return;

    if (selectedOption.type === 'position') {
      this.careersService
        .getFormQuestions(locationId, selectedOption.id, undefined)
        .subscribe(questions => this.processQuestions(questions));
    } else if (selectedOption.type === 'department') {
      this.careersService
        .getFormQuestions(locationId, undefined, selectedOption.id)
        .subscribe(questions => this.processQuestions(questions));
    }
  }

  onFileChange(event: Event, questionId: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.fileAnswers[questionId] = file;
  
    const control = this.answersForm.get('question_' + questionId);
    if (control) {
      control.setValue(file.name);
      control.markAsTouched();
      control.updateValueAndValidity();
    }
  }

  processQuestions(questions: FormQuestion[]): void {
    if (!questions || questions.length === 0) {
      this.questions = [];
      this.answersForm = this.fb.group({});
      return;
    }

    const parsedQuestions = questions.map(q => ({
      ...q,
      options: (q.input_type === 'select' || q.input_type === 'radio') && q.select_options
        ? JSON.parse(q.select_options)
        : []
    }));

    
  this.questions = parsedQuestions;
  const group: { [key: string]: any } = {};

  parsedQuestions.forEach(q => {
    const controlName = 'question_' + q.id;

    const validators = q.required ? [Validators.required] : [];
      group[controlName] = this.fb.control('', validators);
    });

    this.answersForm = this.fb.group(group);

    if (this.stepperRef) {
      setTimeout(() => this.stepperRef.reset());
    }
    this.cdr.detectChanges();
  }

  loadQuestions(): void {
    if (!this.selectedLocationId || (!this.selectedPositionId && !this.selectedDepartmentId)) return;

    this.careersService.getFormQuestions(
      this.selectedLocationId,
      this.selectedPositionId || undefined,
      this.selectedDepartmentId || undefined
    ).subscribe((questions: FormQuestion[]) => {
      this.processQuestions(questions);
      this.questions = questions;
      this.answersForm = this.fb.group({});
      questions.forEach(q => {
        this.answersForm.addControl('question_' + q.id, this.fb.control('', Validators.required));
      });
    });
  }

  submitCareerApplication(): void {
/*    if (this.careerForm.invalid || this.answersForm.invalid) {
      this.snackBar.open('Please fill out all required fields', 'Close', { duration: 3000 });
      return;
    } */
    const formData = new FormData();

    const applyToId = this.careerForm.get('apply_to')?.value;
    const locationId = this.careerForm.get('location_id')?.value;

    const selectedOption = this.combinedApplyOptions.find(o => o.id === applyToId);
    if (selectedOption?.type === 'position') {
      formData.append('position_id', applyToId.toString());
    } else if (selectedOption?.type === 'department') {
      formData.append('department_id', applyToId.toString());
    }

    formData.append('location_id', locationId.toString());

    this.questions.forEach(q => {
      const value = this.answersForm.get('question_' + q.id)?.value;

      if (q.input_type === 'file') {
        const file = this.fileAnswers[q.id];
        if (file) {
          formData.append(`files[${q.id}]`, file);
        }
      } else {
        formData.append(`question_${q.id}`, value || '');
      }
    });
    this.careersService.submitApplicationFormData(formData).subscribe({
      next: () => {
        this.snackBar.open('Application submitted successfully!', 'Close', { duration: 3000 });
        this.careerForm.reset();
        this.answersForm.reset();
        this.formSubmitted = true;
      },
      error: () => {
        this.snackBar.open('Error submitting application', 'Close', { duration: 3000 });
      }
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
