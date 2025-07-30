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
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IntakeService } from 'src/app/services/intake.service';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { QuickContactService } from 'src/app/services/quick-contact.service';

@Component({
  standalone: true,
  selector: 'app-quick-contact-modal',
  templateUrl: './quick-contact-form.component.html',
  styleUrl: './quick-contact-form.component.scss',
  imports: [MaterialModule,
      FormsModule,
      ReactiveFormsModule,
      HighlightLineNumbers,
      Highlight,
      HighlightAuto,
      CommonModule,
    MatDialogModule],
})
export class QuickContactModalComponent {
  contactForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{7,11}$/)]],
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<QuickContactModalComponent>,
    private snackBar: MatSnackBar,
    private quickContactService: QuickContactService,
  ) {}

  submit() {
    if (this.contactForm.valid) {
      this.quickContactService.submit(this.contactForm.value).subscribe({
        next: () => {
          this.snackBar.open('Submitted!', 'Close', { duration: 2000 });
          this.dialogRef.close();
        },
        error: (error) => {
          this.snackBar.open('Error submitting form', 'Close', { duration: 2000 });
          console.error(error);
        },
      });
    } else {
      this.snackBar.open('Please fill all fields correctly', 'Close', { duration: 2000 });
    }
  }

  close() {
    this.dialogRef.close();
  }
}