import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-to-do-popup',
  standalone: true,
  imports: [MatDialogModule, CommonModule, RouterModule, MaterialModule ],
  templateUrl: './to-do-popup.component.html',
  styleUrl: './to-do-popup.component.scss'
})
export class ToDoPopupComponent {
  private routerSubscription?: Subscription;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, 
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.closePopup();
      }
    });  
  }

  closePopup(): void {
    this.dialog.closeAll();
  }
}
