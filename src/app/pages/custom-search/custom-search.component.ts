import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { Highlight, HighlightAuto } from 'ngx-highlightjs';
import { HighlightLineNumbers } from 'ngx-highlightjs/line-numbers';
import { CommonModule, NgIf } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PositionsService } from 'src/app/services/positions.service';
import { Positions } from '../../models/Position.model';
import { FormGroup, FormControl } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CustomSearchService } from 'src/app/services/custom-search.service';

@Component({
  standalone: true,
  selector: 'app-custom-search',
  imports: [
    MaterialModule,
    HighlightLineNumbers,
    Highlight,
    HighlightAuto,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatChipsModule,
    MatAutocompleteModule,
    RouterLink,
    NgIf,
    MatSlideToggleModule
  ],
  templateUrl: './custom-search.component.html',
  styleUrl: './custom-search.component.scss',
})
export class CustomSearchComponent implements OnInit {
  positionsList: Positions[] = [];
  industries = [
    'Personal Injury',
    'Workers compensation',
    'Other legal services',
    'Real estate',
    'Tech Startup',
    'Marketing Agency',
    'Small Own Business',
    'Other'
  ];
  weekDays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];
  lunchTimes = [
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '1 hour', value: 60 }
  ];

  holidaysList = [
    'New Year\'s Day',
    'Martin Luther King Jr. Day',
    'Presidents\' Day',
    'Memorial Day',
    'Independence Day',
    'Labor Day',
    'Thanksgiving Day',
    'Christmas Day'
  ];
  predefinedCompetencies = [
    'Leadership',
    'Communication',
    'Problem Solving',
    'Teamwork',
    'Technical Writing'
  ];

  selectedCompetencies: string[] = [];
  competencyCtrl = new FormControl('');
  filteredCompetencies: Observable<string[]>;

  clientInfo: any = null;
  isLoading = false;

  customSearchForm = this.fb.group({
    show_info: [true],
    contactInfo: this.fb.group({
      client: [{ value: '', disabled: false }, Validators.required],
      contactPerson: [{ value: '', disabled: false }, Validators.required],
      email: [{ value: '', disabled: false }, [Validators.required, Validators.email]],
      countryCode: [{ value: '+1', disabled: false }, Validators.required],
      phone: [{ value: '', disabled: false }, [Validators.required, Validators.pattern(/^\d{7,11}$/)]],
      website: [{ value: '', disabled: false }],
      industry: [{ value: '', disabled: false }, Validators.required],
      numberOfEmployees: [{ value: 1, disabled: false }, [Validators.required, Validators.min(1)]],
  }),
    positionInfo: this.fb.group({
      jobTitle: ['', Validators.required],
      jobDescription: ['', Validators.required],
      kpi: ['', Validators.required],
      competencies: this.fb.control<string[]>([], [Validators.required]),
      trainingContact: [''],
      itContact: [''],
      techNeeds: [''],
      additionalInfo: ['']
    }),
    scheduleInfo: this.fb.group({
      scheduleDays: [[], Validators.required],
      scheduleStart: ['', Validators.required],
      scheduleEnd: ['', Validators.required],
      lunchTime: [30, Validators.required],
      holidaysObserved: [[]],
    }),
    termsInfo: this.fb.group({
      acceptOtherCommunications: [false, Validators.requiredTrue],
      acceptPersonalData: [false, Validators.requiredTrue]
    })
  });

  formSubmitted = false;
  showVideo: boolean = false;
  lastClientName: string = '';

  constructor(
    private fb: FormBuilder,
    public snackBar: MatSnackBar,
    private customSearchService: CustomSearchService,
    private positionsService: PositionsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.filteredCompetencies = this.competencyCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
    this.showVideo = this.router.url.includes('/talent-match');
  }

  ngOnInit(): void {
    this.positionsService.get().subscribe({
      next: (positions) => {
        this.positionsList = positions;
      },
      error: () => {
        this.openSnackBar('Error loading positions', 'Close');
      }
    });

    this.loadClientInfo();

    this.showInfoControl.valueChanges.subscribe(showInfo => {
      if (showInfo) {
        this.populateClientInfo();
      } else {
        this.clearContactInfo();
      }
    });
  }

  loadClientInfo(): void {
    this.isLoading = true;
    const userId = localStorage.getItem('id');
    
    if (!userId) {
      this.openSnackBar('User ID not found in localStorage', 'Close');
      this.isLoading = false;
      return;
    }

    this.customSearchService.getClientInfo(userId).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          this.clientInfo = response.data;
          if (this.customSearchForm.get('show_info')?.value) {
            this.populateClientInfo();
          }
        } else {
          this.openSnackBar('Error loading client information', 'Close');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading client info:', err);
        this.openSnackBar('Error loading client information', 'Close');
      }
    });
  }

  populateClientInfo(): void {
    if (this.clientInfo) {
      const industry = this.industries.includes(this.clientInfo.industry) 
        ? this.clientInfo.industry 
        : 'Other';

      this.contactInfoGroup.patchValue({
        client: this.clientInfo.client || '',
        contactPerson: this.clientInfo.contact_person || '',
        email: this.clientInfo.email || '',
        countryCode: '+1',
        phone: this.clientInfo.phone || '',
        website: this.clientInfo.website || '',
        industry: industry,
        numberOfEmployees: this.clientInfo.number_of_employees || 1
      });
    }
  }

  clearContactInfo(): void {
    this.contactInfoGroup.patchValue({
      client: '',
      contactPerson: '',
      email: '',
      countryCode: '+1',
      phone: '',
      website: '',
      industry: '',
      numberOfEmployees: 1
    });
  }

  sendForm() {
    if (!this.customSearchForm.valid) {
      this.openSnackBar('Please fill all required fields', 'Close');
      return;
    }

    const formValue = this.customSearchForm.value;
    const data = {
      ...formValue.contactInfo,
      ...formValue.positionInfo,
      ...formValue.scheduleInfo,
    };

    this.customSearchService.saveSubmission(data).subscribe({
      next: (response: any) => {
        this.openSnackBar('Form submitted successfully', 'Close');
        this.formSubmitted = true;
        this.router.navigate([`apps/talent-match`]);
        
      },
      error: (err) => {
        console.error('Error submitting form:', err);
        this.openSnackBar('Error submitting form', 'Close');
      },
    });
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.predefinedCompetencies.filter(comp =>
      comp.toLowerCase().includes(filterValue) &&
      !this.selectedCompetencies.includes(comp)
    );
  }

  isInList(competency: string): boolean {
    return this.predefinedCompetencies.includes(competency);
  }

  addFromDropdown(event: any): void {
    if (this.predefinedCompetencies.includes(event.option.value)) {
      const value = event.option.value;
      if (this.selectedCompetencies.length < 5 && !this.selectedCompetencies.includes(value)) {
        this.selectedCompetencies.push(value);
        this._updateCompetenciesForm();
        this.clearInput();
      }
    }
  }

  addCustomCompetency(): void {    
    const value = (this.competencyCtrl.value || '').trim();
    if (value && this.selectedCompetencies.length < 5 && !this.selectedCompetencies.includes(value)) {
      this.selectedCompetencies.push(value);
      this._updateCompetenciesForm();
      
      this.competencyCtrl.reset('');
      this.competencyCtrl.markAsPristine();
      this.competencyCtrl.updateValueAndValidity();
      
      setTimeout(() => {
        const inputElement = document.querySelector('[matChipInputFor] input') as HTMLInputElement;
        if (inputElement) {
          inputElement.value = '';
        }
      });
    }
  }

  private clearInput(): void {
    this.competencyCtrl.setValue('');
    this.competencyCtrl.updateValueAndValidity();
  }

  removeCompetency(competency: string): void {
    const index = this.selectedCompetencies.indexOf(competency);
    if (index >= 0) {
      this.selectedCompetencies.splice(index, 1);
      this._updateCompetenciesForm();
    }
  }

  private _updateCompetenciesForm() {
    const competenciesControl = this.customSearchForm.get('positionInfo.competencies');
    if (competenciesControl) {
      competenciesControl.setValue(this.selectedCompetencies || []);
      competenciesControl.markAsDirty();
      competenciesControl.updateValueAndValidity();
    }
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  get contactInfoGroup(): FormGroup {
    return this.customSearchForm.get('contactInfo') as FormGroup;
  }
  get positionInfoGroup(): FormGroup {
    return this.customSearchForm.get('positionInfo') as FormGroup;
  }
  get scheduleInfoGroup(): FormGroup {
    return this.customSearchForm.get('scheduleInfo') as FormGroup;
  }
  get termsInfoGroup(): FormGroup {
    return this.customSearchForm.get('termsInfo') as FormGroup;
  }
  get showInfoControl(): FormControl {
    return this.customSearchForm.get('show_info') as FormControl;
  }
}