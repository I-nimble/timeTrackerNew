import { Component, Inject } from '@angular/core';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MaterialModule } from 'src/app/material.module';

import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MaterialModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
