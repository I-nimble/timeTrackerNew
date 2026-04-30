import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { User } from '@features/workforce/models/user.model';
import {
  DEFAULT_USERS_FILTER,
  UsersFilter,
} from '@features/workforce/models/users-filter.model';
import {
  DEFAULT_USERS_LIST_COLUMNS,
  UserListResponse,
} from '@features/workforce/models/users-list.model';
import * as UsersActions from '@features/workforce/store/users.actions';
import * as UsersSelectors from '@features/workforce/store/users.selectors';
import { MemoizedSelector } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { UsersListPageComponent } from './users-list-page.component';

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

describe('UsersListPageComponent', () => {
  let fixture: ComponentFixture<UsersListPageComponent>;
  let component: UsersListPageComponent;
  let store: MockStore;
  let dispatchSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersListPageComponent],
      providers: [provideMockStore()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    store.overrideSelector(
      UsersSelectors.selectUsersList as MemoizedSelector<
        object,
        UserListResponse
      >,
      buildList(),
    );
    store.overrideSelector(UsersSelectors.selectLoading, false);
    store.overrideSelector(UsersSelectors.selectError, null);
    store.overrideSelector(
      UsersSelectors.selectFilter as MemoizedSelector<object, UsersFilter>,
      DEFAULT_USERS_FILTER,
    );
    store.overrideSelector(UsersSelectors.selectFormOpen, false);
    store.overrideSelector(UsersSelectors.selectEditingUser, null);

    fixture = TestBed.createComponent(UsersListPageComponent);
    component = fixture.componentInstance;
    dispatchSpy = spyOn(store, 'dispatch').and.callThrough();
    fixture.detectChanges();
  });

  it('dispatches loadUsers with default filter on init', () => {
    expect(dispatchSpy).toHaveBeenCalledWith(
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

  it('shows spinner when loading and list is empty', () => {
    store.overrideSelector(UsersSelectors.selectLoading, true);
    store.overrideSelector(
      UsersSelectors.selectUsersList as MemoizedSelector<
        object,
        UserListResponse
      >,
      buildList([]),
    );
    store.refreshState();
    fixture.detectChanges();

    expect(component.hasUsers()).toBe(false);
    expect(component.showSpinner()).toBe(true);
  });

  it('onSearch dispatches setFilter then loadUsers with merged filter', () => {
    dispatchSpy.calls.reset();

    component.onSearch('foo');

    expect(dispatchSpy).toHaveBeenCalledWith(
      UsersActions.setFilter({
        filter: { searchField: 'foo', currentPage: 1 },
      }),
    );
    expect(dispatchSpy).toHaveBeenCalledWith(
      UsersActions.loadUsers({
        filter: { ...DEFAULT_USERS_FILTER, searchField: 'foo', currentPage: 1 },
      }),
    );
  });

  it('onFilterByRole resets currentPage to 1', () => {
    dispatchSpy.calls.reset();

    component.onFilterByRole(2);

    expect(dispatchSpy).toHaveBeenCalledWith(
      UsersActions.setFilter({ filter: { role: 2, currentPage: 1 } }),
    );
    expect(dispatchSpy).toHaveBeenCalledWith(
      UsersActions.loadUsers({
        filter: { ...DEFAULT_USERS_FILTER, role: 2, currentPage: 1 },
      }),
    );
  });

  it('onPageChange preserves the rest of the filter', () => {
    dispatchSpy.calls.reset();

    component.onPageChange(3);

    expect(dispatchSpy).toHaveBeenCalledWith(
      UsersActions.loadUsers({
        filter: { ...DEFAULT_USERS_FILTER, currentPage: 3 },
      }),
    );
  });

  it('onSortChange dispatches with merged sort and resets the page', () => {
    dispatchSpy.calls.reset();

    component.onSortChange({ field: 'email', direction: 'desc' });

    expect(dispatchSpy).toHaveBeenCalledWith(
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

  it('openForm and closeForm dispatch the corresponding actions', () => {
    dispatchSpy.calls.reset();
    const user = buildUser({ id: 5 });

    component.openForm(user);
    component.closeForm();

    expect(dispatchSpy).toHaveBeenCalledWith(UsersActions.openForm({ user }));
    expect(dispatchSpy).toHaveBeenCalledWith(UsersActions.closeForm());
  });

  it('onDelete dispatches deleteUser only when confirm returns true', () => {
    dispatchSpy.calls.reset();
    spyOn(window, 'confirm').and.returnValues(false, true);

    component.onDelete(7);
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      UsersActions.deleteUser({ id: 7 }),
    );

    component.onDelete(7);
    expect(dispatchSpy).toHaveBeenCalledWith(
      UsersActions.deleteUser({ id: 7 }),
    );
  });

  it('onToggleActive dispatches toggleActive', () => {
    dispatchSpy.calls.reset();

    component.onToggleActive(9);

    expect(dispatchSpy).toHaveBeenCalledWith(
      UsersActions.toggleActive({ id: 9 }),
    );
  });

  it('onSaveUser routes to updateUser when id is truthy', () => {
    dispatchSpy.calls.reset();
    const user = buildUser({ id: 42 });

    component.onSaveUser(user);

    expect(dispatchSpy).toHaveBeenCalledWith(UsersActions.updateUser({ user }));
  });

  it('onSaveUser routes to createUser when id is falsy', () => {
    dispatchSpy.calls.reset();
    const user = buildUser({ id: 0 });

    component.onSaveUser(user);

    expect(dispatchSpy).toHaveBeenCalledWith(UsersActions.createUser({ user }));
  });
});
