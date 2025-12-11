import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';

@Component({
  selector: 'app-events-dialog',
  standalone: true,
  templateUrl: './events-dialog.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
})
export class AppEventsDialogComponent {
  eventForm: FormGroup;
  action: 'add' | 'edit' = 'add';
  types = ['online', 'on_site'];
  selectedDate: Date | null = null;
  selectedTime: string | null = null;
  today: Date;
  minTime = '08:00';
  maxTime = '20:00';

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AppEventsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.action = data?.action ?? 'add';
    const now = new Date();
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);
    const initialDate = data?.event?.date ? new Date(data.event.date) : null;
    this.eventForm = this.fb.group({
      event: [data?.event?.event || '', Validators.required],
      description: [data?.event?.description || '', Validators.required],
      type: [data?.event?.type || '', Validators.required],
      date: [
        initialDate && initialDate >= this.today ? initialDate : null,
        [Validators.required, this.minDateValidator(this.today)]
      ],
      time: [initialDate ? this.formatTime(initialDate) : '', Validators.required]
    });
    if (data?.event?.date) {
      const dateObj = new Date(data.event.date);
      this.selectedDate = dateObj;
      this.selectedTime = this.formatTime(dateObj);
    }
  }

  formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  combineDateTime(): Date | null {
    const date = this.eventForm.get('date')?.value;
    const time = this.eventForm.get('time')?.value;
    if (!date || !time) return null;
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    const now = new Date();
    if (combined < now) {
      this.eventForm.get('time')?.setErrors({ pastTime: true });
      return null;
    }
    return combined;
  }

  minDateValidator(minDate: Date) {
    return (control: any) => {
      if (!control.value) return null;
      const selected = new Date(control.value);
      selected.setHours(0, 0, 0, 0);
      return selected < minDate ? { minDate: true } : null;
    };
  }

  onSubmit() {
    if (this.eventForm.invalid) return;
    const combinedDate = this.combineDateTime();
    if (!combinedDate) return;
    const formValue = { ...this.eventForm.value, date: combinedDate };
    this.dialogRef.close(formValue);
  }

  onDateChange(event: any) {
    const date = event.value;
    if (!date) return;
    const selDate = new Date(date);
    selDate.setHours(0, 0, 0, 0);
    if (selDate < new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate())) {
      this.eventForm.get('date')?.setErrors({ minDate: true });
      this.eventForm.get('date')?.setValue(null);
    } else {
      this.eventForm.get('date')?.setErrors(null);
    }
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}