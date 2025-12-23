import { Component, Inject } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [MatDialogModule, MaterialModule, TablerIconsModule],
  templateUrl: './payment-modal.component.html',
  styleUrl: './payment-modal.component.scss',
})
export class PaymentModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
