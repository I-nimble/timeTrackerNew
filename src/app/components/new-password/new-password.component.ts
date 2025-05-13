import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { Roles } from 'src/app/models/Roles';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Loader } from 'src/app/app.models';
import { User } from 'src/app/models/User.model';
import { CompaniesService } from 'src/app/services/companies.service';
import { UsersService } from 'src/app/services/users.service';
import { Positions } from 'src/app/models/Position.model';
import { SharedModule } from '../shared.module';
import { NotificationStore } from 'src/app/stores/notification.store';
import { MoreVertComponent, options } from '../more-vert/more-vert.component';
import { LoaderComponent } from '../loader/loader.component';
import { MatDialogActions, MatDialogClose } from '@angular/material/dialog';

@Component({
  selector: 'app-new-password',
  standalone: true,
  imports: [FormsModule, LoaderComponent, ReactiveFormsModule, MoreVertComponent, MatDialogActions, MatDialogClose],
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.scss'],
})
export class NewPasswordComponent implements OnInit {
  notificationStore = inject(NotificationStore);
  @Input() selectedUser: any;
  @Output() onSaveSelectedUser: EventEmitter<any> = new EventEmitter<any>();

  email!: string;
  usersList: any;
  company!: any;
  newUser: User = {
    id: '',
    company: {
      id: null
    },
    name: '',
    last_name: '',
    email: '',
    password: '',
    role: 0,
    active: 1,
  };
  loader: Loader = new Loader(false, false, false);
  userForm!: FormGroup;
  message: string = '';
  companies: any;

  constructor(
    private userService: UsersService,
    private fb: FormBuilder,
    private companiesService: CompaniesService,
  ) {
    this.userForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      cpassword: [''],
    });
  }

  ngOnInit(): void {
    this.getEmail();
    this.getUsers();
    this.companiesService.getByOwner().subscribe(company => {
      this.company = company;
    });
  }
  public getEmail() {
    const email = localStorage.getItem('email');
    this.email = email || '';
    return email;
  }

  getUsers() {
    let body = {};
    this.userService.getUsers(body).subscribe({
      next: (users) => {
        this.usersList = users.filter((user: any) => user.active == 1 && user.email === this.email);
        this.newUser = {
          id: this.usersList[0].id,
          name: this.usersList[0].name,
          company: {
            id: this.company?.company_id
          },
          last_name: this.usersList[0].last_name,
          email: this.usersList[0].email,
          password: '',
          role: this.usersList[0].role,
          active: 1,
        };
      },
      error: (err) => {},
    });


  }


  resetForm() {
    this.userForm.get('password')?.setValue('');
    this.userForm.get('cpassword')?.setValue('');
  }

  public submitUserForm() {
    this.getUsers();
    this.loader = new Loader(true, false, false);
    const password = this.userForm.get('password');
      const confirmPassword = this.userForm.get('cpassword');
        if (!this.userForm.valid) {
          this.loader = new Loader(true, false, true);
          this.notificationStore.addNotifications(
            'Password must be at least 8 characters long.',
            'error'
          );
          return;
        }
        if (password && confirmPassword && password.value === confirmPassword.value) {
        this.newUser.password = this.userForm.value.password;
        this.userService.createUser(this.newUser).subscribe({
          next: (user) => {
            this.onSaveSelectedUser.emit(user);
            this.loader = new Loader(true, true, false);
            this.resetForm()
          },
          error: (err) => {
            this.loader = new Loader(true, false, true);
            this.notificationStore.addNotifications(err.error.message, 'error');
          },
        });
        } else {
          this.loader = new Loader(true, false, true);
          this.notificationStore.addNotifications(
            'Passwords do not match',
            'error'
          );
        }
  }
}