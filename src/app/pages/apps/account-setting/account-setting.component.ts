import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatDividerModule } from '@angular/material/divider';
import { CompaniesService } from 'src/app/services/companies.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationStore } from 'src/app/stores/notification.store';
import { UsersService } from 'src/app/services/users.service';
import { MatDialog } from '@angular/material/dialog';
import { NgIf } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
    selector: 'app-account-setting',
    imports: [MatCardModule, MatIconModule, TablerIconsModule, MatTabsModule, MatFormFieldModule, MatSlideToggleModule, MatSelectModule, MatInputModule, MatButtonModule, MatDividerModule, MatDatepickerModule, MatNativeDateModule, NgIf],
    templateUrl: './account-setting.component.html'
})
export class AppAccountSettingComponent implements OnInit {
  notificationStore = inject(NotificationStore);
  user: any = {
      name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      employee: {
          company: '',
          position_name: '',
          emergency_contact: {
              name: '',
              relationship: '',
              phone: ''
          },
          medical_conditions: '',
          social_media: {
              facebook: '',
              instagram: '',
              twitter: '',
              linkedin: ''
          },
          start_date: '',
          insurance_data: {
              provider: '',
              policy_number: '',
              coverage_details: '',
              createdAt: ''
          }
      }
    };
    picture: string = 'assets/images/default-profile-pic.png';
    profileForm!: FormGroup;
    showInsuranceDetails: boolean = false;
    selectedTag: string = 'general';
    role: string;
    
    constructor(public companiesService: CompaniesService,  
              private usersService: UsersService, 
              private fb: FormBuilder,
              private dialog: MatDialog,) {}

  ngOnInit(): void {
    this.getTM();
  }

  getTM() {
    const userEmail = localStorage.getItem('email') || '';
    this.role = localStorage.getItem('role') || '';
    const userFilter = {
        searchField: '',
        filter: {
            currentUser: this.role == '2' ? true : false,
            email: userEmail
        }
    };
    this.usersService.getUsers(userFilter).subscribe({
        next: (users: any) => {
            this.user = users[0];
            console.log(this.user, 'user')
            
            this.usersService.getProfilePic(this.user.id).subscribe({
                next: (url: any) => {
                    if (url) {
                        this.picture = url;
                    }
                }
            });
        },
    });
}
} 
