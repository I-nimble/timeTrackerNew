import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { AuthService } from 'src/app/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './reset-password.component.html',
})
export class AppResetPasswordComponent implements OnInit {
  form: FormGroup;
  token: string = '';
  email: string = '';
  hideConfirm = true;
  invalidLink = false;
  showImage = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.form = new FormGroup({
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
    });
  }

  ngOnInit() {  
    this.checkWindowSize();
    this.authService.logout(false);
    
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';
      if (!this.token || !this.email) {
        this.invalidLink = true;
      }
    });
  }

  get f() {
    return this.form.controls;
  }

  @HostListener('window:resize')
  onResize() {
    this.checkWindowSize();
  }
  
  checkWindowSize() {
    this.showImage = window.innerWidth >= 1280;
  }

  submit() {
    if (this.invalidLink) {
      this.openSnackBar('Invalid or missing reset link.', 'Close');
      return;
    }
    if (this.form.invalid) {
      this.openSnackBar('Please fill all fields correctly.', 'Close');
      return;
    }
    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.openSnackBar('Passwords do not match.', 'Close');
      return;
    }
    this.authService.resetPassword(this.token, this.email, this.form.value.password).subscribe({
      next: () => {
        this.openSnackBar('Password reset successfully.', 'Close');
        this.router.navigate(['/authentication/login']);
      },
      error: (error: any) => {
        console.error(error)
        this.openSnackBar(error?.error?.message || 'Error resetting password.', 'Close');
      }
    });
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}