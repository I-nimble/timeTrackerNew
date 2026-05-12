import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';

import { User } from '@features/users/models/user.model';
import { DEFAULT_USERS_LIST_COLUMNS } from '@features/users/models/users-list.model';
import { UsersApiService } from '@features/users/services/users-api.service';
import * as fileSaver from 'file-saver';
import { of } from 'rxjs';
import { ModalComponent } from 'src/app/legacy/components/confirmation-modal/modal.component';
import { AppDateRangeDialogComponent } from 'src/app/legacy/components/date-range-dialog/date-range-dialog.component';
import { AppEmployeeDialogContentComponent } from 'src/app/legacy/pages/apps/employee/employee-dialog-content';
import { ReportsService } from 'src/app/legacy/services/reports.service';
import { UsersService } from 'src/app/legacy/services/users.service';

import { UsersListPageComponent } from './users-list-page.component';

const buildUser = (
  id: number,
  overrides: Record<string, unknown> = {},
): User => ({
  id,
  name: `User ${id}`,
  last_name: `Last ${id}`,
  email: `user${id}@example.com`,
  role: 2,
  active: 1,
  picture: null,
  online: id % 2 === 0,
  active_entry:
    id % 2 === 0
      ? {
          user_id: id,
          start_time: '2026-05-08T08:00:00.000Z',
          end_time: null,
          status: 0,
        }
      : null,
  company: { id: 1, name: 'Inimble' },
  employee: {
    id: 100 + id,
    user_id: id,
    company_id: 1,
    company: { id: 1, name: 'Inimble' },
    position_id: 5,
    position: { id: 5, title: `Position ${id}` },
    hourly_rate: 10 + id,
    projects: [{ id: 1, name: 'Project A' }],
    schedule: [
      {
        id: 200 + id,
        employee_id: 100 + id,
        start_time: '14:00:00',
        end_time: '23:00:00',
        days: [
          { name: 'Monday' },
          { name: 'Tuesday' },
          { name: 'Wednesday' },
          { name: 'Thursday' },
          { name: 'Friday' },
        ],
      },
    ],
  },
  ...overrides,
});

const SAMPLE_USERS: User[] = [
  buildUser(1),
  buildUser(2),
  buildUser(3),
  buildUser(4),
  buildUser(5),
  buildUser(6),
  buildUser(7),
];

describe('UsersListPageComponent', () => {
  let fixture: ComponentFixture<UsersListPageComponent>;
  let component: UsersListPageComponent;
  let usersApiSpy: jasmine.SpyObj<UsersApiService>;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;
  let reportsServiceSpy: jasmine.SpyObj<ReportsService>;
  let dialogOpenSpy: jasmine.Spy;
  let dialogResult: unknown;

  const render = (role: number, users: User[] = SAMPLE_USERS): void => {
    localStorage.setItem('role', String(role));
    usersApiSpy.getUserList.and.returnValue(of(users) as never);
    fixture = TestBed.createComponent(UsersListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    localStorage.clear();
    dialogResult = null;

    usersApiSpy = jasmine.createSpyObj<UsersApiService>('UsersApiService', [
      'getUserList',
    ]);
    usersServiceSpy = jasmine.createSpyObj<UsersService>('UsersService', [
      'delete',
    ]);
    usersServiceSpy.delete.and.returnValue(of(null) as never);
    reportsServiceSpy = jasmine.createSpyObj<ReportsService>('ReportsService', [
      'getReport',
    ]);
    reportsServiceSpy.getReport.and.returnValue(
      of(new Blob(['report'])) as never,
    );
    dialogOpenSpy = jasmine
      .createSpy('open')
      .and.callFake(() => ({ afterClosed: () => of(dialogResult) }) as never);

    await TestBed.configureTestingModule({
      imports: [UsersListPageComponent],
      providers: [
        { provide: UsersApiService, useValue: usersApiSpy },
        { provide: UsersService, useValue: usersServiceSpy },
        { provide: ReportsService, useValue: reportsServiceSpy },
        { provide: MatDialog, useValue: { open: dialogOpenSpy } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('loads users from the unified endpoint on init', () => {
    render(1);

    expect(usersApiSpy.getUserList).toHaveBeenCalled();
    expect(component.hasUsers()).toBe(true);
    expect(component.totalPages()).toBe(2);
    expect(component.pagedUsers().length).toBe(5);
    expect(component.pagedUsers()[0].scheduleLabel).toBe('Monday to Friday');
    expect(
      component.pagedUsers().some((row) => row.statusLabel === 'Online'),
    ).toBe(true);
  });

  it('drives the status pill from record.online', () => {
    render(1);

    const onlineRow = component.allUsers().find((row) => row.id === 2);
    const offlineRow = component.allUsers().find((row) => row.id === 3);

    expect(onlineRow?.statusLabel).toBe('Online');
    expect(offlineRow?.statusLabel).toBe('Offline');
  });

  it('exposes default columns for the page route', () => {
    render(1);

    expect(component.columns()).toEqual(DEFAULT_USERS_LIST_COLUMNS);
    expect(component.visibleColumns().map((column) => column.id)).toEqual([
      'name',
      'email',
      'status',
      'schedule',
      'reports',
      'actions',
    ]);
  });

  it('hides report and action columns for non-managers', () => {
    render(5);

    expect(component.visibleColumns().map((column) => column.id)).toEqual([
      'name',
      'email',
      'status',
      'schedule',
    ]);
  });

  it('respects custom column overrides', () => {
    render(1);

    fixture.componentRef.setInput('columns', ['name', 'email', 'reports']);
    fixture.detectChanges();

    expect(component.visibleColumns().map((column) => column.id)).toEqual([
      'name',
      'email',
      'reports',
    ]);
  });

  it('applies external filters from inputs', () => {
    render(1);

    fixture.componentRef.setInput('filters', { searchTerm: 'user 7' });
    fixture.detectChanges();

    expect(component.filteredUsers().length).toBe(1);
    expect(component.filteredUsers()[0].name).toBe('User 7');
    expect(component.filteredUsers()[0].last_name).toBe('Last 7');
  });

  it('paginates and sorts the rows locally', () => {
    render(1);

    component.onPageChange({
      page: 2,
      pageSize: 5,
      sortBy: 'name',
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
    expect(component.pagedUsers()[0].email).toBe('user7@example.com');
  });

  it('shows the empty state when no users come back', () => {
    render(1, []);

    expect(component.hasUsers()).toBe(false);
    expect(component.backendMessage()).toBe('No users available.');
  });

  it('routes row actions to edit and delete handlers', () => {
    render(1);
    const editSpy = spyOn(component, 'editUser');
    const deleteSpy = spyOn(component, 'confirmDeleteUser');
    const row = component.pagedUsers()[0];

    component.onRowAction({ action: { id: 'edit' }, row } as never);
    expect(editSpy).toHaveBeenCalledWith(row);

    component.onRowAction({ action: { id: 'delete' }, row } as never);
    expect(deleteSpy).toHaveBeenCalledWith(row);
  });

  it('opens the date-range modal and downloads the report', () => {
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

  it('skips the report request when the date dialog is cancelled', () => {
    render(1);
    dialogResult = null;

    component.downloadReport(component.pagedUsers()[0]);

    expect(reportsServiceSpy.getReport).not.toHaveBeenCalled();
  });

  it('opens the employee dialog and reloads after editing', () => {
    render(1);
    dialogResult = true;
    const initialCalls = usersApiSpy.getUserList.calls.count();

    component.editUser(component.pagedUsers()[0]);

    expect(dialogOpenSpy).toHaveBeenCalledWith(
      AppEmployeeDialogContentComponent,
      jasmine.objectContaining({ autoFocus: false }),
    );
    expect(usersApiSpy.getUserList.calls.count()).toBeGreaterThan(initialCalls);
  });

  it('confirms deletion before calling the users service', () => {
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

  it('does not delete when the confirmation modal is cancelled', () => {
    render(1);
    dialogResult = false;

    component.confirmDeleteUser(component.pagedUsers()[0]);

    expect(usersServiceSpy.delete).not.toHaveBeenCalled();
  });
});
