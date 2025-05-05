import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule,MatDialogRef } from '@angular/material/dialog';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationStore } from 'src/app/stores/notification.store';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { RatingsService } from 'src/app/services/ratings.service';
import {MatCheckboxModule} from '@angular/material/checkbox';

@Component({
  selector: 'app-to-do-popup',
  standalone: true,
  imports: [MatCheckboxModule, MatDialogModule, CommonModule, RouterModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule],
  templateUrl: './to-do-form-popup.component.html',
  styleUrl: './to-do-form-popup.component.scss'
})
export class ToDoFormPopupComponent implements OnInit {
  store = inject(NotificationStore);
  priorities: any[] = []; // Store the list of priorities
  private routerSubscription?: Subscription;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, 
    private dialog: MatDialog,
    private router: Router,
    private dialogRef: MatDialogRef<ToDoFormPopupComponent>,
    private ratingsService: RatingsService
  ) {}

  ngOnInit(): void {
    const formGroup = this.data.managementForm.get(this.data.options[0].formGroup) as FormGroup;

    if (!formGroup.contains('goal')) {
      formGroup.addControl('goal', this.data.managementForm.get('ratings.goal'));
    }
    if (!formGroup.contains('recommendations')) {
      formGroup.addControl('recommendations', this.data.managementForm.get('ratings.recommendations'));
    }
    if (!formGroup.contains('due_date')) {
      formGroup.addControl('due_date', this.data.managementForm.get('ratings.due_date'));
    }
    if (!formGroup.contains('priority')) {
      formGroup.addControl('priority', this.data.managementForm.get('ratings.priority'));
    }
    if (!formGroup.contains('recurrent')) {
      formGroup.addControl('recurrent', this.data.managementForm.get('ratings.recurrent'));
    }
    // set recurrent to false if creating a new item
    if(this.data.selectedForm == null) {
      formGroup.get('recurrent')?.setValue(false);
    }

    if (this.data.selectedForm) {
      const selectedForm = { ...this.data.selectedForm };

      // Ensure due_date is displayed as entered by the user
      if (selectedForm.due_date) {
        selectedForm.due_date = selectedForm.due_date.slice(0, 16); // Keep only the "YYYY-MM-DDTHH:mm" part
      }

      formGroup.patchValue(selectedForm);
    }

    this.fetchPriorities();

    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.closePopup();
      }
    });  
  }

  fetchPriorities(): void {
    this.ratingsService.getPriorities().subscribe((priorities: any[]) => {
      this.priorities = priorities;
    });
  }

  closePopup(): void {
    this.dialogRef.close();
  }

  isMobile() {
    if (window.innerWidth <= 576) {
      return true;
    }
    return false;
  }

  submitForm(option: any) {
    const formGroup = this.data.managementForm.get(option.formGroup) as FormGroup;
    const goal = formGroup.get('goal')?.value; 
    const recommendations = formGroup.get('recommendations')?.value; 
    let due_date = formGroup.get('due_date')?.value; 
    const priority = formGroup.get('priority')?.value; 
    const recurrent = formGroup.get('recurrent')?.value;

    this.dialogRef.close({
      action: 'submit',
      option,
      formValue: {
        goal,
        recommendations,
        due_date,
        priority,
        recurrent
      }
    });
  }

  deleteElement(option: any) {
    this.dialogRef.close({ action: 'delete', option });
  }
}
