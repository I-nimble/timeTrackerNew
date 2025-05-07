import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { SharedModule } from '../shared.module';
import { TimerComponent } from '../timer/timer.component';
import { UserOptionsComponent } from '../user-options/user-options.component';
import { UsersService } from 'src/app/services/users.service';
import { CompaniesService } from 'src/app/services/companies.service';
import { DomSanitizer } from '@angular/platform-browser';
import { forkJoin, map } from 'rxjs';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationStore } from 'src/app/stores/notification.store';
import { environment } from 'src/environments/environment';
import { RouterLink } from '@angular/router';

export interface Link {
  url: string;
  title: string;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    SharedModule,
    TimerComponent,
    UserOptionsComponent,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit, OnChanges {
  store = inject(NotificationStore)
  @Input() users!: any;
  @Input() timer: boolean = false;
  @Input() loaded!: boolean;
  @Input() links: Link[] = [];
  @Output() onSelectedUser: EventEmitter<any> = new EventEmitter<any>();
  @Output() onToggleStatus: EventEmitter<any> = new EventEmitter<any>();
  role = localStorage.getItem('role');
  timeZone: string = 'America/Caracas';
  assetsPath: string = environment.assets + '/default-profile-pic.png';

  constructor(
    private userService: UsersService,
    private companiesService: CompaniesService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if(localStorage.getItem("role") === '3') {
      this.companiesService.getByOwner().subscribe((company) => {
        const companyTimeZone = company.company.timezone.split(":")[0]
        this.timeZone = companyTimeZone
      })
    } else {
      this.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['users'] && changes['users'].currentValue && changes['users'].currentValue.length > 0) {
      this.getImages();
      this.cdr.detectChanges();
    }
  }

  private getImages() {
    const profilePicObservables = this.users.map((user: any) => {    
      return this.userService.getProfilePic(user?.id).pipe(
        map((image: any) => {
          if (image) {
            return { ...user, profilePicture: image };
          }
          return user;
        })
      );
    });

    forkJoin(profilePicObservables).subscribe({
      next: (updatedUsers) => {
        this.users = updatedUsers;
      },
      error: () => {
        this.store.addNotifications("Error loading employees profile pictures.", "error")
      }
    });
  }

  public selectUser(user: any) {
    this.onSelectedUser.emit(user);
  }

  public toggleUserStatus(user: any) {
    this.onToggleStatus.emit(user);
  }

  public getRouterLink(link: any, user: any) {
    return link.title == 'Comments' ? `${link.url}/${user.id}` : link.url;
  }

  public setReportInfo(user: any) {
    this.userService.setUserInformation(user);
  }
}
