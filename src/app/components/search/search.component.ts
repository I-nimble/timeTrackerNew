import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SharedModule } from '../shared.module';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CompaniesService } from 'src/app/services/companies.service';
import { UsersService } from 'src/app/services/users.service';
import { NotificationStore } from 'src/app/stores/notification.store';

export interface SearchForm {
  searchField: string;
  filter: FilterData;
}
export interface FilterData {
  role: string;
  status: false;
}
@Component({
  selector: 'app-search',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent implements OnInit {
  @Output() onSearch: EventEmitter<any> = new EventEmitter<any>();
  @Output() onLoading: EventEmitter<any> = new EventEmitter<any>();
  @Input() searchForm: FormGroup = new FormGroup({
    searchField: new FormControl(''),
  });
  @Input() searchElement?: any = 'user'
  store = inject(NotificationStore);
  public companyName?: string;
  public userType?: any
  public userName: string = '';

  constructor(
    private companiesService: CompaniesService,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.userType = localStorage.getItem('role')
    this.getUsername();
    this.searchForEntries();

    const userType = localStorage.getItem('role')
    if(userType == '3') {
      this.getCompanyName();
    }
  }

  public getUsername() {
    this.usersService.getUsername().subscribe({
      next: (username) => {
        if(username) {
          this.userName = username;
        }
      },
      error: () => {
        this.store.addNotifications('Error getting user name', 'error');
      }
    })
  }

  getCompanyName(retryCount : number = 3) {
    this.companiesService.getByOwner().subscribe({
      next: (company) => {
        this.companyName = company?.company?.name;
      },
      error: (error) => {
        if (retryCount > 0) {
          this.store.addNotifications('Error getting company name', 'error');
          setTimeout(() => {
            this.getCompanyName(retryCount - 1);
          }, 2000);
        } else {
          this.store.addNotifications('Max retries reached. Please try again later.', 'error');
        }
      }
    })
  }

  searchForEntries() {
    this.searchForm.valueChanges.subscribe(() => {
      this.onLoading.emit();
    });
    this.searchForm.valueChanges
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe((value) => {
        this.onSearch.emit();
      });
  }
  public getName() {
    const name = localStorage.getItem('name');
    return name;
  }
}
