import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';

import { User } from '@features/workforce/models/user.model';
import { DEFAULT_USERS_FILTER } from '@features/workforce/models/users-filter.model';
import {
  DEFAULT_USERS_LIST_COLUMNS,
  UserListResponse,
} from '@features/workforce/models/users-list.model';
import * as UsersActions from '@features/workforce/store/users.actions';
import * as UsersSelectors from '@features/workforce/store/users.selectors';
import { Action, Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { UsersListPageComponent } from './users-list-page.component';

class FakeStore {
  private readonly subjects = new Map<unknown, BehaviorSubject<unknown>>();
  readonly dispatch = jasmine.createSpy('dispatch');

  setSelectorValue<T>(selector: unknown, value: T): void {
    const existing = this.subjects.get(selector);
    if (existing) {
      existing.next(value);
      return;
    }

    this.subjects.set(selector, new BehaviorSubject<unknown>(value));
  }

  select<T>(selector: unknown): Observable<T> {
    const subject = this.subjects.get(selector);
    if (!subject) {
      throw new Error('No mock value configured for selector');
    }

    return subject.asObservable() as Observable<T>;
  }
}

class FakeMatDialog {
  readonly open = jasmine.createSpy('open');
}

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  role: 2,
  active: 1,
  ...overrides,
});

const buildList = (items: User[] = [buildUser()]): UserListResponse => ({
  items,
  meta: {
    total: items.length,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
    sortBy: 'name',
    sortOrder: 'asc',
  },
});

const createDialogRef = (result: boolean) =>
  ({
    afterClosed: () => of(result),
  }) as never;

describe('UsersListPageComponent', () => {
  let fixture: ComponentFixture<UsersListPageComponent>;
  let component: UsersListPageComponent;
  let store: FakeStore;
  let dialog: FakeMatDialog;

  const dispatchedActions = (): Action[] =>
    store.dispatch.calls.allArgs().map((args) => args[0] as Action);

  beforeEach(async () => {
    store = new FakeStore();
    dialog = new FakeMatDialog();

    store.setSelectorValue(UsersSelectors.selectUsersList, buildList());
    store.setSelectorValue(UsersSelectors.selectLoading, false);
    store.setSelectorValue(UsersSelectors.selectError, null);
    store.setSelectorValue(UsersSelectors.selectFilter, DEFAULT_USERS_FILTER);

    dialog.open.and.returnValue(createDialogRef(true));

    await TestBed.configureTestingModule({
      imports: [UsersListPageComponent],
      providers: [
        { provide: Store, useValue: store },
        { provide: MatDialog, useValue: dialog },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dispatches loadUsers with the default filter on init', () => {
    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.loadUsers({ filter: DEFAULT_USERS_FILTER }),
    );
  });

  it('exposes computed flags from current state', () => {
    expect(component.hasUsers()).toBe(true);
    expect(component.showSpinner()).toBe(false);
  });

  it('exposes the default columns input', () => {
    expect(component.columns()).toEqual(DEFAULT_USERS_LIST_COLUMNS);
  });

  it('honors a columns input override', () => {
    fixture.componentRef.setInput('columns', ['name', 'email', 'actions']);
    fixture.detectChanges();

    expect(component.columns()).toEqual(['name', 'email', 'actions']);
  });

  it('hides the header when title input is empty', () => {
    expect(component.title()).toBe('');
    expect(
      fixture.nativeElement.querySelector('.users-list-page__header'),
    ).toBeNull();
  });

  it('renders a header when title input is set', () => {
    fixture.componentRef.setInput('title', 'Team Members');
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector(
      '.users-list-page__title',
    );
    expect(header?.textContent?.trim()).toBe('Team Members');
  });

  it('shows the spinner when loading and the list is empty', () => {
    store.setSelectorValue(UsersSelectors.selectLoading, true);
    store.setSelectorValue(UsersSelectors.selectUsersList, buildList([]));
    fixture.detectChanges();

    expect(component.hasUsers()).toBe(false);
    expect(component.showSpinner()).toBe(true);
  });

  it('onSearch dispatches setFilter then loadUsers with merged filter', () => {
    store.dispatch.calls.reset();

    component.onSearch('foo');

    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.setFilter({
        filter: { searchField: 'foo', currentPage: 1 },
      }),
    );
    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.loadUsers({
        filter: { ...DEFAULT_USERS_FILTER, searchField: 'foo', currentPage: 1 },
      }),
    );
  });

  it('onFilterByRole resets currentPage to 1', () => {
    store.dispatch.calls.reset();

    component.onFilterByRole(2);

    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.setFilter({ filter: { role: 2, currentPage: 1 } }),
    );
    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.loadUsers({
        filter: { ...DEFAULT_USERS_FILTER, role: 2, currentPage: 1 },
      }),
    );
  });

  it('onPageChange preserves the rest of the filter', () => {
    store.dispatch.calls.reset();

    component.onPageChange(3);

    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.loadUsers({
        filter: { ...DEFAULT_USERS_FILTER, currentPage: 3 },
      }),
    );
  });

  it('onSortChange dispatches with merged sort and resets the page', () => {
    store.dispatch.calls.reset();

    component.onSortChange({ field: 'email', direction: 'desc' });

    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.loadUsers({
        filter: {
          ...DEFAULT_USERS_FILTER,
          sortField: 'email',
          sortDirection: 'desc',
          currentPage: 1,
        },
      }),
    );
  });

  it('openForm opens the invite dialog and refreshes the list on close', () => {
    store.dispatch.calls.reset();

    component.openForm();

    expect(dialog.open).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.loadUsers({ filter: DEFAULT_USERS_FILTER }),
    );
  });

  it('openForm opens the update dialog with the mapped employee payload', () => {
    const user = buildUser({
      id: 5,
      picture: 'avatar.png',
      company: { id: 9, name: 'Acme' },
      employee: { id: 11, position: 'Paralegal', hourly_rate: 25 },
    });

    component.openForm(user);

    expect(dialog.open).toHaveBeenCalled();
    const [, config] = dialog.open.calls.mostRecent().args;
    expect(config.data.action).toBe('Update');
    expect(config.data.employee.profile).toEqual({
      id: 5,
      name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      company_id: 9,
      position: 'Paralegal',
      projects: [],
      hourly_rate: 25,
      imagePath: 'avatar.png',
    });
  });

  it('onDelete opens the confirmation dialog and dispatches deleteUser when confirmed', () => {
    store.dispatch.calls.reset();

    component.onDelete(7);

    expect(dialog.open).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.deleteUser({ id: 7 }),
    );
  });

  it('onDelete does not dispatch deleteUser when the confirmation is canceled', () => {
    dialog.open.and.returnValue(createDialogRef(false));
    store.dispatch.calls.reset();

    component.onDelete(7);

    expect(dispatchedActions()).not.toContain(
      UsersActions.deleteUser({ id: 7 }),
    );
  });

  it('onToggleActive dispatches toggleActive', () => {
    store.dispatch.calls.reset();

    component.onToggleActive(9);

    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.toggleActive({ id: 9 }),
    );
  });
});
