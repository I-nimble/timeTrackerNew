// Scaffolded for SD-2214; full implementation in sibling ticket.
// Wraps the legacy AppEmployeeTableComponent so the preview route can render
// using the same table that team.component / etc. already use elsewhere. The
// adapter normalises `User` into the `{ profile, role }` shape the legacy table
// reads from, and column tokens are mapped 1:1 to the legacy displayedColumns
// vocabulary. Edit/Delete clicks are handled by the embedded table's own
// MatDialog flow for now; sibling tickets can route them through these outputs.
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';

import { User } from '@features/users/models/user.model';
import {
  UsersSortDirection,
  UsersSortField,
} from '@features/users/models/users-filter.model';
import {
  UserListMeta,
  UsersListColumn,
} from '@features/users/models/users-list.model';
import { AppEmployeeTableComponent } from 'src/app/legacy/pages/apps/employee/employee-table/employee-table.component';

const ROLE_LABELS: Record<number, string> = {
  1: 'Admin',
  2: 'User',
  3: 'Client',
  4: 'Support',
};

const COLUMN_TOKEN_MAP: Record<UsersListColumn, string> = {
  select: 'select',
  name: 'nameUser',
  role: 'role',
  email: 'email',
  status: 'status',
  schedule: 'schedule',
  reports: 'reports',
  actions: 'action',
};

const DEFAULT_PERMISSIONS = {
  canView: true,
  canEdit: true,
  canManage: true,
  canDelete: true,
};

interface EmployeeTableRow {
  profile: {
    id: number;
    name: string;
    last_name: string;
    email: string;
    imagePath: string;
    image: string;
    company_id: number | null;
    position: string | number | null;
    projects: number[];
    hourly_rate: number;
  };
  role: string;
  schedule: string;
  status: string;
  active: number;
}

const adaptUser = (user: User): EmployeeTableRow => ({
  profile: {
    id: user.id,
    name: user.name,
    last_name: user.last_name,
    email: user.email,
    imagePath: user.picture ?? 'assets/images/default-user-profile-pic.webp',
    image: user.picture ?? 'assets/images/default-user-profile-pic.webp',
    company_id: user.company?.id ?? null,
    position: user.employee?.position ?? null,
    projects: [],
    hourly_rate: user.employee?.hourly_rate ?? 0,
  },
  role: ROLE_LABELS[user.role] ?? `Role ${user.role}`,
  schedule: 'Monday to Friday',
  status: user.active === 1 ? 'Online' : 'Offline',
  active: user.active,
});

@Component({
  selector: 'app-user-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppEmployeeTableComponent],
  template: `
    <app-employee-table
      [displayedColumns]="mappedColumns()"
      [dataSource]="rows()"
      [permissions]="permissions"
    />
  `,
})
export class UserListComponent {
  private readonly itemsSignal = signal<User[]>([]);
  private readonly columnsSignal = signal<UsersListColumn[]>([]);

  readonly permissions = DEFAULT_PERMISSIONS;
  readonly rows = computed(() => this.itemsSignal().map(adaptUser));
  readonly mappedColumns = computed(() =>
    this.columnsSignal().map((column) => COLUMN_TOKEN_MAP[column]),
  );

  @Input() set items(value: User[]) {
    this.itemsSignal.set(value ?? []);
  }
  @Input() set columns(value: UsersListColumn[]) {
    this.columnsSignal.set(value ?? []);
  }
  @Input() meta: UserListMeta | null = null;

  @Output() readonly delete = new EventEmitter<number>();
  @Output() readonly edit = new EventEmitter<User>();
  @Output() readonly toggleActive = new EventEmitter<number>();
  @Output() readonly pageChange = new EventEmitter<number>();
  @Output() readonly sortChange = new EventEmitter<{
    field: UsersSortField;
    direction: UsersSortDirection;
  }>();
}
