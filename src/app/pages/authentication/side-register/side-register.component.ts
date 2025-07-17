import { Component, HostBinding, OnInit, inject } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import {
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../../services/auth.service';
import { Login, SignUp } from 'src/app/models/Auth';
import { WebSocketService } from 'src/app/services/socket/web-socket.service';
import { NotificationStore } from 'src/app/stores/notification.store';
import { NotificationsService } from 'src/app/services/notifications.service';
import { EntriesService } from 'src/app/services/entries.service';
import { NgIf } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { SignupDataService } from 'src/app/models/SignupData.model';
import { UsersService } from 'src/app/services/users.service';
import { CompaniesService } from 'src/app/services/companies.service';
import { Loader } from 'src/app/app.models';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-side-register',
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    BrandingComponent,
    NgIf,
  ],
  providers: [
    AuthService,
    WebSocketService
  ],
  templateUrl: './side-register.component.html',
})
export class AppSideRegisterComponent {
  options = this.settings.getOptions();
  assetPath = 'assets/images/login.png';

  constructor(
    private settings: CoreService, 
    private router: Router,
    private fb: FormBuilder,
    public snackBar: MatSnackBar,
    private companiesService: CompaniesService,
    private authService: AuthService,
    private socketService: WebSocketService,
    private notificationsService: NotificationsService,
    private entriesService: EntriesService,
  ) {}

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]], // check if email is taken
    name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    company_name: ['', [Validators.required]],
    countryCode: ['+1', Validators.required],
    phone: ['', [Validators.pattern(/^\d{7,11}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  get f() {
    return this.registerForm.controls;
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  submit() {
    if(!this.registerForm.valid) {
      this.openSnackBar('Please fill all the fields correctly', 'error');
      return;
    }
      
    let phone = this.registerForm.value.phone;
    if (phone && this.registerForm.controls.phone.valid) {
      phone = `${this.registerForm.value.countryCode}${phone}`;
    }

    const clientData = {
      firstName: this.registerForm.value.name,
      lastName: this.registerForm.value.last_name,
      company: this.registerForm.value.company_name,
      email: this.registerForm.value.email,
      phone: phone,
      password: this.registerForm.value.password,
    };

    this.companiesService.createPossible(clientData).subscribe({
      next: (response: any) => {
        this.openSnackBar('Your information was sent successfully', 'success');
        
        this.authService
          .login(clientData.email as string, clientData.password as string)
          .subscribe({
            next: (loginResponse: any) => {
              const jwt = loginResponse.token;
              const name = loginResponse.username;
              const lastName = loginResponse.last_name;
              const role = loginResponse.role_id;
              const email = loginResponse.email;
              localStorage.setItem('role', role);
              localStorage.setItem('name', name);
              localStorage.setItem('username', name + ' ' + lastName);
              localStorage.setItem('email', email);
              this.socketService.socket.emit('client:joinRoom', jwt);
              localStorage.setItem('jwt', jwt);
              this.authService.setUserType(role);
              this.authService.userTypeRouting(role);
              this.notificationsService.loadNotifications();
              this.entriesService.loadEntries();
              localStorage.setItem('showWelcomePopup', 'true');
            },
            error: (loginError) => {
              this.openSnackBar('Error logging in', 'error');
              console.error(loginError);
              return;
            },
          });
      },
      error: (e) => {
        if (e.status === 409) {
          this.openSnackBar(e.error.message, 'error'); // Email already exists
          return;
        }

        this.openSnackBar('There\'s been an error, try again later...', 'error');
        console.error(e);
        return;
      },
    })
  }
}
