import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clockout-modal',
  templateUrl: './clockout-modal.component.html',
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    CommonModule,
  ],
})
export class ClockoutModalComponent implements OnDestroy {
  editableStopTimeString: string;

  constructor(
    public dialogRef: MatDialogRef<ClockoutModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentTime?: Date },
    private router: Router
  ) {
    const local = data?.currentTime || new Date();
    const year = local.getFullYear();
    const month = String(local.getMonth() + 1).padStart(2, '0');
    const day = String(local.getDate()).padStart(2, '0');
    const hours = String(local.getHours()).padStart(2, '0');
    const minutes = String(local.getMinutes()).padStart(2, '0');
    this.editableStopTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  confirmClockout(): void {
    const selectedDate = new Date(this.editableStopTimeString);
    this.dialogRef.close({
      action: 'confirm',
      clockoutTime: selectedDate
    });
  }

  ngOnDestroy(): void {}
}