import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TimezoneService } from 'src/app/services/timezone.service';
import { Timezone } from 'src/app/models/Timezone.model';
import { CustomDatePipe } from 'src/app/services/custom-date.pipe';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { NgForOf, NgIf } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { ModalComponent } from '../confirmation-modal/modal.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-form-dialog',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    NgxMaterialTimepickerModule,
    NgForOf,
    NgIf,
  ],
  templateUrl: './form-dialog.component.html',
  styleUrl: './form-dialog.component.scss',
})
export class FormDialogComponent implements OnInit {
  dialogForm: FormGroup;
  endTimeError: string = '';
  scheduleDisplayed: any = [];

  constructor(
    private timezoneService: TimezoneService,
    private fb: FormBuilder,
    private customDate: CustomDatePipe,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { type: string; fieldData: any }
  ) {
    this.dialogForm = this.fb.group({
      company: this.fb.group({
        name: ['', [Validators.required]],
        description: [''],
        timezone: ['', [Validators.required]],
      }),
      schedule: this.fb.group({
        days: [[], [Validators.required]],
        start_time: ['', [Validators.required]],
        end_time: ['', [Validators.required]],
      }),
    });
  }
  public formFields: any = [];
  timezones: any = [];
  timezoneList = [];
  validForm: boolean = false;
  daysOfWeekOptions: Array<any> = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
    { id: 7, name: 'Sunday' },
  ];

  ngOnInit(): void {
    this.patchValuesIfAny();
    this.getTimezones();

    this.dialogForm.valueChanges.subscribe({
      next: (form: any) => {
        if (this.data.type == 'company') {
          const validTimezone = this.timezoneList.filter(
            (timezone: Timezone) =>
              `${timezone.zoneName}:${timezone.countryCode}` == form.timezone
          );
          if (this.dialogForm.valid && validTimezone.length > 0)
            this.validForm = this.dialogForm.valid;
        } else {
          if (this.dialogForm.get(this.data.type)?.valid) {
            this.validForm = true;
          }
        }
        if (
          this.data.type == 'schedule' &&
          this.dialogForm.get(this.data.type)?.get('end_time')?.value
        ) {
          if (this.dialogForm.get(this.data.type)?.get('start_time')?.value) {
            const start_time = this.dialogForm
              .get(this.data.type)
              ?.get('start_time')?.value;
            const end_time = this.dialogForm
              .get(this.data.type)
              ?.get('end_time')?.value;

            if (
              this.convertTimeValuesIntoDates(start_time) >=
              this.convertTimeValuesIntoDates(end_time)
            ) {
              this.endTimeError = 'End time is earlier than start time';
            } else {
              this.endTimeError = '';
            }
          }
        }
      },
    });

    if (this.data.type == 'company') {
      this.formFields = [
        {
          control: 'name',
          label: 'Company Name',
          type: 'text',
          value: '',
        },
        {
          control: 'description',
          label: 'Short description (optional)',
          type: 'text',
          value: '',
        },
        {
          control: 'timezone',
          label: 'Select a timezone',
          type: 'autocomplete',
          value: '',
          source: 'timezones',
        },
      ];
    } else {
      this.formFields = [
        {
          control: 'days',
          label: 'Select days',
          type: 'select',
          value: '',
          source: 'daysOfWeekOptions',
        },
        {
          control: 'start_time',
          label: 'Start Time',
          type: 'time',
          value: '',
        },
        {
          control: 'end_time',
          label: 'End Time',
          type: 'time',
          value: '',
        },
      ];
    }
  }

  public openConfirmationDialog() {
    const dialog = this.dialog.open(ModalComponent, {
      data: { 
        message: this.endTimeError, 
        action: 'modify', 
        subject: 'schedule',
      },
      hasBackdrop: true,
      backdropClass: 'blur'
    });
    dialog.afterClosed().subscribe((option: boolean) => {
      if (option) {
        this.dialogRef.close(this.dialogForm.value);
      }
    });
  }

  private getTimezones() {
    this.timezoneService.fetchTimezonesApi().subscribe({
      next: (data: any) => {
        if (data.status === 'OK' && Array.isArray(data.zones)) {
          this.timezoneList = data.zones.map((timezone: any) => {
            timezone.fechaActual =
              this.timezoneService.convertTimezone(timezone);
            return timezone;
          });
        } else {
          console.error('Error: Invalid data structure');
        }
        this.timezones = this.timezoneList;
      },
    });
  }

  public search(value: string) {
    const filter = value.toLowerCase();
    this.timezones = this.timezoneList.filter((timezone: any) =>
      timezone.zoneName.toLowerCase().includes(filter)
    );
  }

  public onDayChange(days: any, field: string): void {
    const values = this.daysOfWeekOptions.filter(
      (dayOfWeek: any) => days.indexOf(dayOfWeek.id) > -1
    );
    const dayField = this.getField(field);
    dayField.setValue(values);
  }

  private getField(field: string) {
    return this.dialogForm.get(this.data.type)?.get(field) as FormControl;
  }

  convertTimeValuesIntoDates(timeValue: string): Number {
    const [time, modifier] = timeValue.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier.toLowerCase() == 'pm' && hours !== 12) {
      hours += 12;
    } else if (modifier.toLowerCase() == 'am' && hours === 12) {
      hours = 0;
    }
    const date = new Date().setHours(hours, minutes, 0, 0);
    return date;
  }

  patchValuesIfAny(): void {
    if (!this.data.fieldData) return;

    switch (this.data.type) {
      case 'schedule':
        let formatData = {
          days: this.data.fieldData.days,
          start_time: this.convertIntoReadableString(
            this.data.fieldData.start_time
          ),
          end_time: this.convertIntoReadableString(
            this.data.fieldData.end_time
          ),
        };
        this.scheduleDisplayed = this.data.fieldData.days
          .map((day: any) => day.id)
          .flat();
        this.dialogForm.get(this.data.type)?.setValue(formatData);
        break;
    }
  }

  convertIntoReadableString(timeValue: string): string {
    if (timeValue.includes(' ')) return timeValue;
    let [hours, minutes] = timeValue.split(':').map(Number);
    let modifier = 'PM';
    if (hours > 12) {
      hours -= 12;
    } else if (hours < 12) modifier = 'AM';
    if (hours == 0) {
      hours = 12;
    }
    return `${this.customDate.padzero(hours)}:${this.customDate.padzero(
      minutes
    )} ${modifier}`;
  }
}
