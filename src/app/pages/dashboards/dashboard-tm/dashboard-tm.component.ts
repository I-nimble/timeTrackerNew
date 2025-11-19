import { Component, OnInit, type AfterViewInit } from '@angular/core';
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
import { RouterLink, Router } from '@angular/router';
import { RatingsService } from 'src/app/services/ratings.service';
import { SafeResourceUrl } from '@angular/platform-browser';
import { nextDay } from 'date-fns';
import { MatDialog } from '@angular/material/dialog';
import { OlympiaService } from 'src/app/services/olympia.service';
import { OlympiaDialogComponent } from 'src/app/components/olympia-dialog/olympia-dialog.component';
import { MatStepperModule } from '@angular/material/stepper';
import { ReactiveFormsModule } from '@angular/forms';
import { StepperSelectionEvent } from '@angular/cdk/stepper';

@Component({
  selector: 'app-dashboard-tm',
  standalone: true,
  imports: [MaterialModule, EntriesPanelComponent, CommonModule, RouterLink],
  templateUrl: './dashboard-tm.component.html',
  styleUrl: './dashboard-tm.component.scss',
})
export class AppDashboardTMComponent implements OnInit, AfterViewInit {
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
  employer: any = {};
  companyLogo!: SafeResourceUrl;
  isOrphan: boolean;
  userCompletedProfile: boolean = false;
  olympiaSubmitted: boolean = false;
  pictureUploaded: boolean = false;
  profileCompleted: boolean = false;
  videoUploaded: boolean = false;
  matchRequested: boolean = false;
  selectedStepperIndex: number = 0;
  firstStepperLoad: boolean = true;

  constructor(
    private usersService: UsersService,
    private employeesService: EmployeesService,
    private companiesService: CompaniesService,
    private entriesService: EntriesService,
    private socketService: WebSocketService,
    private snackBar: MatSnackBar,
    public ratingsEntriesService: RatingsEntriesService,
    public ratingsService: RatingsService,
    private olympiaService: OlympiaService,
    public dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getUser();
    this.getEntries();
    this.isOrphan = localStorage.getItem('isOrphan') === 'true';
    // this.setStepperToLastCompletedStep();
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
        if(!employee) return;

        const company_id = employee.company_id;
        this.companiesService.getCompanies().subscribe((companies: any) => {
          const company = companies.filter(
            (company: any) => company.id == company_id
          )[0];
          const companyTimeZone = company?.timezone?.split(':')[0];
          this.timeZone = companyTimeZone;
        });
      });
    } else {
      this.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    this.usersService.getUsers({ searchField: '', filter: { currentUser: true } })
    .subscribe({
      next: (users: any) => {
        this.user = users[0];

        this.usersService.getProfilePic(this.user.id).subscribe({
          next: (url: any) => {
            if (url) this.user.picture = url;
            this.checkPictureUploaded();
          },
          error: () => {
            this.checkPictureUploaded();
          }
        });
      }
    });
  }

  ngAfterViewInit() {
    this.checkOlympiaStatus();
    this.checkPictureUploaded();
    this.checkVideoStatus();
  }

  getUser() {
    const userEmail = localStorage.getItem('email') || '';
    this.role = localStorage.getItem('role') || '';
    const userFilter = {
      searchField: '',
      filter: {
        currentUser: true,
      },
    };
    this.usersService.getUsers(userFilter).subscribe({
      next: (users: any) => {
        this.user = users[0];

        this.usersService.getProfilePic(this.user.id).subscribe({
          next: (url: any) => {
            if (url) {
              this.picture = url;
              this.user.picture = url;
            }
            this.checkPictureUploaded();
            this.checkMatchRequestStatus(); 
          },
          error: () => {
            this.checkPictureUploaded();
          }
        });

        this.getEmployees();
      },
    });
  }

  getEmployees() {
    if(!this.user?.employee?.id) return;

    this.companiesService
      .getEmployees(this.user?.employee?.id)
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
              picture: null,
            };
            if (this.employer.id) {
              this.usersService.getProfilePic(this.employer.id).subscribe({
                next: (image: any) => {
                  this.employer.picture = image;
                }
              });
            }
          });

        this.companiesService
          .getCompanyLogo(employees[0].company_id)
          .subscribe((logo) => {
            if(logo) {
              this.companyLogo = logo;
            }
          });

        for (let i = 0; i < this.employees.length; i++) {
          const employee = this.employees[i];
          this.usersService.getProfilePic(employee.user.id).subscribe({
            next: (image: any) => {
              this.employees[i].user.picture = image;
            }
          });
        }
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

  checkOlympiaStatus() {
    this.olympiaService.checkOlympiaForm().subscribe({
      next: (res: boolean) => {
        this.olympiaSubmitted = res;
        this.setStepperToLastCompletedStep();
      },
      error: () => console.error('Error checking Olympia form status')
    });
  }

  checkPictureUploaded() {
    const defaultImages = [
      'assets/images/default-user-profile-pic.png',
      'assets/images/default-logo.jpg'
    ];
    this.pictureUploaded = !!this.user.picture && !defaultImages.includes(this.user.picture);
    this.setStepperToLastCompletedStep();
  }

  checkVideoStatus() {
    const email = localStorage.getItem('email') || '';
    if (!email) return;

    this.usersService.checkIntroductionVideo(email).subscribe({
      next: (res: any) => {
        this.videoUploaded = res.hasVideo;
        this.setStepperToLastCompletedStep();
      },
      error: (err) => {
        console.error('Error checking video status', err);
        this.setStepperToLastCompletedStep();
      }
    });
  }

  setStepperToLastCompletedStep() {
    if (!this.pictureUploaded && !this.videoUploaded) {
      this.selectedStepperIndex = 0;
    } else if (this.pictureUploaded && this.videoUploaded && !this.olympiaSubmitted) {
      this.selectedStepperIndex = 2;
    } else if (this.pictureUploaded && this.videoUploaded && this.olympiaSubmitted && !this.matchRequested) {
      this.selectedStepperIndex = 3;
    } else if (this.pictureUploaded && this.videoUploaded && this.olympiaSubmitted && this.matchRequested) {
      this.selectedStepperIndex = -1;
    } else {
      this.selectedStepperIndex = 1;
    }
  }

  checkMatchRequestStatus() {
    if (!this.user?.id) return;
    
    this.usersService.checkMatchStatus(this.user.id).subscribe({
      next: (status: boolean) => {
        this.matchRequested = status;
        this.setStepperToLastCompletedStep();
      },
      error: (error) => {
        console.error('Error checking match status', error);
        if (error.status !== 404) {
          this.showSnackbar('Error checking match status');
        }
      }
    });
  }

  requestMatch() {
    if (!this.user?.id || this.matchRequested) return;
    
    this.usersService.requestMatch(this.user.id).subscribe({
      next: () => {
        this.matchRequested = true;
        this.selectedStepperIndex = -1;
        this.showSnackbar('Match request sent successfully!');
      },
      error: (error) => {
        if (error.status === 400) {
          this.matchRequested = true;
          this.selectedStepperIndex = -1;
          this.showSnackbar('Match already requested. Please wait for our contact.');
        } else {
          this.showSnackbar('Error sending match request');
        }
      }
    });
  }

  preventStepperBack(event: StepperSelectionEvent) {
    if (this.firstStepperLoad) {
      this.firstStepperLoad = false;
      return;
    }

    if (event.previouslySelectedIndex > event.selectedIndex) {
      setTimeout(() => {
        this.selectedStepperIndex = event.previouslySelectedIndex;
      });
      return;
    }
    this.selectedStepperIndex = event.selectedIndex;
  }

  goToAccountSettings(tabIndex: number) {
    this.selectedStepperIndex = tabIndex;
    setTimeout(() => {
      this.router.navigate(['/apps/account-settings'], {
        queryParams: { tab: tabIndex }
      });
    });
  }
}
