/* import { CommonModule } from '@angular/common';

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { NgxRolesService, NgxPermissionsService } from 'ngx-permissions';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MaterialModule } from 'src/app/material.module';

@Component({
    selector: 'app-permission',
    templateUrl: './permission.component.html',
    styleUrls: ['./permission.component.scss'],
    imports: [MaterialModule, CommonModule, FormsModule, ReactiveFormsModule, MatButtonToggleModule],
    providers: []
})
export class AppPermissionComponent implements OnInit {
  currentRole!: string;

  currentPermissions!: string[];

  permissionsOfRole: any = {
    ADMIN: ['canAdd', 'canDelete', 'canEdit', 'canRead'],
    MANAGER: ['canAdd', 'canEdit', 'canRead'],
    GUEST: ['canRead'],
  };

  private readonly _destroy$ = new Subject<void>();

  constructor(
    private rolesSrv: NgxRolesService,
    private permissionsSrv: NgxPermissionsService
  ) {}

  ngOnInit(): void {
    this.currentRole = 'ADMIN';
    this.currentPermissions = ['canAdd', 'canDelete', 'canEdit', 'canRead'];
  }

  onPermissionChange() {
    this.currentPermissions = this.permissionsOfRole[this.currentRole];
    this.rolesSrv.flushRolesAndPermissions();
    this.rolesSrv.addRoleWithPermissions(
      this.currentRole,
      this.currentPermissions
    );
  }
}
 */

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
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';
import { CompaniesService } from 'src/app/services/companies.service';
import { environment } from 'src/environments/environment';
import {
  ReportFilter,
  ReportsFilterComponent,
} from 'src/app/components/reports-filter/reports-filter.component';
import { TimerComponent } from 'src/app/components/timer-component/timer.component';
import { EmployeeDetailsComponent } from '../employee/employee-details/employee-details.component';
import { AppEmployeesReportsComponent } from 'src/app/components/dashboard2/app-employees-reports/app-employees-reports.component';
import { TeamProductivityComponent } from 'src/app/components/dashboard2/team-productivity/team-productivity.component';
import { AppPermissionTableComponent } from './permission-table/permission-table.component';

@Component({
  selector: 'app-permission',
  templateUrl: './permission.component.html',
  styleUrls: ['./permission.component.scss'],
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
  AppPermissionTableComponent
],
  standalone: true,
})

export class AppPermissionComponent {
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
  companyId: number | string | null = 'all';
  rolesMap: Record<number, string> = {};
  searchText: string = '';
  dataSource: any[] = [];
  activeStatus: number | string = 'all';

  constructor(
    public dialog: MatDialog,
    private userService: UsersService,
    private companiesService: CompaniesService,
  ) {}

  ngOnInit(): void {
    this.loadRoles();    
    this.getUsers();
    this.getCompanies();
  }

  getCompanies() {
    this.companiesService.getCompanies().subscribe({
      next: (companies: any) => {
        this.companies = companies;
      },
    });
  }

  applyCombinedFilters(): void {
    const value = this.searchText ? this.searchText.trim().toLowerCase() : '';
      this.dataSource = this.users.filter((user: any) => {
        const matchesSearch =
          (user.name && user.name.toLowerCase().includes(value)) ||
          (user.last_name && user.last_name.toLowerCase().includes(value)) ||
          (user.email && user.email.toLowerCase().includes(value));

        const matchesActive =
          this.activeStatus === 'all' || String(user.active) === String(this.activeStatus);

        if (!this.companyId || this.companyId === 'all') {
          return matchesSearch && matchesActive;
        }
        const selectedCompany = this.companies.find(c => c.id == this.companyId);
        const isAdmin = user.role == 1;
        const isOwner = selectedCompany && user.id == selectedCompany.owner_id;
        const isEmployee = user.employee && user.employee.company_id == this.companyId;
        const isEmployer =
          (Array.isArray(user.companies_users) &&
            user.companies_users.some((cu: any) => cu.company_id == this.companyId)) ||
          (user.company && user.company.id == this.companyId);
        const isRelatedCompany =
          Array.isArray(user.companies) &&
          user.companies.some((c: any) => c.id == this.companyId || c == this.companyId);

        const included =
          matchesSearch &&
          matchesActive &&
          (isEmployee || isOwner || isAdmin || isEmployer || isRelatedCompany);

        if (included) {
          let reason = [];
          if (isEmployee) reason.push('employee');
          if (isOwner) reason.push('owner');
          if (isAdmin) reason.push('admin');
          if (isEmployer) reason.push('employer');
          if (isRelatedCompany) reason.push('relatedCompany');
        }
        return included;
      });
  }

  getUsers() {
    this.userService.getUsers({ searchField: '', filter: {} }).subscribe({
      next: (users: any[]) => {
        this.users = users.map((user: any) => ({
          ...user,
          profile: {
            id: user.id,
            name: user.name,
            last_name: user.last_name,
            email: user.email,
            imagePath: user.imagePath || this.assetsPath + '/default-profile-pic.png',
          },
          role: this.rolesMap[user.role] || 'Other',
          userRoleId: user.role
        }));
        console.log('All users from endpoint:', this.users);
        this.dataSource = this.users;
        this.getUsersPictures();
      },
      error: (err) => console.error('Error fetching users:', err),
    });
  }

  getUsersPictures() {
    let count = 0;
    if (!this.users.length) {
      this.dataSource = [];
      this.loaded = true;
      return;
    }
    this.users.forEach((user: any) => {
      this.userService.getProfilePic(user.profile.id).subscribe({
        next: (image: any) => {
          if(image) {
            user.profile.imagePath = image;
          }
        },
        complete: () => {
          count++;
          if (count === this.users.length) {
            this.dataSource = this.users;
            this.loaded = true;
          }
        }
      });
    });
  }

  setUser(user: any): void {
    this.userService.setUserInformation(user);
  }

  onUserAction(event: {action: string, user: any}) {
    if (event.action === 'view') {
      this.setUser(event.user);
    } else if (event.action === 'edit') {
    } else if (event.action === 'delete') {
    }
  }

  loadRoles() {
    this.userService.getRoles().subscribe(
      (roles: any) => {
        (roles as any[]).forEach(role => this.rolesMap[role.id] = role.name);
        this.getUsers();
      },
      (err: any) => console.error('Error fetching roles:', err)
    );
  }
}
