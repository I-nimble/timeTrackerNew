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
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';
import { environment } from 'src/environments/environment';
import {
  ReportFilter,
} from 'src/app/components/reports-filter/reports-filter.component';
import { TimerComponent } from 'src/app/components/timer-component/timer.component';
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  templateUrl: './permission-table.component.html',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    CommonModule,
    RouterModule,
    TimerComponent,
    MatPaginatorModule
  ],
  selector: 'app-permission-table',
  standalone: true,
})
export class AppPermissionTableComponent implements AfterViewInit {
  @ViewChild(MatTable, { static: true }) table: MatTable<any> =
    Object.create(null);

  @Input() displayedColumns: string[] = [
    'name',
    'role',
    'action'
  ];
  users: any[] = [];
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
    this._inputData = data;
    this.dataSourceTable.data = data;
  }

  @Output() getEmployees = new EventEmitter<any>();

  dataSourceTable = new MatTableDataSource<any>([]);
  selection = new SelectionModel<any>(true, []);


  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    this.dataSourceTable.paginator = this.paginator;
  }

  constructor(
    public dialog: MatDialog,
    private userService: UsersService,
  ) {}

  @Output() userAction = new EventEmitter<{action: string, user: any}>();

  onAction(action: string, user: any) {
    this.userAction.emit({ action, user });
  }

  setUser(user: any): void {
    this.userService.setUserInformation(user.profile);
  }
}