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
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-intake-form',
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
  templateUrl: './intake-form.component.html',
  styleUrl: './intake-form.component.scss',
})
export class AppIntakeFormComponent implements OnInit {
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

  constructor(
    private fb: FormBuilder,
    public snackBar: MatSnackBar,
    private intakeService: IntakeService,
    private positionsService: PositionsService
  ) {
    this.filteredCompetencies = this.competencyCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
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

  sendForm() {
    if (!this.intakeForm.get('contactInfo.phone')?.valid) {
      this.openSnackBar('Please enter a valid phone number', 'Close');
      return;
    }
    if (!this.intakeForm.get('contactInfo.email')?.valid) {
      this.openSnackBar('Please enter a valid email address', 'Close');
      return;
    }
    if (!this.intakeForm.valid) {
      this.openSnackBar('Fill all the required fields', 'Close');
      return;
    }
    if (!this.intakeForm.get('termsInfo.acceptOtherCommunications')?.valid || !this.intakeForm.get('termsInfo.acceptPersonalData')?.valid) {
      this.openSnackBar('Please accept the terms and conditions', 'Close');
      return;
    }

    const formValue = this.intakeForm.value;
    const data = {
      ...formValue.contactInfo,
      ...formValue.positionInfo,
      ...formValue.scheduleInfo,
      ...formValue.termsInfo
    };
    this.intakeService.submitIntake(data).subscribe({
      next: () => {
        this.openSnackBar('Form submitted successfully', 'Close');
        this.formSubmitted = true;
        this.intakeForm.reset();
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