import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { AuthService } from 'src/app/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-side-forgot-password',
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './side-forgot-password.component.html',
})
export class AppSideForgotPasswordComponent {
  options = this.settings.getOptions();
  assetPath = '/assets/images/backgrounds/password-bg.png';
  constructor(
    private settings: CoreService, 
    private router: Router, 
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  get f() {
    return this.form.controls;
  }

  showCheckEmail = false;
  submittedEmail = '';

  submit() {
    if (this.form.valid && this.form.value.email) {
      this.authService.forgotPassword(this.form.value.email).subscribe({
        next: () => {
          this.submittedEmail = this.form.value.email!;
          this.showCheckEmail = true;
          this.openSnackBar('Password reset email sent', 'Close');
        },
        error: (res:any) => {
          console.error(res.error.message, res.error);
          this.openSnackBar(res.error.message, 'Close');
        },
      });
    }
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
