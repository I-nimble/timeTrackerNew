import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef  } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-welcome-popup',
  templateUrl: './welcome-popup.component.html',
  styleUrls: ['./welcome-popup.component.scss'],
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
  ],
})
export class WelcomePopupComponent {
  constructor(
    public dialogRef: MatDialogRef<WelcomePopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}