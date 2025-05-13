import { Component, Inject, inject, SecurityContext } from '@angular/core';
import { MatFormFieldModule } from "@angular/material/form-field";
import { NotificationsService } from 'src/app/services/notifications.service';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { SafeResourceUrl } from '@angular/platform-browser';
import { NotificationStore } from 'src/app/stores/notification.store';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-application-details',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, CommonModule],
  templateUrl: './application-details.component.html',
  styleUrl: './application-details.component.scss',
})
export class ApplicationDetails {
  store = inject(NotificationStore);
  sanitizedFileUrl: SafeResourceUrl | null = null;
  fileExtension: string | null = null;
  loaded: boolean = false;
  
  constructor(
    @Inject(MAT_DIALOG_DATA) 
    public data: any, 
    private notificationService: NotificationsService, 
  ) {}

  ngOnInit(): void {
    this.getResume();
  }

  getResume() {
    this.notificationService.getResume(this.data.applicationId).subscribe({
      next: (resume) => {
        if (resume && resume.url) {
          this.sanitizedFileUrl = resume.url;
          this.fileExtension = resume.extension;
          this.loaded = true;
        }
      },
      error: (err) => {
        console.error(err)
        this.store.addNotifications('Error getting resume', 'error');
        this.loaded = true;
      }
    });
  }
}
