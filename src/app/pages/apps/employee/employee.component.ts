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
  ReportsFilterComponent,
} from 'src/app/components/reports-filter/reports-filter.component';
import moment from 'moment-timezone';
import * as filesaver from 'file-saver';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TimerComponent } from 'src/app/components/timer-component/timer.component';
import { AppActivityReportsComponent } from '../../../components/dashboard2/app-activity-reports/activity-reports.component';
import { EmployeeDetailsComponent } from './employee-details/employee-details.component';
import { AppDateRangeDialogComponent } from 'src/app/components/date-range-dialog/date-range-dialog.component';
import { SelectionModel } from '@angular/cdk/collections';
import { AppEmployeesReportsComponent } from 'src/app/components/dashboard2/app-employees-reports/app-employees-reports.component';
import { TeamProductivityComponent } from 'src/app/components/dashboard2/team-productivity/team-productivity.component';
import { AppEmployeeTableComponent } from "./employee-table/employee-table.component";
import { AppEmployeeDialogContentComponent } from './employee-dialog-content';
import { AppEmployeeDialogContentComponent, AppEmployeeTableComponent } from "./employee-table/employee-table.component";

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
    TeamProductivityComponent,
    AppEmployeesReportsComponent,
    EmployeeDetailsComponent,
    AppEmployeeTableComponent
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
    multipleUsers: false,
  };
  userRole = localStorage.getItem('role');
  companies: any[] = [];
  companyId: number | null = null;

  searchText: string = '';

  displayedColumns: string[] = [
    'select',
    'name',
    'schedule',
    'salary',
    'projects',
    'action',
  ];
  customColumns = [
    'select',
    'name',
    'status',
    'schedule',
    'reports',
    'action',
  ];
  dataSource: any[] = []
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

  loadCompany(): void {
    this.companiesService.getByOwner().subscribe((company: any) => {
      this.company = company.company.name;
      if(company.company.timezone) {
        this.companyTimezone = this.companyTimezone.split(':')[0];
      }
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

        this.schedulesService.get().subscribe({
          next: (schedules: any) => {
            schedules = schedules.schedules;
            this.users = this.users.map((user: any) => {
              const userSchedules = schedules.find(
                (schedule: any) => schedule.employee_id === user.id
              );
              if (!userSchedules) {
                return ({
                  profile: {
                    id: user.user.id,
                    company_id: user.company_id,
                    name: user.user.name,
                    last_name: user.user.last_name,
                    email: user.user.email,
                    position: user.position_id,
                    projects: user.projects.map((project: any) => project.id),
                    Salary: 0,
                    imagePath: this.assetsPath + '/default-profile-pic.png',
                  },
                  schedule: 'No registered schedule',
                });
              };
              
              const workingDays = userSchedules.days
                .map((day: any) => day.name)
                .sort((a: string, b: string) => {
                  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                  return weekDays.indexOf(a) - weekDays.indexOf(b);
                });

              const scheduleString = this.formatDaysRange(workingDays);

              return ({
                profile : {
                  id: user.user.id,
                  company_id: user.company_id,
                  name: user.user.name,
                  last_name: user.user.last_name,
                  email: user.user.email,
                  position: user.position_id,
                  projects: user.projects.map((project: any) => project.id),
                  Salary: 0, 
                  imagePath: this.assetsPath + '/default-profile-pic.png',
                },
                schedule: scheduleString,
              });
            });
            this.getUsersPictures();
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

  getUsersPictures() {
    this.users.forEach((user: any) => {
      this.userService.getProfilePic(user.profile.id).subscribe({
        next: (image: any) => {
          if(image) {
            user.profile.imagePath = image;
          }
        }
      });
    });
    this.dataSource = this.users;
    this.loaded = true;
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
    let selectedIds = this.selection.selected.map(u => u.id);
    if (!selectedIds.includes(user.id)) {
      selectedIds.push(user.id);
    }
    this.filters = {
      user: { id: selectedIds.length > 1 ? selectedIds : user.id },
      company: 'all',
      project: 'all',
      byClient: false,
      useTimezone: false,
      multipleUsers: selectedIds.length > 1,
    };

    const dialogRef = this.dialog.open(AppDateRangeDialogComponent, {
      data: {},
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const datesRange = {
          firstSelect: result.firstSelect,
          lastSelect: result.lastSelect,
        };

        this.employees.map((employee: any) => {
          user.id == employee.user.id ? user = employee.user : null;
        });
        this.reportsService
          .getReport(datesRange, user, this.filters)
          .subscribe((v) => {
            let filename;
            let display_name;
            if (this.filters.multipleUsers) {
              display_name = 'multiple_users';
            }
            else {
              display_name = `${user.name}_${user.last_name}`;
            }
    
            filename = `I-nimble_Report_${display_name}_${moment( 
              new Date(datesRange.firstSelect)
            ).format('DD-MM-YYYY')}_${moment(
              new Date(datesRange.lastSelect)
            ).format('DD-MM-YYYY')}.xlsx`;
    
            filesaver.saveAs(v, filename);
          });
      }
    });
  }

  isAllSelected(): boolean {
    if (!this.dataSource || !this.dataSource) {
      return false;
    }
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    if (!this.dataSource || !this.dataSource) {
      return;
    }
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.forEach((row) => this.selection.select(row));
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.position + 1
    }`;
  }
}