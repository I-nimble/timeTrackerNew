import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/legacy/material.module';

@Component({
  selector: 'app-date-range-dialog',
  templateUrl: './date-range-dialog.component.html',
  standalone: true,
  imports: [MaterialModule, FormsModule],
})
export class AppDateRangeDialogComponent {
  startDate: Date | null = null;
  endDate: Date | null = null;

  constructor(private dialogRef: MatDialogRef<AppDateRangeDialogComponent>) {}

  download() {
    if (this.startDate && this.endDate) {
      this.dialogRef.close({
        firstSelect: this.startDate,
        lastSelect: this.endDate,
      });
    }
  }

  close() {
    this.dialogRef.close();
  }
}
