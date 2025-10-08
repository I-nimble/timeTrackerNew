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
  OnChanges,
  SimpleChanges
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
import { PermissionService } from 'src/app/services/permission.service';

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
    'permissions'
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
  availableSections: { key: string; label: string }[] = [];
  searchText: any;
  permissions: any[] = [];
  userPermissionsMap: { [userId: number]: string[] } = {};
  private _inputData: any[] = [];

  @Input() set dataSource(data: any[]) {
    this._inputData = data;
    this.dataSourceTable.data = data;
    this.loadUserPermissions();
  }

  @Output() getEmployees = new EventEmitter<any>();

  dataSourceTable = new MatTableDataSource<any>([]);
  selection = new SelectionModel<any>(true, []);


  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    public dialog: MatDialog,
    private userService: UsersService,
    private permissionService: PermissionService
  ) {}

  ngOnInit() {
    this.availableSections = [
      { key: 'users', label: 'Team Members' },
      { key: 'payments', label: 'Payments' },
    ];

    if (this.availableSections.length > 0) {
      this.selectedSection = this.availableSections[0].key;
      this.onSectionChange();
    }
  }

  ngAfterViewInit() {
    this.dataSourceTable.paginator = this.paginator;
  }

  @Input() selectedSection: string = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedSection'] && this.selectedSection) {
      this.onSectionChange();
    }
  }

  onSectionChange() {
    if (!this.selectedSection) return;

    this.permissionService.getPermissionsBySection(this.selectedSection).subscribe({
      next: (res) => {
        this.permissions = res.permissions.map((p: { id: number; code: string; description: string; defaultRoles: string[] }) => ({
          id: p.id,
          code: p.code,
          description: p.description,
          defaultRoles: p.defaultRoles,
          action: p.code.split('.')[1]
        }));
      },
      error: (err) => console.error('Error loading section permissions', err),
    });
  }

  loadUserPermissions() {
    if (!this._inputData || this._inputData.length === 0) return;

    this.permissionService.getAllUsersPermissions().subscribe({
      next: (usersPerms: any[]) => {
        usersPerms.forEach((userPerm) => {
          this.userPermissionsMap[userPerm.id] = userPerm.effectivePermissions || [];
        });
      },
      error: (err) => console.error('Error loading users permissions', err),
    });
  }

  onTogglePermissionById(userId: number, permissionId: number, code: string, allow: boolean) {
    console.log('Toggled:', { userId, permissionId, code, allow });

    if (!permissionId) {
      console.error('Permission ID not found for code:', code);
      return;
    }

    if (allow) {
      this.permissionService.setUserOverride(userId, permissionId, true).subscribe({
        next: () => {
          if (!this.userPermissionsMap[userId]) this.userPermissionsMap[userId] = [];
          if (!this.userPermissionsMap[userId].includes(code)) this.userPermissionsMap[userId].push(code);
        },
        error: (err) => console.error('Error setting permission', err),
      });
    } else {
      this.permissionService.removeUserOverride(userId, permissionId).subscribe({
        next: () => {
          this.userPermissionsMap[userId] = this.userPermissionsMap[userId].filter(c => c !== code);
        },
        error: (err) => console.error('Error removing permission', err),
      });
    }
  }
}