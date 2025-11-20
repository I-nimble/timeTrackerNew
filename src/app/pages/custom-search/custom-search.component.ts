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
import { IntakeService } from 'src/app/services/intake.service';
import { PositionsService } from 'src/app/services/positions.service';
import { Positions } from '../../models/Position.model';
import { FormGroup, FormArray, FormControl } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

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
    NgIf
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

  intakeForm = this.fb.group({
    contactInfo: this.fb.group({
      client: ['', Validators.required],
      contactPerson: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      countryCode: ['+1', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{7,11}$/)]],
      website: [''],
      industry: ['', Validators.required],
      numberOfEmployees: [1, [Validators.required, Validators.min(1)]],
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
  showForm: boolean = true;
  showVideo: boolean = false;
  lastIntakeId: number | null = null;
  lastIntakeUuid: number | null = null;
  lastClientName: string = '';

  constructor(
    private fb: FormBuilder,
    public snackBar: MatSnackBar,
    private intakeService: IntakeService,
    private positionsService: PositionsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.filteredCompetencies = this.competencyCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
    this.showForm = !this.router.url.includes('/talent-match');
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

    const uuid = this.route.snapshot.paramMap.get('uuid');
    if (uuid) {
      this.loadIntake(uuid);
    }

    const competencies = this.intakeForm.get('positionInfo.competencies')?.value;
    if (Array.isArray(competencies)) {
      this.selectedCompetencies = competencies;
    }
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
    const competenciesControl = this.intakeForm.get('positionInfo.competencies');
    if (competenciesControl) {
      competenciesControl.setValue(this.selectedCompetencies || []);
      competenciesControl.markAsDirty();
      competenciesControl.updateValueAndValidity();
    }
  }

  loadIntake(uuid: string): void {
    this.intakeService.getIntake(uuid).subscribe({
      next: (data: any) => {
        this.intakeForm.patchValue({
          contactInfo: {
            client: data.client,
            contactPerson: data.contact_person,
            email: data.email,
            countryCode: data.phone?.split(' ')[0] || '+1',
            phone: data.phone?.split(' ')[1] || '',
            website: data.website,
            industry: data.industry,
            numberOfEmployees: data.number_of_employees,
          },
          positionInfo: {
            jobTitle: data.job_title,
            jobDescription: data.job_description,
            kpi: data.kpi,
            competencies: data.competencies?.split(', ') || [],
            trainingContact: data.training_contact,
            itContact: data.it_contact,
            techNeeds: data.tech_needs,
            additionalInfo: data.additional_info,
          },
          scheduleInfo: {
            scheduleDays: data.schedule_days?.split(', ') || [],
            scheduleStart: data.schedule?.split(' - ')[0] || '',
            scheduleEnd: data.schedule?.split(' - ')[1] || '',
            lunchTime: data.lunchtime,
            holidaysObserved: data.holidays_observed?.split(', ') || [],
          },
        });
        this.selectedCompetencies = data.competencies?.split(', ') || [];
        if (data.status == "submitted"){
          this.formSubmitted = true;
        }
        this.lastIntakeId = data.id || null;
        this.lastClientName = (data.client || '').replace(/[^a-zA-Z0-9]/g, '_');
      },
      error: (err) => {
        console.error('Error loading intake:', err);
        this.openSnackBar('Error loading intake data', 'Close');
      },
    });
  }

  saveDraft() {
    const formValue = this.intakeForm.value;
    const data = {
      ...formValue.contactInfo,
      ...formValue.positionInfo,
      ...formValue.scheduleInfo,
      status: 'draft',
      uuid: this.lastIntakeUuid || null,
    };

    this.intakeService.saveIntake(data).subscribe({
      next: (response: any) => {
        this.openSnackBar('Intake saved successfully', 'Close');
        this.lastIntakeId = response?.id || null;
        this.lastIntakeUuid = response?.uuid || this.lastIntakeUuid || null;
        this.lastClientName = (response?.client || data.client || '').replace(/[^a-zA-Z0-9]/g, '_');
      },
      error: () => {
        this.openSnackBar('Error saving intake', 'Close');
      },
    });
  }

  sendForm() {
    if (!this.intakeForm.valid) {
      this.openSnackBar('Please fill all required fields', 'Close');
      return;
    }

    const formValue = this.intakeForm.value;
    const data = {
      ...formValue.contactInfo,
      ...formValue.positionInfo,
      ...formValue.scheduleInfo,
      status: 'submitted',
      uuid: this.lastIntakeUuid || null,
    };

    this.intakeService.saveIntake(data).subscribe({
      next: (response: any) => {
        this.openSnackBar('Form submitted successfully', 'Close');
        this.formSubmitted = true;
        this.lastIntakeId = response?.id || null;
        this.lastIntakeUuid = response?.uuid || this.lastIntakeUuid || null;
        this.lastClientName = (response?.client || data.client || '').replace(/[^a-zA-Z0-9]/g, '_');
        this.intakeForm.reset();
      },
      error: () => {
        this.openSnackBar('Error submitting form', 'Close');
      },
    });
  }

  downloadPdf() {
    if (!this.lastIntakeId) return;
    const filename = `intake_${this.lastClientName || this.lastIntakeId}.pdf`;
    this.intakeService.downloadIntakePdf(this.lastIntakeId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.openSnackBar('Error downloading PDF', 'Close');
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

  get contactInfoGroup(): FormGroup {
    return this.intakeForm.get('contactInfo') as FormGroup;
  }
  get positionInfoGroup(): FormGroup {
    return this.intakeForm.get('positionInfo') as FormGroup;
  }
  get scheduleInfoGroup(): FormGroup {
    return this.intakeForm.get('scheduleInfo') as FormGroup;
  }
  get termsInfoGroup(): FormGroup {
    return this.intakeForm.get('termsInfo') as FormGroup;
  }
}