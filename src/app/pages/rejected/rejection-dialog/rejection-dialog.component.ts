import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApplicationsService } from 'src/app/services/applications.service';
import { MatSnackBar } from '@angular/material/snack-bar';
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
  selector: 'app-rejection-dialog',
  templateUrl: './rejection-dialog.component.html',
  standalone: true,
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
export class RejectionDialogComponent implements OnInit {
  rejectionForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private applicationsService: ApplicationsService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<RejectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.rejectionForm = this.fb.group({
      rejection_reason: [this.data?.candidate?.rejection_reason || ''],
    });
  }

  onReject(): void {
    const reason = this.rejectionForm.value.rejection_reason || null;
    this.applicationsService
      .reject(this.data.candidate.id, reason)
      .subscribe({
        next: () => {
          this.dialogRef.close({ success: true });
        },
        error: () => {
          this.snackBar.open('Error rejecting candidate', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}