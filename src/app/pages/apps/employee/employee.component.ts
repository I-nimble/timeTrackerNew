import {
  Component,
  Inject,
  Optional,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { AppAddEmployeeComponent } from './add/add.component';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Employee } from 'src/app/pages/apps/employee/employee';
import { EmployeesService } from 'src/app/services/employees.service';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';
import { CompaniesService } from 'src/app/services/companies.service';
import { PositionsService } from 'src/app/services/positions.service';
import { environment } from 'src/environments/environment';
import { SchedulesService } from 'src/app/services/schedules.service';
import { ReportsService } from 'src/app/services/reports.service';
import { ProjectsService } from 'src/app/services/projects.service';
import {
  ReportFilter,
  ReportsFilterComponent,
} from 'src/app/components/reports-filter/reports-filter.component';
import moment from 'moment-timezone';
import * as filesaver from 'file-saver';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TimerComponent } from 'src/app/components/timer-component/timer.component';
import { AppActivityReportComponent } from '../../../components/dashboard2/activity-report/activity-report.component';
import { AppEmployeesReportsComponent } from '../../../components/dashboard2/employees-reports/employees-reports.component';
import { EmployeeDetailsComponent } from './employee-details/employee-details.component';

@Component({
  templateUrl: './employee.component.html',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    CommonModule,
    RouterModule,
    TimerComponent,
    AppActivityReportComponent,
    AppEmployeesReportsComponent,
    EmployeeDetailsComponent
  ],
  standalone: true,
})
export class AppEmployeeComponent {
  @ViewChild(MatTable, { static: true }) table: MatTable<any> =
    Object.create(null);
  users: any[] = [];
  employees: any[] = [];
  loaded: boolean = false;
  company: any;
  companyTimezone: string = 'America/Los_Angeles';
  timeZone: string = 'America/Caracas';
  assetsPath: string = environment.assets;
  filters: ReportFilter = {
    user: 'all',
    company: 'all',
    project: 'all',
    byClient: false,
    useTimezone: false,
  };
  userRole = localStorage.getItem('role');
  companies: any[] = [];
  companyId: number | null = null;

  searchText: any;

  displayedColumns: string[] = [
    'name',
    'schedule',
    'salary',
    'projects',
    'action',
  ];

  dataSource = new MatTableDataSource<Employee>([]);

  @ViewChild(MatPaginator) set matPaginator(paginator: MatPaginator) {
    if (paginator) {
      this.dataSource.paginator = paginator;
    }
  }

  constructor(
    public dialog: MatDialog,
    private employeesService: EmployeesService,
    private userService: UsersService,
    private positionsService: PositionsService,
    private schedulesService: SchedulesService,
    private reportsService: ReportsService,
    private companiesService: CompaniesService,
  ) {}

  ngOnInit(): void {
    if (this.userRole === '3') {
      this.loadCompany();
    }
    this.getEmployees();
    this.getCompanies();
  }

  getCompanies() {
    this.companiesService.getCompanies().subscribe({
      next: (companies: any) => {
        this.companies = companies;
      },
    });
  }

  handleCompanySelection(event: any) {
    this.companyId = event.value;
    this.dataSource.data = this.users.filter((user: any) => user.company_id === this.companyId);
  }

  loadCompany(): void {
    this.companiesService.getByOwner().subscribe((company: any) => {
      this.company = company.company.name;
      if(company.company.timezone) {
        this.companyTimezone = this.companyTimezone.split(':')[0];
      }
    });
  }

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openDialog(action: string, employee: Employee | any): void {
    const dialogRef = this.dialog.open(AppEmployeeDialogContentComponent, {
      data: { action, employee },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.getEmployees();
    });
  }

  getEmployees() {
    this.employeesService.get().subscribe({
      next: (employees: any) => {
        this.employees = employees;
        this.users = employees
          .filter((user: any) => user.user.active == 1);

        this.schedulesService.get().subscribe({
          next: (schedules: any) => {
            schedules = schedules.schedules;
            this.users = this.users.map((user: any) => {
              const userSchedules = schedules.find(
                (schedule: any) => schedule.employee_id === user.id
              );
              if (!userSchedules) {
                return {
                  id: user.user.id,
                  company_id: user.company_id,
                  name: user.user.name,
                  last_name: user.user.last_name,
                  email: user.user.email,
                  position: user.position_id,
                  projects: user.projects.map((project: any) => project.id),
                  schedule: 'No registered schedule',
                  Salary: 0,
                  imagePath: this.assetsPath + '/default-profile-pic.png',
                };
              }
              
              const workingDays = userSchedules.days
                .map((day: any) => day.name)
                .sort((a: string, b: string) => {
                  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                  return weekDays.indexOf(a) - weekDays.indexOf(b);
                });

              const scheduleString = this.formatDaysRange(workingDays);

              return {
                id: user.user.id,
                company_id: user.company_id,
                name: user.user.name,
                last_name: user.user.last_name,
                email: user.user.email,
                position: user.position_id,
                projects: user.projects.map((project: any) => project.id),
                schedule: scheduleString,
                Salary: 0, 
                imagePath: this.assetsPath + '/default-profile-pic.png',
              };
            });
            this.dataSource.data = this.users;
            this.loaded = true;
          },
          error: (err) => {
            console.error('Error fetching schedules:', err);
          },
        });
      },
      error: (err) => {
        console.error('Error fetching employees:', err);
      },
    });
  }

  // Helper function to format days as a range "Monday to Friday"
  formatDaysRange(days: string[]): string {
    const weekDays = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ];
    const indices = days.map(day => weekDays.indexOf(day)).filter(i => i !== -1).sort((a, b) => a - b);
    if (indices.length === 0) return '';
    // Check if days are consecutive
    let isConsecutive = true;
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] !== indices[i - 1] + 1) {
        isConsecutive = false;
        break;
      }
    }
    if (isConsecutive && indices.length > 1) {
      return `${weekDays[indices[0]]} to ${weekDays[indices[indices.length - 1]]}`;
    } else {
      return days.join(', ');
    }
  }

  setUser(user: any): void {

        this.employees.map((employee: any) => {
      user.id == employee.user.id ? user = employee.user : null;
    });

    this.userService.setUserInformation(user);
  }

  downloadReport(user: any): void {
    this.filters = {
      user: user.id,
      company: 'all',
      project: 'all',
      byClient: false,
      useTimezone: false,
    };

    const datesRange = {
      firstSelect: moment().startOf('week').toDate(),
      lastSelect: moment().endOf('week').toDate(),
    };

    this.employees.map((employee: any) => {
      user.id == employee.user.id ? user = employee.user : null;
    });
    this.reportsService
      .getReport(datesRange, user, this.filters)
      .subscribe((v) => {
        let filename;
        let display_name;
        if (user.last_name) {
          display_name = `${user.name}_${user.last_name}`;
        } else {
          display_name = user.name;
        }

        filename = `I-nimble_Report_${display_name}_${moment(
          new Date(datesRange.firstSelect)
        ).format('DD-MM-YYYY')}_${moment(
          new Date(datesRange.lastSelect)
        ).format('DD-MM-YYYY')}.xlsx`;

        filesaver.saveAs(v, filename);
      });
  }
}

interface DialogData {
  action: string;
  employee: Employee;
}

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'app-dialog-content',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    TablerIconsModule,
  ],
  templateUrl: 'employee-dialog-content.html',
})
// tslint:disable-next-line: component-class-suffix
export class AppEmployeeDialogContentComponent {
  action: string | any;
  // tslint:disable-next-line - Disables all
  local_data: any;
  selectedImage: any = '';
  joiningDate = new FormControl();
  positions: any[] = [];
  projects: any[] = [];
  selectedFile: File | null = null;
  sendingData: boolean = false;
  addEmployeeForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    last_name: ['', Validators.required],
    password: [''],
    email: ['', [Validators.required, Validators.email]],
    position: ['', Validators.required],
    projects: [[]],
  });

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<AppEmployeeDialogContentComponent>,
    private employeesService: EmployeesService,
    private usersService: UsersService,
    private snackBar: MatSnackBar,
    private positionsService: PositionsService,
    private projectsService: ProjectsService,
    private fb: FormBuilder,
    // @Optional() is used to prevent error if no data is passed
    @Optional() @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.action = data.action;
    if(this.action === 'Add') {
      this.addEmployeeForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    }
    this.local_data = { ...data.employee };
    this.addEmployeeForm.patchValue({ // Populate form data
      name: this.local_data.name || '',
      last_name: this.local_data.last_name || '',
      password: '',
      email: this.local_data.email || '',
      position: this.local_data.position || '',
      projects: this.local_data.projects || [],
    });

    this.positionsService.get().subscribe((positions: any) => {
      this.positions = positions;
    });

    this.projectsService.get().subscribe((projects: any) => {
      this.projects = projects;
    });

    // Set default image path if not already set
    if (!this.local_data.image) {
      this.local_data.image = 'assets/images/default-user-profile-pic.png';
    }
  }

  doAction(): void {

    if (this.action === 'Add') {
      this.sendingData = true;
      this.employeesService.addEmployee(this.addEmployeeForm.value, this.selectedFile || null).subscribe({
        next: () => {
          this.dialogRef.close();
          const successDialogRef = this.dialog.open(AppAddEmployeeComponent);
          successDialogRef.afterClosed().subscribe(() => {
            this.dialogRef.close({ event: 'Refresh' });
            this.openSnackBar('Employee Added successfully!', 'Close');
          });
        },
        error: (err) => {
          console.error('Error adding employee:', err);
          this.openSnackBar('Error adding employee', 'Close');
        },
        complete: () => {
          this.sendingData = false;
        },
      });
    } else if (this.action === 'Update') {
      // this.employeesService.updateEmployee(this.local_data);
      // this.dialogRef.close({ event: 'Update' });
      // this.openSnackBar('Employee Updated successfully!', 'Close');
    } else if (this.action === 'Delete') {
      this.employeesService.deleteEmployee(this.local_data.id).subscribe({
        next: () => {
          this.dialogRef.close({ event: 'Delete' });
          this.openSnackBar('Employee Deleted successfully!', 'Close');
        },
        error: (err:any) => {
          console.error('Error deleting employee:', err);
          this.openSnackBar('Error deleting employee', 'Close');
        },
      });
    }
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }

  selectFile(event: any): void {
    if (!event.target.files[0] || event.target.files[0].length === 0) {
      this.openSnackBar('Please select an image', 'Close');
      return;
    }

    const mimeType = event.target.files[0].type;
    if (mimeType.match(/image\/jpeg/) == null) {
      this.openSnackBar('The image must be a JPEG file', 'Close');
      return;
    }

    this.selectedFile = event.target.files[0];
    if(this.selectedFile) {
      const reader = new FileReader();
      reader.readAsDataURL(this.selectedFile);
  
      reader.onload = (_event) => {
        this.local_data.image = reader.result; // Set selected image for preview
      };
    }
  }
}
