import { AfterViewInit, Component, HostBinding, OnInit, inject } from '@angular/core';
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
import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';
import {AuthService} from '../../../services/auth.service';
import { WebSocketService } from 'src/app/services/socket/web-socket.service';
import { NotificationStore } from 'src/app/stores/notification.store';
import { NotificationsService } from 'src/app/services/notifications.service';
import { EntriesService } from 'src/app/services/entries.service';
import { HttpErrorResponse } from '@angular/common/http';
import { SignupDataService } from 'src/app/models/SignupData.model';
import { UsersService } from 'src/app/services/users.service';
import { CompaniesService } from 'src/app/services/companies.service';
import { Loader } from 'src/app/app.models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CometChatService } from 'src/app/services/apps/chat/chat.service';

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
  styleUrls: ['./side-login.component.scss']
})
export class AppSideLoginComponent implements AfterViewInit {
  
  notificationStore = inject(NotificationStore);
  message: any;
  passerror: boolean = false;
  emailerror: boolean = false;
  includeLiveChat: boolean = false
  liveChatScript?: any
  liveChatBubble?: any
  assetPath = 'assets/images/login.png';
  options = this.settings.getOptions();
  loader: Loader = new Loader(false, false, false);
  route: any = ''

  constructor(
    private settings: CoreService,
     private router: Router,
     private socketService: WebSocketService,
     private notificationsService:NotificationsService,
     private entriesService:EntriesService,
     private authService: AuthService,
     private snackBar: MatSnackBar,
     private chatService: CometChatService,
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
          const id = v.id;
          const isOrphan = v.isOrphan;
          localStorage.setItem('role', role);
          if (Number(role) === 1) {
            this.route = '/dashboards/admin';
          } else if (Number(role) === 2) {
            this.route = '/dashboards/tm';
          } else {
            this.route = '/dashboards/dashboard2';
          }
          localStorage.setItem('username', name + ' ' + last_name);
          localStorage.setItem('jwt', jwt);
          localStorage.setItem('email', email);
          localStorage.setItem('id', id);
          localStorage.setItem('isOrphan', isOrphan);
          this.socketService.socket.emit('client:joinRoom', jwt);
          this.authService.setUserType(role);
          this.authService.userTypeRouting(role);
          this.authService.checkTokenExpiration();
          this.notificationsService.loadNotifications();
          this.entriesService.loadEntries();
          this.router.navigate([this.route]);
          this.authService.updateLiveChatBubbleVisibility(role);
          this.authService.updateTawkVisitorAttributes(name + ' ' + last_name, email)
          this.chatService.initializeCometChat();

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
          this.openSnackBar('Login error: ' + (err.error?.message || ' Please, try again.'));
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

  openSnackBar(message: string, action: string = 'Cerrar') {
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

  ngAfterViewInit() {
    this.setupMobileInputHandling();
  }

  private setupMobileInputHandling() {
    const isRealMobile = window.innerWidth <= 768 && 
                        (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
    
    if (isRealMobile) {
      const passwordInput = document.querySelector('input[formControlName="password"]') as HTMLElement;
      const emailInput = document.querySelector('input[formControlName="email"]') as HTMLElement;
      
      if (passwordInput) {
        passwordInput.addEventListener('focus', () => {
          this.scrollToPasswordField();
        });
      }
      
      if (emailInput) {
        emailInput.addEventListener('focus', () => {
          this.scrollToEmailField();
        });
      }
    }
  }

  private scrollToPasswordField() {
    setTimeout(() => {
      const passwordField = document.querySelector('.mobile-password-input') as HTMLElement;
      if (passwordField) {
        passwordField.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 300);
  }

  private scrollToEmailField() {
    setTimeout(() => {
      const emailField = document.querySelector('input[formControlName="email"]') as HTMLElement;
      if (emailField) {
        emailField.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 300);
  }
}