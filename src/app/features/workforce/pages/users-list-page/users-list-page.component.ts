import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UserFormModalComponent } from '@features/workforce/components/user-form-modal/user-form-modal.component';
import { UserListComponent } from '@features/workforce/components/user-list/user-list.component';
import { UsersControlsComponent } from '@features/workforce/components/users-controls/users-controls.component';
import { User } from '@features/workforce/models/user.model';
import {
  DEFAULT_USERS_FILTER,
  UsersFilter,
  UsersSortDirection,
  UsersSortField,
} from '@features/workforce/models/users-filter.model';
import {
  DEFAULT_USERS_LIST_COLUMNS,
  UserListResponse,
  UsersListColumn,
} from '@features/workforce/models/users-list.model';
import * as UsersActions from '@features/workforce/store/users.actions';
import * as UsersSelectors from '@features/workforce/store/users.selectors';
import { Store } from '@ngrx/store';

const EMPTY_USER_LIST: UserListResponse = {
  items: [],
  meta: {
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: DEFAULT_USERS_FILTER.pageSize ?? 10,
    sortBy: DEFAULT_USERS_FILTER.sortField ?? 'name',
    sortOrder: DEFAULT_USERS_FILTER.sortDirection ?? 'asc',
  },
};

@Component({
  selector: 'app-users-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressSpinnerModule,
    UsersControlsComponent,
    UserListComponent,
    UserFormModalComponent,
  ],
  templateUrl: './users-list-page.component.html',
  styleUrl: './users-list-page.component.scss',
})
export class UsersListPageComponent implements OnInit {
  private readonly store = inject(Store);

  readonly columns = input<UsersListColumn[]>(DEFAULT_USERS_LIST_COLUMNS);
  readonly title = input<string>('');

  readonly usersList = toSignal(
    this.store.select(UsersSelectors.selectUsersList),
    {
      initialValue: EMPTY_USER_LIST,
    },
  );
  readonly loading = toSignal(this.store.select(UsersSelectors.selectLoading), {
    initialValue: false,
  });
  readonly error = toSignal(this.store.select(UsersSelectors.selectError), {
    initialValue: null,
  });
  readonly filter = toSignal(this.store.select(UsersSelectors.selectFilter), {
    initialValue: DEFAULT_USERS_FILTER,
  });
  readonly formOpen = toSignal(
    this.store.select(UsersSelectors.selectFormOpen),
    {
      initialValue: false,
    },
  );
  readonly editingUser = toSignal(
    this.store.select(UsersSelectors.selectEditingUser),
    {
      initialValue: null,
    },
  );

  readonly hasUsers = computed(() => this.usersList().items.length > 0);
  readonly showSpinner = computed(() => this.loading() && !this.hasUsers());

  ngOnInit(): void {
    this.store.dispatch(
      UsersActions.loadUsers({ filter: DEFAULT_USERS_FILTER }),
    );
  }

  onSearch(searchField: string): void {
    this.applyFilter({ searchField, currentPage: 1 });
  }

  onFilterByRole(role: number | undefined): void {
    this.applyFilter({ role, currentPage: 1 });
  }

  onSortChange(change: {
    field: UsersSortField;
    direction: UsersSortDirection;
  }): void {
    this.applyFilter({
      sortField: change.field,
      sortDirection: change.direction,
      currentPage: 1,
    });
  }

  onPageChange(currentPage: number): void {
    this.applyFilter({ currentPage });
  }

  openForm(user?: User): void {
    this.store.dispatch(UsersActions.openForm({ user }));
  }

  closeForm(): void {
    this.store.dispatch(UsersActions.closeForm());
  }

  onDelete(id: number): void {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    this.store.dispatch(UsersActions.deleteUser({ id }));
  }

  onToggleActive(id: number): void {
    this.store.dispatch(UsersActions.toggleActive({ id }));
  }

  onSaveUser(user: User): void {
    if (user.id) {
      this.store.dispatch(UsersActions.updateUser({ user }));
    } else {
      this.store.dispatch(UsersActions.createUser({ user }));
    }
  }

  private applyFilter(patch: Partial<UsersFilter>): void {
    const next: UsersFilter = { ...this.filter(), ...patch };
    this.store.dispatch(UsersActions.setFilter({ filter: patch }));
    this.store.dispatch(UsersActions.loadUsers({ filter: next }));
  }
}
