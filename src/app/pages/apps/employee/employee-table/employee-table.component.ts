import { SelectionModel } from '@angular/cdk/collections';
import { DatePipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Inject,
  Input,
  OnInit,
  Output,
  Optional,
  ViewChild,
  EventEmitter,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { RouterModule } from '@angular/router';

import { TablerIconsModule } from 'angular-tabler-icons';
import * as filesaver from 'file-saver';
import moment from 'moment-timezone';
import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';
import { AppDateRangeDialogComponent } from 'src/app/components/date-range-dialog/date-range-dialog.component';
import { ReportFilter } from 'src/app/components/reports-filter/reports-filter.component';
import { TimerComponent } from 'src/app/components/timer-component/timer.component';
import { MaterialModule } from 'src/app/legacy/material.module';
import { Employee } from 'src/app/pages/apps/employee/employee';
import { CompaniesService } from 'src/app/services/companies.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { PositionsService } from 'src/app/services/positions.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { ReportsService } from 'src/app/services/reports.service';
import { SchedulesService } from 'src/app/services/schedules.service';
import { UsersService } from 'src/app/services/users.service';
import { environment } from 'src/environments/environment';

import { AppAddEmployeeComponent } from '../add/add.component';
import { AppEmployeeDialogContentComponent } from '../employee-dialog-content';

@Component({
  templateUrl: './employee-table.component.html',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    CommonModule,
    RouterModule,
    TimerComponent,
    MatPaginatorModule,
    TourMatMenuModule,
  ],
  selector: 'app-employee-table',
  standalone: true,
})
export class AppEmployeeTableComponent implements AfterViewInit {
  @ViewChild(MatTable, { static: true }) table: MatTable<any> =
    Object.create(null);

  @Input() displayedColumns: string[] = [
    'select',
    'name',
    'status',
    'schedule',
    'projects',
    'action',
  ];
  users: any[] = [];
  employees: any[] = [];
  loaded = false;
  company: any;
  companyTimezone = 'America/Los_Angeles';
  timeZone = 'America/Caracas';
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

  private _inputData: any[] = [];

  @Input() set dataSource(data: any[]) {
    this._inputData = data || [];
    const sorted = Array.isArray(this._inputData)
      ? [...this._inputData].sort((a: any, b: any) => {
          const aActive = !!(a.activeEntry || a.status === 'Online');
          const bActive = !!(b.activeEntry || b.status === 'Online');
          if (aActive === bActive) return 0;
          return aActive ? -1 : 1;
        })
      : [];
    this.dataSourceTable.data = sorted;
  }
  @Input() permissions: any;
  @Output() getEmployees = new EventEmitter<any>();

  dataSourceTable = new MatTableDataSource<any>([]);
  selection = new SelectionModel<any>(true, []);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    this.dataSourceTable.paginator = this.paginator;
  }

  constructor(
    public dialog: MatDialog,
    private employeesService: EmployeesService,
    private userService: UsersService,
    private schedulesService: SchedulesService,
    private reportsService: ReportsService,
    private companiesService: CompaniesService,
  ) {}

  openDialog(action: string, employee: Employee | any): void {
    const dialogRef = this.dialog.open(AppEmployeeDialogContentComponent, {
      data: { action, employee, permissions: this.permissions },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Delete' && result?.id) {
        this.dataSourceTable.data = this.dataSourceTable.data.filter(
          (emp: any) => emp.profile.id !== result.id,
        );
      } else {
        this.getEmployees.emit();
      }
    });
  }

  // Helper function to format days as a range "Monday to Friday"
  formatDaysRange(days: string[]): string {
    const weekDays = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    const indices = days
      .map((day) => weekDays.indexOf(day))
      .filter((i) => i !== -1)
      .sort((a, b) => a - b);
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
      user.id == employee.user.id ? (user = employee.user) : null;
    });

    this.userService.setUserInformation(user.profile);
  }

  downloadReport(user: any): void {
    const selectedIds = this.selection.selected.map((u: any) => u.profile.id);
    if (!selectedIds.includes(user.profile.id)) {
      selectedIds.push(user.profile.id);
    }
    this.filters = {
      user: { id: selectedIds.length > 1 ? selectedIds : [user.profile.id] },
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
      if (!result) return;
      const datesRange = {
        firstSelect: result.firstSelect,
        lastSelect: result.lastSelect,
      };
      const multipleUsers = this.filters.multipleUsers;
      const userId = user?.profile?.id ?? user?.id;
      const requestUser = {
        id: multipleUsers ? this.filters.user.id : userId,
      };
      this.reportsService
        .getReport(datesRange, requestUser, this.filters)
        .subscribe({
          next: (v: any) => {
            let displayName = 'multiple_users';
            if (!multipleUsers) {
              const name = user?.profile?.name ?? user?.name ?? '';
              const last = user?.profile?.last_name ?? user?.last_name ?? '';
              displayName = `${name}_${last}`.replace(/\s+/g, '_');
            }
            const filename = `I-nimble_Report_${displayName}_${moment(
              result.firstSelect,
            ).format('DD-MM-YYYY')}_${moment(result.lastSelect).format(
              'DD-MM-YYYY',
            )}.xlsx`;
            filesaver.saveAs(v, filename);
          },
          error: (error: any) => {
            console.error('Error downloading report:', error);
          },
        });
    });
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSourceTable.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSourceTable.data.forEach((row) => this.selection.select(row));
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }
}
