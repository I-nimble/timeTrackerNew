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

@Component({
  selector: 'app-events-dialog',
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
    MatCheckboxModule
  ],
})
export class AppEventsDialogComponent {
  eventForm: FormGroup;
  action: 'add' | 'edit' = 'add';

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AppEventsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.action = data?.action ?? 'add';

    this.eventForm = this.fb.group({
      event: [data?.event?.event || '', Validators.required],
      description: [data?.event?.description || '', Validators.required],
      date: [
        data?.event?.date ? this.formatDateForInput(data.event.date) : '',
        Validators.required,
      ],
    });
  }

  formatDateForInput(dateStr: string): string {
    const date = new Date(dateStr);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }

  onSubmit() {
    if (this.eventForm.invalid) return;
    this.dialogRef.close(this.eventForm.value);
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}