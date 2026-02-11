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
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { AppAddEmployeeComponent } from '../add/add.component';
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
import moment from 'moment-timezone';
import * as filesaver from 'file-saver';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TimerComponent } from 'src/app/components/timer-component/timer.component';
import { AppDateRangeDialogComponent } from 'src/app/components/date-range-dialog/date-range-dialog.component';
import { SelectionModel } from '@angular/cdk/collections';
import { AppEmployeeDialogContentComponent } from '../employee-dialog-content';
import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';

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
    TourMatMenuModule
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
    'action'
  ];
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
          (emp: any) => emp.profile.id !== result.id
        );
      }
      else {
        this.getEmployees.emit();
      }
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

    this.userService.setUserInformation(user.profile);
  }

  downloadReport(user: any): void {
    let selectedIds = this.selection.selected.map((u:any) => u.profile.id);
    if (!selectedIds.includes(user.profile.id)) {
      selectedIds.push(user.profile.id);
    }
    this.filters = {
      user: { id: selectedIds.length > 1 ? selectedIds : user.profile.id },
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
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSourceTable.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSourceTable.data.forEach(row => this.selection.select(row));
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }
}