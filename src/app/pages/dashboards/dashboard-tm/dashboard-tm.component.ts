import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { Entries } from 'src/app/models/Entries';
import { EntriesService } from 'src/app/services/entries.service';
import { EntriesPanelComponent } from 'src/app/components/entries-panel/entries-panel.component';
import { EmployeesService } from 'src/app/services/employees.service';
import { UsersService } from 'src/app/services/users.service';
import { WebSocketService } from 'src/app/services/socket/web-socket.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompaniesService } from 'src/app/services/companies.service';
import { RatingsEntriesService } from 'src/app/services/ratings_entries.service';
import { RouterLink } from '@angular/router';
import { RatingsService } from 'src/app/services/ratings.service';

@Component({
  selector: 'app-dashboard-tm',
  standalone: true,
  imports: [MaterialModule, EntriesPanelComponent, CommonModule, RouterLink],
  templateUrl: './dashboard-tm.component.html',
  styleUrl: './dashboard-tm.component.scss',
})
export class AppDashboardTMComponent implements OnInit {
  role: string | null = localStorage.getItem('role');
  employees: any = [];
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
        phone: '',
      },
      medical_conditions: '',
      social_media: {
        facebook: '',
        instagram: '',
        twitter: '',
        linkedin: '',
      },
      start_date: '',
      insurance_data: {
        provider: '',
        policy_number: '',
        coverage_details: '',
        createdAt: '',
      },
    },
    company: {
      name: '',
      headquarter: '',
      employees_amount: '',
      bussiness_segment: '',
    },
  };
  picture: string = 'assets/images/default-user-profile-pic.png';

  // timer
  entriesAlert: string = '';
  name: any;
  entries: any = [];
  loaded!: boolean;
  entryCheck: boolean = false;
  currentEntryId: number = 0;
  timer: any = '00:00:00';
  message: any;
  start_time: any;
  timeZone: string = 'America/Caracas';
  startedEntry: Entries = {
    status: 0,
    description: '',
    start_time: new Date(),
    end_time: new Date(),
  };
  todayTasks: any[] = [];
  employer: any;

  constructor(
    private usersService: UsersService,
    private employeesService: EmployeesService,
    private companiesService: CompaniesService,
    private entriesService: EntriesService,
    private socketService: WebSocketService,
    private snackBar: MatSnackBar,
    public ratingsEntriesService: RatingsEntriesService,
    public ratingsService: RatingsService
  ) {}

  ngOnInit(): void {
    this.getUser();
    this.getEntries();

    this.socketService.socket?.on('server:start_timer', (data) => {
      if (data.length !== 0) {
        this.currentEntryId = data.id;
        this.start_time = new Date();
        this.startedEntry = data;
        this.entryCheck = true;
      } else {
        this.entryCheck = false;
      }
    });

    if (localStorage.getItem('role') === '2') {
      this.employeesService.getByEmployee().subscribe((employee: any) => {
        const company_id = employee.company_id;
        this.companiesService.getCompanies().subscribe((companies: any) => {
          const company = companies.filter(
            (company: any) => company.id == company_id
          )[0];
          const companyTimeZone = company.timezone?.split(':')[0];
          this.timeZone = companyTimeZone;
        });
      });
    } else {
      this.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    // const today = new Date();
    // this.ratingsService.getToDo(today).subscribe((tasks) => {
    //   this.todayTasks = tasks ? tasks.slice(0, 5) : [];
    // });
  }

  getUser() {
    const userEmail = localStorage.getItem('email') || '';
    this.role = localStorage.getItem('role') || '';
    const userFilter = {
      searchField: '',
      filter: {
        currentUser: this.role == '2' ? true : false,
        email: userEmail,
      },
    };
    this.usersService.getUsers(userFilter).subscribe({
      next: (users: any) => {
        this.user = users[0];

        this.usersService.getProfilePic(this.user.id).subscribe({
          next: (url: any) => {
            if (url) {
              this.picture = url;
            }
          },
        });

        this.getEmployees();
      },
    });
  }

  getEmployees() {
    this.companiesService
      .getEmployees(this.user.employee.id)
      .subscribe((employees: any) => {
        this.employees = employees.filter(
          (employee: any) =>
            employee.user.active === 1 &&
            employee.user.roles.some((role: any) => role.id === 2) &&
            employee.user.id !== this.user.id
        );

        this.companiesService
          .getEmployer(employees[0].company_id)
          .subscribe((data) => {
            this.employer = {
              name: data.user?.name,
              last_name: data.user?.last_name,
              id: data?.user?.id,
              picture: this.picture,
            };
          });

        this.companiesService
          .getCompanyLogo(employees[0].company_id)
          .subscribe((logo) => {
            this.employer.picture = logo;
          });

        this.employees.forEach((employee: any) => {
          this.usersService.getProfilePic(employee.user.id).subscribe({
            next: (image: any) => {
              employee.user.picture = image || this.picture;
            },
            error: () => {
              employee.user.picture = this.picture;
            },
          });
        });
      });
  }

  // timer
  getEntries() {
    this.entriesService.getEntries().subscribe(({ entries, suspicious }) => {
      if (suspicious.length > 0)
        this.entriesAlert =
          'You have some entries for review, you should talk to HR';
      this.entries = entries.filter((entry: any) => entry.status !== 0);
      const startedEntry = entries.filter((entry: any) => entry.status === 0);
      if (startedEntry.length !== 0) {
        this.currentEntryId = startedEntry[0].id;
        this.start_time = startedEntry[0].start_time;
        this.startedEntry = startedEntry[0];
        this.entryCheck = true;
      } else {
        this.entryCheck = false;
      }
      this.loaded = true;
    });
  }

  addEntry(data: any) {
    this.entriesService.createEntry(data).subscribe({
      next: (startedEntry: any) => {
        this.currentEntryId = startedEntry.id;
        this.startedEntry = startedEntry;
        this.start_time = new Date();
        this.entryCheck = true;
        this.socketService.socket.emit('client:start_timer', startedEntry);
        this.socketService.socket.emit('client:loadEntries', this.entries);
      },
      error: (e) => {
        this.message = 'There was an error starting your entry';
        this.showSnackbar(this.message);
      },
    });
  }
  endCurrentEntry(currentEntry: any) {
    this.currentEntryId = currentEntry.id;
    this.entriesService.closeCurrentEntry(currentEntry).subscribe({
      next: (v) => {
        this.getEntries();
        this.socketService.socket.emit('client:end_entry', 'mensaje');
      },
      error: (e) => {
        this.message = 'There was an error stopping your entry';
        this.showSnackbar(this.message);
      },
    });
  }

  cancelCurrentEntry(currentEntry: any) {
    this.currentEntryId = currentEntry.id;
    this.entriesService.cancelEntry(currentEntry.id).subscribe({
      next: (v) => {
        this.getEntries();
        this.socketService.socket.emit('client:end_entry', 'mensaje');
      },
      error: (e) => {
        this.message = 'There was an error cancelling your entry';
        this.showSnackbar(this.message);
      },
    });
  }

  displayAlert(component: any) {
    switch (component.title) {
      case 'Tracker':
        return this.entriesAlert;
        break;
      default:
        return '';
        break;
    }
  }

  showSnackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
