import {
  Component,
  EventEmitter,
  Inject,
  input,
  Output,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';

import { Subscription } from 'rxjs';

import { SharedModule } from '../legacy/shared.module';

@Component({
  selector: 'app-orgchart-popup',
  templateUrl: './orgchart-popup.component.html',
  standalone: true,
  imports: [SharedModule, MatDialogModule, FormsModule],
  styleUrls: ['./orgchart-popup.component.scss'],
})
export class OrgchartPopupComponent implements OnInit {
  private routerSubscription?: Subscription;
  selected: any;
  otherPosition = false;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private router: Router,
    private dialog: MatDialog,
  ) {}
  ngOnInit(): void {
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.closePopup();
      }
    });
    this.filterPositionsByDepartment();
  }

  filterPositionsByDepartment() {
    if (this.data.department_id) {
      this.data.positions = this.data.positions.filter(
        (pos: any) => pos.department_id === this.data.department_id,
      );
    }
  }

  positionSelection(event: any): void {
    this.selected = this.data.positions.find(
      (pos: any) => pos.id === event.value,
    );
    if (event.value == 0) {
      this.selected = null;
      this.otherPosition = true;
    } else {
      this.otherPosition = false;
    }
  }

  departmentSelection(event: any): void {
    this.selected = this.data.departments.find(
      (dept: any) => dept.id === event.value,
    );
  }

  closePopup(): void {
    this.dialog.closeAll();
  }
}
