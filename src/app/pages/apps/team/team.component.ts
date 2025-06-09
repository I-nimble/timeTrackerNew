import {
  Component,
  Inject,
  Optional,
  ViewChild,
} from '@angular/core';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { AppAddEmployeeComponent } from '../employee/add/add.component';
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
} from 'src/app/components/reports-filter/reports-filter.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmployeeDetailsComponent } from '../employee/employee-details/employee-details.component';
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  templateUrl: './team.component.html',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    CommonModule,
    RouterModule,
    EmployeeDetailsComponent
  ],
  standalone: true,
})
export class TeamComponent {
  @ViewChild(MatTable, { static: true }) table: MatTable<any> =
    Object.create(null);
  users: any[] = [];
  employees: any[] = [];
  loaded: boolean = false;
  company: any;
  timeZone: string = 'America/Caracas';
  assetsPath: string = environment.assets;
  filters: ReportFilter = {
    user: 'all',
    company: 'all',
    project: 'all',
    byClient: false,
    useTimezone: false,
    multipleUsers: false,
  };
  userRole = localStorage.getItem('role');
  companies: any[] = [];
  companyId: number | null = null;

  searchText: any;

  displayedColumns: string[] = [
    'name',
    'role',
    'email',
  ];
  dataSource = new MatTableDataSource<Employee>([]);
  selection = new SelectionModel<any>(true, []);

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
        this.users = this.users.map((user: any) => {
          return {
            id: user.user.id,
            company_id: user.company_id,
            name: user.user.name,
            last_name: user.user.last_name,
            email: user.user.email,
            role: user.position?.title || 'Other',
            imagePath: '/assets/images/default-user-profile-pic.png',
          };
        });
        this.getProfilePics();
      },
      error: (err) => {
        console.error('Error fetching employees:', err);
      },
    });
  }

  getProfilePics() {
    this.users.map((user: any) => {
      this.userService.getProfilePic(user.id).subscribe({
        next: (response: any) => {
          if(!response) return;
          user.imagePath = response;
        },
        error: (err) => {
          console.error('Error fetching profile picture:', err);
        },
      });
    });
    this.dataSource.data = this.users;
    this.loaded = true;
  }

  setUser(user: any): void {
    this.employees.map((employee: any) => {
      user.id == employee.user.id ? user = employee.user : null;
    });

    this.userService.setUserInformation(user);
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
  templateUrl: '../employee/employee-dialog-content.html',
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
