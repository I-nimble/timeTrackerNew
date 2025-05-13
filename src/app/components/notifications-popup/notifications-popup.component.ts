import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-notifications-popup',
  templateUrl: './notifications-popup.component.html',
  standalone: true,
  imports: [MatDialogModule],
  styleUrls: ['./notifications-popup.component.scss'],
})
export class NotificationsPopupComponent{
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
