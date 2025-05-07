import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Project } from 'src/app/models/Project.model';
import { User } from 'src/app/models/User.model';
import { Company } from 'src/app/models/Company.model';
import { CompaniesService } from 'src/app/services/companies.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { UsersService } from 'src/app/services/users.service';
import { SharedModule } from '../shared.module';

export interface ReportFilter {
  user: User | string;
  company: Company | string;
  project: Project | string;
  byClient: boolean;
  useTimezone: boolean;
}

@Component({
  selector: 'app-reports-filter',
  standalone: true,
  imports: [
    MatCheckboxModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './reports-filter.component.html',
  styleUrl: './reports-filter.component.scss',
})
export class ReportsFilterComponent implements OnInit {
  userService = inject(UsersService);
  companiesService = inject(CompaniesService);
  projectService = inject(ProjectsService);
  fb = inject(FormBuilder);

  @Output() onSelectedFilters: EventEmitter<any> = new EventEmitter<any>();
  role = localStorage.getItem('role') ?? '';
  userId: string = 'all';
  usersList!: User[];
  projectsList!: Project[];

  companies: Company[] = [];
  projects: Project[] = [];
  users: User[] = [];
  filters = [
    {
      value: 'client',
      display: 'By Clients',
      checked: false,
      control: 'byClient',
    },
    {
      value: 'timezone',
      display: 'Use Company Timezone',
      checked: false,
      disabled: false,
      control: 'useTimezone',
    },
  ];

  type: string = 'user';
  byClient: boolean = false;

  filterForm: FormGroup = this.fb.group({
    project: ['all'],
    user: ['all'],
    company: ['all'],
    useTimezone: [false],
    byClient: [false],
  });

  ngOnInit(): void {
    if (this.role == '1') {
      this.getUsers();
      this.getCompanies();
    }
    if (this.role == '3') {
      this.getEmployees();
    }

    this.getProjects();
    this.filterForm.valueChanges.subscribe((values) => {
      this.onSelectedFilters.emit(values);
    });
    this.filterForm.get('user')?.valueChanges.subscribe((control) => {
      if (control != 'all') {
        this.getProjects(control.id)
        this.userService.setTeamMember(control.id);
      }
      else this.getProjects();
    });
    this.filterForm.get('byClient')?.valueChanges.subscribe(() => {
      this.filterForm.patchValue({
        project: 'all',
        company: 'all',
        user: 'all',
      });
    });
    this.filterForm.get('company')?.valueChanges.subscribe((control) => {
      if (control != 'all')
        this.projects = this.projectsList.filter(
          (project: Project) => project.company_id == control.id
        );
      else this.getProjects();
    });
    if (this.userService.selectedUser.id)
      this.filterForm.get('user')?.setValue(this.userService.selectedUser);
    else this.onSelectedFilters.emit(this.filterForm.value);
  }

  getUsers() {
    let body = {};
    this.userService.getUsers(body).subscribe({
      next: (users) => {
        this.usersList = users.filter((user: any) => user.active == 1);
        this.users = this.usersList.filter(
          (user: any) => user.role === 2 && user.active == 1
        );
      },
      error: (err) => {},
    });
  }

  getCompanies() {
    this.companiesService.getCompanies().subscribe({
      next: (companies: Company[]) => {
        this.companies = companies;
      },
    });
  }

  getEmployees() {
    this.userService.getEmployees().subscribe({
      next: (employees: any) => {
        this.usersList = employees.map((user: any) => user.user);
        this.users = this.usersList.filter((user: any) => user.active == 1);
      },
    });
  }

  getProjects(userId: string = '0') {
    this.handleType();
    this.projectService.get(userId, this.type).subscribe({
      next: (projects: any) => {
        this.projectsList = projects.filter(
          (project: any) => project.active == 1
        );
        this.projects = this.projectsList;
      },
    });
  }

  setFilterBy(option: any) {
    option.checked = !option.checked;
    this.filterForm.get(option.control)?.setValue(option.checked);
  }

  handleType() {
    this.type = this.byClient ? 'company' : 'user';
  }
}
