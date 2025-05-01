import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule,MatDialogRef } from '@angular/material/dialog';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationStore } from 'src/app/stores/notification.store';

@Component({
  selector: 'app-to-do-popup',
  standalone: true,
  imports: [MatDialogModule, CommonModule, RouterModule ],
  templateUrl: './download-report-popup.component.html',
  styleUrl: './download-report-popup.component.scss'
})
export class DownloadReportPopupComponent {
  store = inject(NotificationStore);
  private routerSubscription?: Subscription;
  public today = new Date();
  public selectedUsers: any[] = [];
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, 
    private dialog: MatDialog,
    private router: Router,
    private dialogRef: MatDialogRef<DownloadReportPopupComponent>
  ) {}

  ngOnInit(): void {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.closePopup();
      }
    });  
  }

  toggleUserSelection(user: any): void {
    const index = this.selectedUsers.findIndex(u => u.id === user.id);
    if(index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(user);
    }
  }

  downloadReport(): void {
    if (this.selectedUsers.length === 0) {
      this.store.addNotifications('Please select at least one user to download the report.', 'error');
      return;
    }

    this.dialogRef.close({
      action: 'download',
      users: this.selectedUsers
    });
  }


  closePopup(): void {
    this.dialog.closeAll();
  }
}
