import {
  Component,
  EventEmitter,
  Inject,
  Optional,
  Output,
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
import { FormArray, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { AppEmployeeDialogContentComponent, AppEmployeeTableComponent } from '../employee/employee-table/employee-table.component';
import { AppEmployeeTableComponent } from '../employee/employee-table/employee-table.component';
import { AppEmployeeDialogContentComponent } from '../employee/employee-dialog-content';

@Component({
  templateUrl: './team.component.html',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    CommonModule,
    RouterModule,
    EmployeeDetailsComponent,
    AppEmployeeTableComponent
  ],
  standalone: true,
})
export class TeamComponent {
  @Output() dataSourceChange = new EventEmitter<any[]>();
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
    'nameUser',
    'role',
    'email',
    'action',
  ];
  customColumns: string[] = ['nameUser', 'role', 'email', 'action',];
  dataSource: any[] = [];
  selection = new SelectionModel<any>(true, []);

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
    this.dataSource = this.users.filter((user: any) => user.profile.company_id === this.companyId);
  }

  loadCompany(): void {
    this.companiesService.getByOwner().subscribe((company: any) => {
      this.company = company.company.name;
    });
  }

  applyCombinedFilters(): void {
    const value = this.searchText.trim().toLowerCase();
    this.dataSource = this.users.filter((user: any) => {
      const matchesSearch =
        (user.profile.name && user.profile.name.toLowerCase().includes(value)) ||
        (user.profile.last_name && user.profile.last_name.toLowerCase().includes(value)) ||
        (user.profile.email && user.profile.email.toLowerCase().includes(value));
      const matchesCompany = this.companyId ? user.profile.company_id === this.companyId : true;
      return matchesSearch && matchesCompany;
    });
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
        .filter((user: any) => user.user.active == 1 && user.user.role == 2);
        this.users = this.users.map((user: any) => {
          return ({
              profile: {
              id: user.user.id,
              company_id: user.company_id,
              name: user.user.name,
              last_name: user.user.last_name,
              email: user.user.email,
              position: user.position_id || user.position?.id || '',
              projects: user.projects ? user.projects.map((project: any) => project.id) : [],
              imagePath: '/assets/images/default-user-profile-pic.png',
            },
            role: user.position?.title || 'Other',
          });
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
      this.userService.getProfilePic(user.profile.id).subscribe({
        next: (response: any) => {
          if(!response) return;
          user.profile.imagePath = response;
        },
        error: (err) => {
          console.error('Error fetching profile picture:', err);
        },
      });
    });
    this.dataSource = this.users;
    this.loaded = true;
  }

  setUser(user: any): void {
    this.employees.map((employee: any) => {
      user.id == employee.user.id ? user = employee.user : null;
    });

    this.userService.setUserInformation(user);
  }
}