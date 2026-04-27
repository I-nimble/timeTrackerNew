import { CommonModule } from '@angular/common';
import {
  Component,
  Inject,
  Optional,
  ViewChild,
  AfterViewInit,
  OnInit,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { RouterModule } from '@angular/router';

import { TablerIconsModule } from 'angular-tabler-icons';
import { AppEmployeesReportsComponent } from 'src/app/components/dashboard2/app-employees-reports/app-employees-reports.component';
import { TeamProductivityComponent } from 'src/app/components/dashboard2/team-productivity/team-productivity.component';
import {
  ReportFilter,
  ReportsFilterComponent,
} from 'src/app/components/reports-filter/reports-filter.component';
import { TimerComponent } from 'src/app/components/timer-component/timer.component';
import { MaterialModule } from 'src/app/legacy/material.module';
import { CompaniesService } from 'src/app/services/companies.service';
import { PermissionService } from 'src/app/services/permission.service';
import { UsersService } from 'src/app/services/users.service';
import { environment } from 'src/environments/environment';

import { AppPermissionTableComponent } from './permission-table/permission-table.component';
import { EmployeeDetailsComponent } from '../employee/employee-details/employee-details.component';

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
    AppPermissionTableComponent,
  ],
  standalone: true,
})
export class AppPermissionComponent implements OnInit {
  @ViewChild(MatTable, { static: true }) table: MatTable<any> =
    Object.create(null);
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
  companyId: number | string | null = 'all';
  rolesMap: Record<number, string> = {};
  searchText = '';
  dataSource: any[] = [];
  activeStatus: number | string = 1;
  availableSections: { key: string; label: string }[] = [];
  selectedSection: string = this.availableSections[0]?.key || '';

  constructor(
    public dialog: MatDialog,
    private userService: UsersService,
    private companiesService: CompaniesService,
    private permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    this.getUsers();
    this.getCompanies();
    this.loadSections();
  }

  getCompanies() {
    this.companiesService.getCompanies().subscribe({
      next: (companies: any) => {
        this.companies = companies;
      },
    });
  }

  loadSections(): void {
    this.permissionService.getSections().subscribe({
      next: (sections) => {
        this.availableSections = sections;
        if (sections.length > 0) {
          this.selectedSection = sections[0].key;
        }
      },
      error: (err) => console.error('Error loading sections:', err),
    });
  }

  applyCombinedFilters(): void {
    const value = this.searchText ? this.searchText.trim().toLowerCase() : '';

    this.dataSource = this.users.filter((user: any) => {
      const matchesActive = String(user.active) === '1';

      const matchesSearch =
        (user.name && user.name.toLowerCase().includes(value)) ||
        (user.last_name && user.last_name.toLowerCase().includes(value)) ||
        (user.email && user.email.toLowerCase().includes(value));

      if (!this.companyId || this.companyId === 'all') {
        return matchesSearch && matchesActive;
      }

      const selectedCompany = this.companies.find(
        (c) => c.id == this.companyId,
      );
      const isAdmin = user.role == 1;
      const isOwner = selectedCompany && user.id == selectedCompany.owner_id;
      const isEmployee =
        user.employee && user.employee.company_id == this.companyId;
      const isEmployer =
        (Array.isArray(user.companies_users) &&
          user.companies_users.some(
            (cu: any) => cu.company_id == this.companyId,
          )) ||
        (user.company && user.company.id == this.companyId);
      const isRelatedCompany =
        Array.isArray(user.companies) &&
        user.companies.some(
          (c: any) => c.id == this.companyId || c == this.companyId,
        );

      const included =
        matchesSearch &&
        matchesActive &&
        (isEmployee || isOwner || isAdmin || isEmployer || isRelatedCompany);

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
            imagePath:
              user.imagePath || this.assetsPath + '/default-profile-pic.png',
          },
          role: this.rolesMap[user.role] || 'Other',
          userRoleId: user.role,
        }));
        this.dataSource = this.users;
        this.getUsersPictures();
      },
      error: (err) => console.error('Error fetching users:', err),
    });
  }

  onSectionChange(): void {}

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
          if (image) {
            user.profile.imagePath = image;
          }
        },
        complete: () => {
          count++;
          if (count === this.users.length) {
            this.dataSource = this.users;
            this.loaded = true;
          }
        },
      });
    });
  }

  setUser(user: any): void {
    this.userService.setUserInformation(user);
  }

  loadRoles() {
    this.userService.getRoles().subscribe(
      (roles: any) => {
        (roles as any[]).forEach(
          (role) => (this.rolesMap[role.id] = role.name),
        );
        this.getUsers();
      },
      (err: any) => console.error('Error fetching roles:', err),
    );
  }
}
