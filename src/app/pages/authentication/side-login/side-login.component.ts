import { Component, HostBinding, OnInit, inject } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';
import { environment } from 'src/environments/environment';
import {AuthService} from '../../../services/auth.service';
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
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';

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
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule, BrandingComponent],
  providers: [
    JwtHelperService,
    { provide: JWT_OPTIONS, useFactory: jwtOptionsFactory },
    AuthService,
    WebSocketService,
    NotificationsService,
    EntriesService,
    SignupDataService,
    UsersService,
    CompaniesService
  ],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent {
  
  notificationStore = inject(NotificationStore);
  //@HostBinding('class') classes = 'row';
  // isSignUp: boolean = false;
  // login: Login = {
  //  email: '',
  //  password: '',
  // };
  // signUp: SignUp = {
  //   email: '',
  //   password: '',
  //   confirmPass: '',
  //   name: '',
  //   last_name: '',
  // };
  message: any;
  passerror: boolean = false;
  emailerror: boolean = false;
  includeLiveChat: boolean = false
  liveChatScript?: any
  liveChatBubble?: any
  assetPath = environment.assets + '/resources/empleadossection.png';
  options = this.settings.getOptions();
  loader: Loader = new Loader(false, false, false);

  constructor(
    private settings: CoreService,
     private router: Router,
     private socketService: WebSocketService,
     private notificationsService:NotificationsService,
     private entriesService:EntriesService,
     private signupDataService: SignupDataService,
     private employeeService: UsersService,
     private companieService: CompaniesService,
     private authService: AuthService,
  ) {}

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.minLength(6)]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  get f() {
    return this.form.controls;
  }

  authLogin() {
    if (this.form.value.email && this.form.value.password) {
      this.authService.login(this.form.value.email, this.form.value.password).subscribe({
        next: (v) => {
          const jwt = v.token;
          const name = v.username;
          const last_name = v.last_name;
          const role = v.role_id;
          const email = v.email;
          localStorage.setItem('role', role);
          localStorage.setItem('username', name + ' ' + last_name);
          localStorage.setItem('jwt', jwt);
          localStorage.setItem('email', email);
          this.socketService.socket.emit('client:joinRoom', jwt);
          this.authService.setUserType(role);
          this.authService.userTypeRouting(role);
          this.authService.checkTokenExpiration();
          this.notificationsService.loadNotifications();
          this.entriesService.loadEntries();
          this.router.navigate(['/dashboards/dashboard2']);
          this.authService.updateLiveChatBubbleVisibility(role);
          this.authService.updateTawkVisitorAttributes(name + ' ' + last_name, email)

          let visibleChatCollection: HTMLCollectionOf<Element>;
          let hiddenChatCollection: HTMLCollectionOf<Element>;
          const interval = setInterval(() => {
            visibleChatCollection = document.getElementsByClassName('widget-visible');
            hiddenChatCollection = document.getElementsByClassName('widget-hidden');
            if(visibleChatCollection.length > 0 || hiddenChatCollection.length > 0) {
              if (visibleChatCollection.length > 0) {
                this.liveChatBubble = visibleChatCollection[0];
              }
              else if (hiddenChatCollection.length > 0) {
                this.liveChatBubble = hiddenChatCollection[0];
              }
              if(role == '3') {
                if (this.liveChatBubble.classList.contains('widget-hidden')) {
                  this.liveChatBubble.classList.remove('widget-hidden');
                  this.liveChatBubble.classList.add('widget-visible');
                }
              } else {
                if (this.liveChatBubble.classList.contains('widget-visible')) {
                  this.liveChatBubble.classList.remove('widget-visible');
                  this.liveChatBubble.classList.add('widget-hidden');
                }
              }
            }
            clearInterval(interval);
          }, 100);
        },
        error: (err: HttpErrorResponse) => {
          const { error } = err;
          this.notificationStore.addNotifications(error.message);
        },
      });
    }
    else {
      this.passerror = true;
      this.message = 'Fields can\'t be empty';
      this.notificationStore.addNotifications(this.message);
      this.authError();
      console.log('Fields can\'t be empty');
    }
  }

  authError() {
    setTimeout(() => {
      this.emailerror = false;
      this.message = null;
      this.passerror = false;
    }, 3000);
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }
}
