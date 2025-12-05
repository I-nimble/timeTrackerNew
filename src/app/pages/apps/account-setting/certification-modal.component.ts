import { Component, Inject, Optional } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-certification-modal',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TablerIconsModule
  ],
  templateUrl: './certification-modal.component.html',
  providers: [DatePipe]
})
export class AppCertificationModalComponent {
  action: string;
  local_data: any;
  selectedFile: File | null = null;
  fileError: string | null = null;
  dateError: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<AppCertificationModalComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.local_data = { ...data };
    this.action = this.local_data.action;
  }

  doAction(): void {
    if (!this.validateDates()) {
      return;
    }
    this.dialogRef.close({ event: this.action, data: this.local_data, file: this.selectedFile });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }

  handleDateChange(event: any): void {
    this.local_data.date = event.value;
    this.validateDates();
  }

  handleExpirationDateChange(event: any): void {
    this.local_data.expiration_date = event.value;
    this.validateDates();
  }

  onFileSelected(event: any): void {
    this.fileError = null;
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.fileError = 'File size must be less than 10MB.';
        this.selectedFile = null;
        return;
      }

      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];
      
      const extension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'jpg', 'jpeg', 'png'];

      if (!allowedTypes.includes(file.type) && (!extension || !allowedExtensions.includes(extension))) {
        this.fileError = 'Invalid file type. Allowed: PDF, PPT, DOC, JPG, PNG.';
        this.selectedFile = null;
        return;
      }

      this.selectedFile = file;
    }
  }

  removeAttachment(): void {
    this.selectedFile = null;
    this.local_data.attachment_url = null;
    this.fileError = null;
  }

  validateDates(): boolean {
    this.dateError = null;
    if (!this.local_data.date) return true;

    const issueDate = new Date(this.local_data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (issueDate > today) {
      this.dateError = 'Issue date cannot be in the future.';
      return false;
    }

    if (this.local_data.expiration_date) {
      const expirationDate = new Date(this.local_data.expiration_date);
      if (expirationDate < issueDate) {
        this.dateError = 'Expiration date cannot be before issue date.';
        return false;
      }
    }
    return true;
  }
}
