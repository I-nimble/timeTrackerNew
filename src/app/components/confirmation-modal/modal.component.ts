import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MaterialModule } from 'src/app/material.module';

import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

export interface ConfirmationModalCta {
  label: string;
  route: string | unknown[];
}

export interface ConfirmationModalData {
  // Legacy fields kept for backward compatibility
  action?: string;
  subject?: string;

  // New optional fields
  title?: string;
  body?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  hideConfirm?: boolean;
  hideCancel?: boolean;
  showCloseIcon?: boolean;
  cta?: ConfirmationModalCta;
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MaterialModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationModalData,
    private dialogRef: MatDialogRef<ModalComponent>,
    private router: Router,
  ) {}

  onCtaClick(): void {
    if (!this.data?.cta?.route) {
      return;
    }
    const route = Array.isArray(this.data.cta.route)
      ? this.data.cta.route
      : [this.data.cta.route];
    this.dialogRef.close({ ctaClicked: true });
    this.router.navigate(route);
  }
}
