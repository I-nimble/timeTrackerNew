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
import { EmployeeService } from 'src/app/services/apps/employee/employee.service';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';
import { CompaniesService } from 'src/app/services/companies.service';
import { PositionsService } from 'src/app/services/positions.service';
import { environment } from 'src/environments/environment';
import { SchedulesService } from 'src/app/services/schedules.service';
import { ReportsService } from 'src/app/services/reports.service';
import {
  ReportFilter,
  ReportsFilterComponent,
} from 'src/app/components/reports-filter/reports-filter.component';
import moment from 'moment-timezone';
import * as filesaver from 'file-saver';

@Component({
  templateUrl: './employee.component.html',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    CommonModule,
    RouterModule,
  ],
})
export class AppEmployeeComponent implements AfterViewInit {
  @ViewChild(MatTable, { static: true }) table: MatTable<any> =
    Object.create(null);
  users: any[] = [];
  employees: any[] = [];
  loaded: boolean = false;
  company: any;
  companyTimezone: string = 'UTC';
  timeZone: string = 'America/Caracas';
  assetsPath: string = environment.assets;
  filters: ReportFilter = {
    user: 'all',
    company: 'all',
    project: 'all',
    byClient: false,
    useTimezone: false,
  };

  searchText: any;

  displayedColumns: string[] = [
    '#',
    'name',
    'schedule',
    'date of joining',
    'salary',
    'projects',
    'action',
  ];

  dataSource = new MatTableDataSource<Employee>([]);

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator =
    Object.create(null);

  constructor(
    public dialog: MatDialog,
    private employeeService: EmployeeService,
    private userService: UsersService,
    private companieService: CompaniesService,
    private positionsService: PositionsService,
    private schedulesService: SchedulesService,
    private reportsService: ReportsService
  ) {}

  ngOnInit(): void {
    this.loadCompany();
    this.getEmployees();
  }

  loadCompany(): void {
    this.companieService.getByOwner().subscribe((company: any) => {
      this.company = company.company.name;
      this.companyTimezone = company.company.timezone || 'UTC';
    });
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
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
      this.dataSource.data = this.users;
    });
  }

  getEmployees() {
    this.userService.getEmployees().subscribe({
      next: (employees: any) => {
        this.employees = employees;
        this.users = employees
          .map((user: any) => user.user)
          .filter((user: any) => user.active == 1);

        this.schedulesService.get().subscribe({
          next: (schedules: any) => {
            schedules = schedules.schedules;
            this.users = this.users.map((user: any) => {
              
              const userSchedules = schedules.find(
                (schedule: any) => schedule.employee_id === user.id
              );
              if (!userSchedules) {
                return {
                  id: user.id,
                  Name: `${user.name} ${user.last_name}`,
                  Position: 'Default Position',
                  schedule: 'No registered hours',
                  WorkingDays: 'N/A',
                  Salary: 12000,
                  Projects: 0,
                  imagePath: this.assetsPath + '/default-profile-pic.png',
                };
              }
              
              const workingDays = userSchedules.days
                .map((day: any) => day.name.charAt(0).toUpperCase()) 
                .join(', ');

              const start = moment.tz(
                userSchedules.start_time,
                'HH:mm',
                this.companyTimezone
              );
              const end = moment.tz(
                userSchedules.end_time,
                'HH:mm',
                this.companyTimezone
              );
              if (end.isBefore(start)) end.add(1, 'day');
              const totalWorkHours = end.diff(start, 'hours', true);

              return {
                id: user.id,
                Name: `${user.name} ${user.last_name}`,
                Position: 'Default Position', 
                schedule: `${totalWorkHours.toFixed()} hours per day`,
                WorkingDays: workingDays,
                Salary: 12000, 
                Projects: 0, 
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
  local_data: Employee;
  selectedImage: any = '';
  joiningDate = new FormControl();

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<AppEmployeeDialogContentComponent>,
    private employeeService: EmployeeService,
    private snackBar: MatSnackBar,
    // @Optional() is used to prevent error if no data is passed
    @Optional() @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.action = data.action;
    this.local_data = { ...data.employee };

    this.joiningDate = new FormControl();

    if (this.local_data.DateOfJoining) {
      this.joiningDate.setValue(
        new Date(this.local_data.DateOfJoining).toISOString().split('T')[0]
      ); //  existing date
    } else {
      // Set to today's date if no existing date is available
      this.joiningDate.setValue(new Date().toISOString().split('T')[0]);
    }

    // Set default image path if not already set
    if (!this.local_data.imagePath) {
      this.local_data.imagePath = 'assets/images/profile/user-1.jpg';
    }
  }

  doAction(): void {
    this.local_data.DateOfJoining = this.joiningDate.value;

    if (this.action === 'Add') {
      this.employeeService.addEmployee(this.local_data);
      this.dialogRef.close();
      // Open success dialog
      const successDialogRef = this.dialog.open(AppAddEmployeeComponent);
      successDialogRef.afterClosed().subscribe(() => {
        this.dialogRef.close({ event: 'Refresh' });
        this.openSnackBar('Employee Added successfully!', 'Close');
      });
    } else if (this.action === 'Update') {
      this.employeeService.updateEmployee(this.local_data);
      this.dialogRef.close({ event: 'Update' });
      this.openSnackBar('Employee Updated successfully!', 'Close');
    } else if (this.action === 'Delete') {
      this.employeeService.deleteEmployee(this.local_data.id);
      this.dialogRef.close({ event: 'Delete' });
      this.openSnackBar('Employee Deleted successfully!', 'Close');
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
      return; // No file selected
    }

    const mimeType = event.target.files[0].type;
    if (mimeType.match(/image\/*/) == null) {
      return; // Not an image file
    }

    const reader = new FileReader();
    reader.readAsDataURL(event.target.files[0]);

    reader.onload = (_event) => {
      if (typeof reader.result === 'string') {
        this.local_data.imagePath = reader.result; // Set selected image path
      }
    };
  }
}
