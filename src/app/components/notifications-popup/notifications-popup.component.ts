import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Notification } from 'src/app/models/Notifications';

@Component({
  selector: 'app-notifications-popup',
  templateUrl: './notifications-popup.component.html',
  standalone: true,
  imports: [MatDialogModule, CommonModule],
  styleUrls: ['./notifications-popup.component.scss'],
})
export class NotificationsPopupComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { notifications: Notification[] }) {}

  getIcon(typeId: number): string {
    switch (typeId) {
      case 1: return 'fa-solid fa-circle-info';
      case 2: return 'fa-solid fa-bell';
      case 3: return 'fa-solid fa-envelope';
      case 4: return 'fa-solid fa-clock';
      case 5: return 'fa-solid fa-calendar-check';
      case 6: return 'fa-solid fa-briefcase';
      default: return 'fa-solid fa-circle-info';
    }
  }

  getColor(typeId: number): string {
    switch (typeId) {
      case 1: return '#92b46c';
      case 2: return '#d0bf45';
      case 3: return '#92b46c';
      case 4: return '#d0bf45';
      case 5: return '#d0bf45';
      case 6: return '#b54343';
      default: return '#cccccc';
    }
  }
}