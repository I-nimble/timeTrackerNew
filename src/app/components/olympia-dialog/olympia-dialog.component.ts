import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { OlympiaService } from 'src/app/services/olympia.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-olympia-dialog',
  imports: [MatDialogModule, CommonModule, RouterModule, MaterialModule, ReactiveFormsModule ],
  templateUrl: './olympia-dialog.component.html',
  styleUrl: './olympia-dialog.component.scss'
})
export class OlympiaDialogComponent {
  private routerSubscription?: Subscription;
  submitted: boolean = false;
  showForm: boolean = false;
  isSubmitting: boolean = false;
  olympiaForm = this.fb.group({
    full_name: ['', Validators.required],
    birth_date: ['', Validators.required],
    location_state_country: ['', Validators.required],
    application_area: ['', Validators.required],
    take_initiative: ['', Validators.required],
    quick_decisions: ['', Validators.required],
    pressure_leadership: ['', Validators.required],
    express_opinions: ['', Validators.required],
    adapt_changes: ['', Validators.required],
    motivate_team: ['', Validators.required],
    social_interactions: ['', Validators.required],
    good_communicator: ['', Validators.required],
    team_projects: ['', Validators.required],
    help_colleagues: ['', Validators.required],
    workplace_harmony: ['', Validators.required],
    structured_environment: ['', Validators.required],
    team_listener: ['', Validators.required],
    support_transitions: ['', Validators.required],
    long_term_strategies: ['', Validators.required],
    detail_oriented: ['', Validators.required],
    follow_procedures: ['', Validators.required],
    plan_ahead: ['', Validators.required],
    precision_work: ['', Validators.required],
    give_feedback: ['', Validators.required],
    childhood_obedience: ['', Validators.required],
    gets_grumpy: ['', Validators.required],
    laughs_dirty_jokes: ['', Validators.required],
    prejudice_free: ['', Validators.required],
    brags_sometimes: ['', Validators.required],
    immediate_responses: ['', Validators.required],
    procrastinates: ['', Validators.required],
    ever_lied: ['', Validators.required],
    accept_win_over_loss: ['', Validators.required],
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, 
    private dialog: MatDialog,
    private router: Router,
    private fb: FormBuilder,
    private olympiaService: OlympiaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.closePopup();
      }
    });  
  }

  showOlympiaForm(): void {
    this.showForm = true;
  }

  submitOlympiaForm(): void {
    this.isSubmitting = true;
    if (!this.olympiaForm.valid) {
      this.openSnackBar('Please fill all the required fields', 'close');
      this.isSubmitting = false;
      return;
    }

    const data = this.olympiaForm.value;
    this.olympiaService.submitOlympiaForm(data).subscribe({
      next: () => {
        this.openSnackBar('Form submitted successfully', 'close');
        this.isSubmitting = false;
        this.closePopup();
      },
      error: () => {
        this.openSnackBar('Error submitting form', 'close');
        this.isSubmitting = false;
      },
    });
  }

  closePopup(): void {
    this.dialog.closeAll();
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
