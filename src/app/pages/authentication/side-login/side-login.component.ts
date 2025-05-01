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


@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule, BrandingComponent],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent {
  
  notificationStore = inject(NotificationStore);
  @HostBinding('class') classes = 'row';
  isSignUp: boolean = false;
  login: Login = {
    email: '',
    password: '',
  };
  signUp: SignUp = {
    email: '',
    password: '',
    confirmPass: '',
    name: '',
    last_name: '',
  };
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
    private socketService: WebSocketService,
    //private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationsService:NotificationsService,
    private entriesService:EntriesService,
    private signupDataService: SignupDataService,
    private employeeService: UsersService,
    private companieService: CompaniesService,
    private settings: CoreService,
  ) {}

  form = new FormGroup({
    uname: new FormControl('', [Validators.required, Validators.minLength(6)]),
    password: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  authLogin() {
    // console.log(this.form.value);
    this.router.navigate(['/dashboards/dashboard1']);
  }
}
