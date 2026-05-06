import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';

import { DEFAULT_USERS_LIST_COLUMNS } from '@features/workforce/models/users-list.model';
import * as fileSaver from 'file-saver';
import { of } from 'rxjs';
import { ModalComponent } from 'src/app/legacy/components/confirmation-modal/modal.component';
import { AppDateRangeDialogComponent } from 'src/app/legacy/components/date-range-dialog/date-range-dialog.component';
import { AppEmployeeDialogContentComponent } from 'src/app/legacy/pages/apps/employee/employee-dialog-content';
import { CompaniesService } from 'src/app/legacy/services/companies.service';
import { ReportsService } from 'src/app/legacy/services/reports.service';
import { SchedulesService } from 'src/app/legacy/services/schedules.service';
import { UsersService } from 'src/app/legacy/services/users.service';

import { UsersListPageComponent } from './users-list-page.component';

const createUser = (
  id: number,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  id,
  name: `User ${id}`,
  last_name: `Last ${id}`,
  email: `user${id}@example.com`,
  role: id % 4 === 0 ? 4 : id % 3 === 0 ? 3 : id % 2 === 0 ? 2 : 1,
  picture: null,
  company_id: 1,
  company: { id: 1, name: 'Inimble' },
  employee: { position: `Position ${id}` },
  activeEntry:
    id % 2 === 0
      ? { start_time: '2026-05-05T08:00:00.000Z', end_time: null }
      : null,
  ...overrides,
});

const SAMPLE_USERS: Record<string, unknown>[] = [
  createUser(1),
  createUser(2),
  createUser(3),
  createUser(4),
  createUser(5),
  createUser(6),
  createUser(7),
];

const SAMPLE_SCHEDULES = {
  schedules: [
    {
      employee_id: 1,
      days: [
        { name: 'Monday' },
        { name: 'Tuesday' },
        { name: 'Wednesday' },
        { name: 'Thursday' },
        { name: 'Friday' },
      ],
    },
    {
      employee_id: 2,
      days: [
        { name: 'Monday' },
        { name: 'Wednesday' },
        { name: 'Friday' },
        { name: 'Sunday' },
      ],
    },
  ],
};

describe('UsersListPageComponent', () => {
  let fixture: ComponentFixture<UsersListPageComponent>;
  let component: UsersListPageComponent;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;
  let companiesServiceSpy: jasmine.SpyObj<CompaniesService>;
  let reportsServiceSpy: jasmine.SpyObj<ReportsService>;
  let schedulesServiceSpy: jasmine.SpyObj<SchedulesService>;
  let dialogOpenSpy: jasmine.Spy;
  let dialogResult: unknown;

  const render = (
    role: number,
    users: Record<string, unknown>[] = SAMPLE_USERS,
    schedules = SAMPLE_SCHEDULES,
  ): void => {
    localStorage.setItem('role', String(role));
    usersServiceSpy.getUsers.and.returnValue(of(users) as never);
    schedulesServiceSpy.get.and.returnValue(of(schedules) as never);
    fixture = TestBed.createComponent(UsersListPageComponent);
    component = fixture.componentInstance;
    (component as unknown).dialog = { open: dialogOpenSpy };
    fixture.detectChanges();
  };

  beforeEach(async () => {
    localStorage.clear();
    dialogResult = null;
    usersServiceSpy = jasmine.createSpyObj<UsersService>('UsersService', [
      'getUsers',
      'delete',
    ]);
    usersServiceSpy.delete.and.returnValue(of(null) as never);
    companiesServiceSpy = jasmine.createSpyObj<CompaniesService>(
      'CompaniesService',
      ['getByOwner', 'getEmployees'],
    );
    companiesServiceSpy.getByOwner.and.returnValue(
      of({ company: { id: 1 } }) as never,
    );
    companiesServiceSpy.getEmployees.and.returnValue(of(SAMPLE_USERS) as never);
    reportsServiceSpy = jasmine.createSpyObj<ReportsService>('ReportsService', [
      'getReport',
    ]);
    reportsServiceSpy.getReport.and.returnValue(
      of(new Blob(['report'])) as never,
    );
    schedulesServiceSpy = jasmine.createSpyObj<SchedulesService>(
      'SchedulesService',
      ['get'],
    );
    dialogOpenSpy = jasmine.createSpy('open').and.callFake(
      () =>
        ({
          afterClosed: () => of(dialogResult),
        }) as never,
    );

    await TestBed.configureTestingModule({
      imports: [UsersListPageComponent],
      providers: [
        { provide: UsersService, useValue: usersServiceSpy },
        { provide: CompaniesService, useValue: companiesServiceSpy },
        { provide: ReportsService, useValue: reportsServiceSpy },
        { provide: SchedulesService, useValue: schedulesServiceSpy },
        { provide: MatDialog, useValue: { open: dialogOpenSpy } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('requests all users for admins and support roles', () => {
    render(1);

    expect(usersServiceSpy.getUsers).toHaveBeenCalledWith({
      searchField: '',
      filter: {},
    });
    expect(schedulesServiceSpy.get).toHaveBeenCalled();
    expect(component.hasUsers()).toBe(true);
    expect(component.totalPages()).toBe(2);
    expect(component.pagedUsers().length).toBe(5);
    expect(component.backendMessage()).toBe('');
    expect(component.pagedUsers()[0].scheduleLabel).toBe('Monday to Friday');
    expect(
      component.pagedUsers().some((row) => row.statusLabel === 'Online'),
    ).toBe(true);
  });

  it('requests employees for client roles', () => {
    render(3);

    expect(companiesServiceSpy.getEmployees).toHaveBeenCalledWith(1);
  });

  it('requests the current user for team members', () => {
    render(2);

    expect(usersServiceSpy.getUsers).toHaveBeenCalledWith({
      searchField: '',
      filter: { currentUser: true },
    });
  });

  it('supports external filters from parent components', () => {
    render(1);

    fixture.componentRef.setInput('filters', { searchTerm: 'user 7' });
    fixture.detectChanges();

    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].displayName).toBe('User 7 Last 7');
  });

  it('supports local pagination and sorting', () => {
    render(1);

    component.onPageChange({
      page: 2,
      pageSize: 5,
      sortBy: 'displayName',
      sortOrder: 'asc',
    });

    expect(component.currentPage()).toBe(2);
    expect(component.pagedUsers().length).toBe(2);

    component.onSortChange({
      sortBy: 'email',
      sortOrder: 'desc',
      page: 1,
      pageSize: 5,
    });

    expect(component.sortBy()).toBe('email');
    expect(component.sortOrder()).toBe('desc');
    expect(component.currentPage()).toBe(1);
    expect(component.pagedUsers()[0].email).toBe('user7@example.com');
  });

  it('allows column overrides for the dynamic table', () => {
    render(1);

    fixture.componentRef.setInput('columns', ['name', 'email', 'reports']);
    fixture.detectChanges();

    expect(component.visibleColumns().map((column) => column.id)).toEqual([
      'name',
      'email',
      'reports',
    ]);
  });

  it('shows the full default column set for the page route', () => {
    render(1);

    expect(component.columns()).toEqual(DEFAULT_USERS_LIST_COLUMNS);
    expect(component.visibleColumns().map((column) => column.id)).toEqual([
      'name',
      'role',
      'email',
      'status',
      'schedule',
      'reports',
      'actions',
    ]);
  });

  it('shows an empty-state message when no users are returned', () => {
    render(1, []);

    expect(component.hasUsers()).toBe(false);
    expect(component.backendMessage()).toBe('No users available.');
  });

  it('downloads the report from the date range modal', () => {
    render(1);
    spyOn(fileSaver, 'saveAs');
    dialogResult = {
      firstSelect: new Date('2026-05-03T00:00:00.000Z'),
      lastSelect: new Date('2026-05-09T00:00:00.000Z'),
    };

    component.downloadReport(component.pagedUsers()[0]);

    expect(dialogOpenSpy).toHaveBeenCalledWith(
      AppDateRangeDialogComponent,
      jasmine.objectContaining({ autoFocus: false }),
    );
    expect(reportsServiceSpy.getReport).toHaveBeenCalled();
    expect(fileSaver.saveAs).toHaveBeenCalled();
  });

  it('opens the employee dialog for edit actions', () => {
    render(1);
    dialogResult = true;

    component.editUser(component.pagedUsers()[0]);

    expect(dialogOpenSpy).toHaveBeenCalledWith(
      AppEmployeeDialogContentComponent,
      jasmine.objectContaining({ autoFocus: false }),
    );
    expect(usersServiceSpy.getUsers.calls.count()).toBeGreaterThan(1);
  });

  it('opens the confirmation modal before deleting a user', () => {
    render(1);
    dialogResult = true;

    component.confirmDeleteUser(component.pagedUsers()[0]);

    expect(dialogOpenSpy).toHaveBeenCalledWith(
      ModalComponent,
      jasmine.objectContaining({
        data: jasmine.objectContaining({
          action: 'delete',
          subject: 'user',
        }),
      }),
    );
    expect(usersServiceSpy.delete).toHaveBeenCalledWith(1);
  });
});
