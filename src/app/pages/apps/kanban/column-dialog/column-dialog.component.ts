import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-column-dialog',
  templateUrl: './column-dialog.component.html',
  standalone: true,
   imports: [
    MaterialModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TablerIconsModule
  ]
})
export class ColumnDialogComponent {
  nameControl = new FormControl('', Validators.required);

  constructor(
    public dialogRef: MatDialogRef<ColumnDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data.name) {
      this.nameControl.setValue(data.name);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}