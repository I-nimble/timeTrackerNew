import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';
import { AppEmployeeDialogContentComponent } from 'src/app/pages/apps/employee/employee-dialog-content';

interface EmployeeDialogPermissions {
  canView: boolean;
  canEdit: boolean;
  canManage: boolean;
  canDelete: boolean;
}

interface EmployeeDialogProfile {
  id: number;
  name: string;
  last_name: string;
  email: string;
  company_id: number | null;
  position: number | string | null;
  projects: number[];
  hourly_rate: number;
  imagePath: string | null;
}

interface EmployeeDialogData {
  action: 'Invite' | 'Update';
  employee: {
    profile: EmployeeDialogProfile;
  };
  permissions: EmployeeDialogPermissions;
}

const DEFAULT_EMPLOYEE_DIALOG_PERMISSIONS: EmployeeDialogPermissions = {
  canView: true,
  canEdit: true,
  canManage: true,
  canDelete: true,
};

const EMPTY_EMPLOYEE_DIALOG_PROFILE: EmployeeDialogProfile = {
  id: 0,
  name: '',
  last_name: '',
  email: '',
  company_id: null,
  position: null,
  projects: [],
  hourly_rate: 0,
  imagePath: null,
};

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
  ],
  templateUrl: './users-list-page.component.html',
  styleUrl: './users-list-page.component.scss',
})
export class UsersListPageComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);

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
    const dialogRef = this.dialog.open(AppEmployeeDialogContentComponent, {
      autoFocus: false,
      data: this.buildEmployeeDialogData(user),
    });

    dialogRef.afterClosed().subscribe(() => {
      this.reloadUsers();
    });
  }

  onDelete(id: number): void {
    const dialogRef = this.dialog.open(ModalComponent, {
      autoFocus: false,
      data: {
        action: 'Delete',
        subject: 'user',
        message: 'This action cannot be undone.',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.store.dispatch(UsersActions.deleteUser({ id }));
      }
    });
  }

  onToggleActive(id: number): void {
    this.store.dispatch(UsersActions.toggleActive({ id }));
  }

  private applyFilter(patch: Partial<UsersFilter>): void {
    const next: UsersFilter = { ...this.filter(), ...patch };
    this.store.dispatch(UsersActions.setFilter({ filter: patch }));
    this.store.dispatch(UsersActions.loadUsers({ filter: next }));
  }

  private reloadUsers(): void {
    this.store.dispatch(UsersActions.loadUsers({ filter: this.filter() }));
  }

  private buildEmployeeDialogData(user?: User): EmployeeDialogData {
    if (!user) {
      return {
        action: 'Invite',
        employee: {
          profile: EMPTY_EMPLOYEE_DIALOG_PROFILE,
        },
        permissions: DEFAULT_EMPLOYEE_DIALOG_PERMISSIONS,
      };
    }

    return {
      action: 'Update',
      employee: {
        profile: {
          id: user.id,
          name: user.name,
          last_name: user.last_name,
          email: user.email,
          company_id: user.company?.id ?? null,
          position: user.employee?.position ?? null,
          projects: [],
          hourly_rate: user.employee?.hourly_rate ?? 0,
          imagePath: user.picture ?? null,
        },
      },
      permissions: DEFAULT_EMPLOYEE_DIALOG_PERMISSIONS,
    };
  }
}
