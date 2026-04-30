import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';

import { Loader } from 'src/app/app.models';
import { SignupDataService } from 'src/app/models/SignupData.model';
import { CompaniesService } from 'src/app/services/companies.service';
import { CoreService } from 'src/app/services/core.service';
import { EntriesService } from 'src/app/services/entries.service';
import { LocationService } from 'src/app/services/location.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { RocketChatService } from 'src/app/services/rocket-chat.service';
import { WebSocketService } from 'src/app/services/socket/web-socket.service';
import { UsersService } from 'src/app/services/users.service';
import { NotificationStore } from 'src/app/stores/notification.store';

import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';
import { MaterialModule } from '../../../material.module';
import { AuthService } from '../../../services/auth.service';

export function jwtOptionsFactory() {
  return {
    tokenGetter: () => localStorage.getItem('jwt'),
    allowedDomains: ['localhost:3000', 'home.inimbleapp.com'],
    disallowedRoutes: ['/auth/signin', '/auth/signup'],
  };
}

@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    BrandingComponent,
  ],
  providers: [
    AuthService,
    WebSocketService,
    NotificationsService,
    EntriesService,
    SignupDataService,
    UsersService,
    CompaniesService,
    MatSnackBar,
  ],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent {
  notificationStore = inject(NotificationStore);
  private settings = inject(CoreService);
  private router = inject(Router);
  private socketService = inject(WebSocketService);
  private notificationsService = inject(NotificationsService);
  private entriesService = inject(EntriesService);
  private signupDataService = inject(SignupDataService);
  private employeeService = inject(UsersService);
  private companieService = inject(CompaniesService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private rocketChatService = inject(RocketChatService);
  private locationService = inject(LocationService);

  message: string | null = null;
  passerror = false;
  emailerror = false;
  includeLiveChat = false;
  assetPath = 'assets/images/login.png';
  options = this.settings.getOptions();
  loader: Loader = new Loader(false, false, false);
  route = '';
  loginWithGoogle = false;

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.minLength(6)]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
  });

  get f() {
    return this.form.controls;
  }

  authLogin(googleId?: string) {
    if ((this.form.value.email && this.form.value.password) || googleId) {
      this.authService
        .login(
          this.form.value.email ?? undefined,
          this.form.value.password ?? undefined,
          googleId,
        )
        .subscribe({
          next: (v) => {
            const jwt = v['token'] as string;
            const name = v['username'] as string;
            const last_name = v['last_name'] as string;
            const role = v['role_id'] as string;
            const email = v['email'] as string;
            const id = v['id'] as string;
            const isOrphan = v['isOrphan'] as string;
            const chatCredentials = v['chatCredentials'];
            localStorage.setItem('role', role);
            localStorage.setItem('username', name + ' ' + last_name);
            localStorage.setItem('jwt', jwt);
            localStorage.setItem('email', email);
            localStorage.setItem('id', id);
            localStorage.setItem('isOrphan', isOrphan);

            if (Number(role) === 2) {
              this.locationService.startTracking();
              this.locationService.forceUpdate();
            }
            this.rocketChatService.initializeRocketChat(chatCredentials);
            this.socketService.socket.emit('client:joinRoom', jwt);

            this.authService.setUserType(role);
            this.authService.checkTokenExpiration();
            this.notificationsService.loadNotifications();
            this.entriesService.loadEntries();
            this.authService.userTypeRouting(String(role));

            let visibleChatCollection: HTMLCollectionOf<Element>;
            let hiddenChatCollection: HTMLCollectionOf<Element>;
            const interval = setInterval(() => {
              visibleChatCollection =
                document.getElementsByClassName('widget-visible');
              hiddenChatCollection =
                document.getElementsByClassName('widget-hidden');
              if (
                visibleChatCollection.length > 0 ||
                hiddenChatCollection.length > 0
              ) {
                const bubble =
                  visibleChatCollection.length > 0
                    ? visibleChatCollection[0]
                    : hiddenChatCollection[0];
                if (role == '3') {
                  if (bubble.classList.contains('widget-hidden')) {
                    bubble.classList.remove('widget-hidden');
                    bubble.classList.add('widget-visible');
                  }
                } else {
                  if (bubble.classList.contains('widget-visible')) {
                    bubble.classList.remove('widget-visible');
                    bubble.classList.add('widget-hidden');
                  }
                }
              }
              clearInterval(interval);
            }, 100);
          },
          error: (err: HttpErrorResponse) => {
            this.openSnackBar(
              'Login error: ' + (err.error?.message || ' Please, try again.'),
            );
          },
        });
    } else {
      this.passerror = true;
      this.message = "Fields can't be empty";
      this.notificationStore.addNotifications(this.message);
      this.authError();
      console.log("Fields can't be empty");
    }
  }

  authError() {
    setTimeout(() => {
      this.emailerror = false;
      this.message = null;
      this.passerror = false;
    }, 3000);
  }

  openSnackBar(message: string, action = 'Cerrar') {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }
}
