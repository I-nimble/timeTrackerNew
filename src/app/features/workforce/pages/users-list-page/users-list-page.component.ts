import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';

import {
  DEFAULT_USERS_LIST_COLUMNS,
  UsersListColumn,
} from '@features/workforce/models/users-list.model';
import { DynamicTableComponent } from '@shared/components/dynamic-table/dynamic-table.component';
import {
  DynamicTableCellContext,
  DynamicTableColumn,
  DynamicTablePageChange,
  DynamicTableRowActionEvent,
  DynamicTableSortChange,
  DynamicSortOrder,
} from '@shared/models/dynamic-table.model';
import { saveAs } from 'file-saver';
import moment from 'moment-timezone';
import { EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ModalComponent } from 'src/app/legacy/components/confirmation-modal/modal.component';
import { AppDateRangeDialogComponent } from 'src/app/legacy/components/date-range-dialog/date-range-dialog.component';
import { AppEmployeeDialogContentComponent } from 'src/app/legacy/pages/apps/employee/employee-dialog-content';
import { CompaniesService } from 'src/app/legacy/services/companies.service';
import { EmployeesService } from 'src/app/legacy/services/employees.service';
import { EntriesService } from 'src/app/legacy/services/entries.service';
import { ReportsService } from 'src/app/legacy/services/reports.service';
import { SchedulesService } from 'src/app/legacy/services/schedules.service';
import { UsersService } from 'src/app/legacy/services/users.service';
import { MaterialModule } from 'src/app/material.module';

interface UsersListPageFilters {
  searchTerm?: string;
  companyId?: number | string | null;
  role?: number | string | null;
  status?: 'all' | 'online' | 'offline';
  predicate?: (row: UsersListRow) => boolean;
}

interface LegacyEmployeeSchedule {
  employee_id?: number | string | null;
  days?: { name?: string | null }[] | null;
}

interface LegacyEmployee {
  id?: number | string | null;
  position?: string | number | null;
  hourly_rate?: number | null;
  schedule?: LegacyEmployeeSchedule[] | null;
}

interface LegacyUserRecord extends Record<string, unknown> {
  id?: number | string;
  name?: string;
  last_name?: string;
  email?: string;
  role?: number | string;
  active?: number | boolean | string;
  picture?: string | null;
  imagePath?: string | null;
  company_id?: number | string | null;
  company?: {
    id?: number | string | null;
    name?: string | null;
  } | null;
  employee?: LegacyEmployee | null;
  activeEntry?: {
    start_time?: string | null;
    end_time?: string | null;
  } | null;
  entries?:
    | {
        start_time?: string | null;
        end_time?: string | null;
      }[]
    | null;
  profile?: LegacyUserRecord | null;
  user?: LegacyUserRecord | null;
}

interface ScheduleRecord {
  employee_id?: number | string | null;
  days?:
    | {
        name?: string | null;
      }[]
    | null;
}

interface UsersListRow {
  id: number;
  employee_id?: number;
  name: string;
  last_name: string;
  displayName: string;
  email: string;
  pictureUrl: string;
  role: number;
  roleLabel: string;
  statusLabel: string;
  scheduleLabel: string;
  reportsLabel: string;
  positionLabel: string;
  companyName: string;
  companyId: number | null;
}

const ROLE_LABELS: Record<number, string> = {
  1: 'Admin',
  2: 'User',
  3: 'Client',
  4: 'Support',
};

const DEFAULT_PAGE_SIZE = 5;
const DEFAULT_EMPTY_MESSAGE = 'No users available.';
const DEFAULT_PROFILE_PIC = 'assets/images/default-user-profile-pic.png';
const ROLE_WITH_ACTIONS = new Set([1, 3, 4]);
const WEEK_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

@Component({
  selector: 'app-users-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamicTableComponent, MaterialModule],
  templateUrl: './users-list-page.component.html',
  styleUrl: './users-list-page.component.scss',
})
export class UsersListPageComponent implements OnInit {
  @ViewChild('reportCell', { static: true })
  set reportCellTemplate(
    template: TemplateRef<DynamicTableCellContext<UsersListRow>> | undefined,
  ) {
    this.reportCellTemplateRef.set(template ?? null);
  }

  private readonly usersService = inject(UsersService);
  private readonly employeesService = inject(EmployeesService);
  private readonly companiesService = inject(CompaniesService);
  private readonly schedulesService = inject(SchedulesService);
  private readonly reportsService = inject(ReportsService);
  private readonly entriesService = inject(EntriesService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly columns = input<UsersListColumn[]>(DEFAULT_USERS_LIST_COLUMNS);
  readonly filters = input<UsersListPageFilters>({});

  private readonly rawUsers = signal<LegacyUserRecord[]>([]);
  private readonly scheduleLookup = signal<Record<number, string>>({});
  private readonly onlineUserIds = signal<Set<number>>(new Set<number>());
  private readonly reportCellTemplateRef = signal<TemplateRef<
    DynamicTableCellContext<UsersListRow>
  > | null>(null);
  private readonly usersLoaded = signal<boolean>(false);
  private readonly schedulesLoaded = signal<boolean>(false);
  private readonly entriesLoaded = signal<boolean>(false);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(DEFAULT_PAGE_SIZE);
  readonly sortBy = signal<string>('displayName');
  readonly sortOrder = signal<DynamicSortOrder>('asc');

  readonly allUsers = computed(() =>
    this.mapUsers(this.rawUsers(), this.scheduleLookup(), this.onlineUserIds()),
  );

  readonly filteredUsers = computed(() =>
    this.applyFilters(this.allUsers(), this.filters()),
  );

  readonly hasUsers = computed(() => this.filteredUsers().length > 0);

  readonly backendMessage = computed(() => {
    if (this.error()) {
      return this.error() ?? DEFAULT_EMPTY_MESSAGE;
    }

    if (!this.loading() && !this.hasUsers()) {
      return DEFAULT_EMPTY_MESSAGE;
    }

    return '';
  });

  readonly tableColumns = computed<DynamicTableColumn<UsersListRow>[]>(() => {
    const reportTemplate = this.reportCellTemplateRef();
    const columns: DynamicTableColumn<UsersListRow>[] = [
      {
        id: 'name',
        header: 'User',
        accessor: 'displayName',
        sortable: true,
        sortKey: 'displayName',
        renderer: {
          type: 'avatar-name',
          imageAccessor: 'pictureUrl',
          titleAccessor: 'displayName',
          subtitleAccessor: 'email',
          imageFallback: DEFAULT_PROFILE_PIC,
        },
      },
      {
        id: 'email',
        header: 'Email',
        accessor: 'email',
        sortable: true,
        sortKey: 'email',
      },
      {
        id: 'status',
        header: 'Status',
        accessor: 'statusLabel',
        sortable: true,
        sortKey: 'statusLabel',
        renderer: {
          type: 'status-pill',
          valueAccessor: 'statusLabel',
          palettes: {
            online: {
              backgroundColor: '#E8F5E9',
              color: '#1B5E20',
            },
            offline: {
              backgroundColor: '#FDECEA',
              color: '#B3261E',
            },
          },
          defaultPalette: {
            backgroundColor: '#E0E0E0',
            color: '#424242',
          },
        },
      },
      {
        id: 'schedule',
        header: 'Schedule',
        accessor: 'scheduleLabel',
        sortable: true,
        sortKey: 'scheduleLabel',
      },
      {
        id: 'reports',
        header: 'Reports',
        accessor: 'reportsLabel',
        cellTemplate: reportTemplate ?? undefined,
      },
    ];

    if (this.canManageUsers()) {
      columns.push({
        id: 'actions',
        header: 'Actions',
        renderer: {
          type: 'actions',
          triggerIcon: 'more_vert',
          items: [
            {
              id: 'edit',
              label: 'Edit',
              icon: 'edit',
            },
            {
              id: 'delete',
              label: 'Delete',
              icon: 'delete',
            },
          ],
        },
      });
    }

    return columns;
  });

  readonly visibleColumns = computed(() => {
    const allowedColumns = this.columns();
    const tableColumns = this.tableColumns();

    if (!Array.isArray(allowedColumns)) {
      return tableColumns;
    }

    return tableColumns.filter((column) =>
      allowedColumns.includes(column.id as UsersListColumn),
    );
  });

  readonly sortedUsers = computed(() => {
    const sortField = this.sortBy();
    const direction = this.sortOrder();

    return [...this.filteredUsers()].sort((left, right) => {
      const leftValue = this.getSortableValue(left, sortField);
      const rightValue = this.getSortableValue(right, sortField);

      if (leftValue === rightValue) {
        return 0;
      }

      const comparison = leftValue > rightValue ? 1 : -1;
      return direction === 'asc' ? comparison : -comparison;
    });
  });

  readonly totalPages = computed(() => {
    const totalItems = this.sortedUsers().length;
    return Math.max(1, Math.ceil(totalItems / this.pageSize()));
  });

  readonly displayedPage = computed(() =>
    Math.min(this.currentPage(), this.totalPages()),
  );

  readonly pagedUsers = computed(() => {
    const startIndex = (this.displayedPage() - 1) * this.pageSize();
    return this.sortedUsers().slice(startIndex, startIndex + this.pageSize());
  });

  ngOnInit(): void {
    this.loadUsers();
    this.loadSchedules();
    this.loadActiveEntries();
  }

  onPageChange(change: DynamicTablePageChange): void {
    if (typeof change.pageSize === 'number' && change.pageSize > 0) {
      this.pageSize.set(change.pageSize);
    }

    if (typeof change.sortBy === 'string' && change.sortBy) {
      this.sortBy.set(change.sortBy);
    }

    if (change.sortOrder) {
      this.sortOrder.set(change.sortOrder);
    }

    this.currentPage.set(change.page);
  }

  onSortChange(change: DynamicTableSortChange): void {
    this.sortBy.set(change.sortBy);
    this.sortOrder.set(change.sortOrder);
    this.currentPage.set(change.page);

    if (change.pageSize > 0) {
      this.pageSize.set(change.pageSize);
    }
  }

  onRowAction(event: DynamicTableRowActionEvent<UsersListRow>): void {
    if (event.action.id === 'edit') {
      this.editUser(event.row);
      return;
    }

    if (event.action.id === 'delete') {
      this.confirmDeleteUser(event.row);
    }
  }

  public downloadReport(row: UsersListRow): void {
    const dialogRef = this.dialog.open(AppDateRangeDialogComponent, {
      autoFocus: false,
      width: '420px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result?.firstSelect || !result?.lastSelect) {
        return;
      }

      const datesRange = {
        firstSelect: result.firstSelect,
        lastSelect: result.lastSelect,
      };

      this.reportsService
        .getReport(datesRange, { id: row.id }, this.buildReportFilters(row))
        .subscribe({
          next: (blob: Blob) => {
            saveAs(
              blob,
              this.buildReportFileName(
                row,
                result.firstSelect,
                result.lastSelect,
              ),
            );
          },
          error: (error) => {
            console.error('Error downloading report:', error);
            this.error.set('Unable to download report.');
          },
        });
    });
  }

  public editUser(row: UsersListRow): void {
    console.log('EDIT USER: ', row);
    const rawUser = this.rawUsers().find((u) => Number(u.id) === row.id);
    const dialogRef = this.dialog.open(AppEmployeeDialogContentComponent, {
      autoFocus: false,
      width: '720px',
      data: {
        action: 'Update',
        employee: rawUser
          ? this.buildDialogEmployeeData(rawUser)
          : this.toEmployeeDialogData(row),
        permissions: this.buildPermissions(),
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      this.loadUsers();
      this.loadSchedules();
    });
  }

  public confirmDeleteUser(row: UsersListRow): void {
    const dialogRef = this.dialog.open(ModalComponent, {
      autoFocus: false,
      data: {
        action: 'delete',
        subject: 'user',
        message: `Delete ${row.displayName}?`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.usersService.delete(row.id).subscribe({
        next: () => {
          this.loadUsers();
          this.loadSchedules();
        },
        error: () => this.error.set('Unable to delete user.'),
      });
    });
  }

  private loadUsers(): void {
    this.resetLoadState();
    this.error.set(null);

    const role = Number(localStorage.getItem('role') ?? 0);

    if (role === 1 || role === 2 || role === 4) {
      // TODO: check if this is fine or get all users with role 2 for admins/support, and get users (own) for team members
      this.employeesService
        .get()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (employees: unknown) => {
            const filtered = this.normalizeUserList(employees).filter(
              (u) => Number(u.active ?? 0) === 1,
            );
            this.rawUsers.set(filtered);
            this.markUsersLoaded();
          },
          error: () => {
            this.rawUsers.set([]);
            this.error.set('Unable to load users.');
            this.markUsersLoaded();
          },
        });
      return;
    }

    if (role === 3) {
      this.companiesService
        .getByOwner()
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          switchMap((response: unknown) => {
            const companyId = this.resolveCompanyId(response);

            if (!companyId) {
              this.error.set('Unable to determine the client company.');
              this.rawUsers.set([]);
              this.markUsersLoaded();
              return EMPTY;
            }

            return this.companiesService.getEmployees(companyId);
          }),
        )
        .subscribe({
          next: (users: unknown) => {
            this.rawUsers.set(this.normalizeUserList(users));
            this.markUsersLoaded();
          },
          error: (error) => {
            console.error('Error fetching client employees', error);
            this.rawUsers.set([]);
            this.error.set('Unable to load users.');
            this.markUsersLoaded();
          },
        });
      return;
    }
  }

  private loadSchedules(): void {
    this.schedulesLoaded.set(false);

    this.schedulesService
      .get()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: unknown) => {
          this.scheduleLookup.set(this.buildScheduleLookup(response));
          this.markSchedulesLoaded();
        },
        error: (error) => {
          console.error('Error fetching schedules:', error);
          this.scheduleLookup.set({});
          this.markSchedulesLoaded();
        },
      });
  }

  private loadActiveEntries(): void {
    const today = new Date();
    const start = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const end = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    this.entriesService
      .getAllEntries({ start_time: start, end_time: end })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: unknown) => {
          const entries = this.isRecord(response)
            ? (response['entries'] as unknown[])
            : Array.isArray(response)
              ? response
              : [];
          const ids = new Set<number>();
          if (Array.isArray(entries)) {
            entries.forEach((entry) => {
              if (this.isRecord(entry) && Number(entry['status']) === 0) {
                const uid = Number(entry['user_id']);
                if (uid) ids.add(uid);
              }
            });
          }
          this.onlineUserIds.set(ids);
          this.markEntriesLoaded();
        },
        error: () => {
          this.onlineUserIds.set(new Set<number>());
          this.markEntriesLoaded();
        },
      });
  }

  private mapUsers(
    users: LegacyUserRecord[],
    scheduleLookup: Record<number, string>,
    onlineUserIds: Set<number>,
  ): UsersListRow[] {
    console.log('Mapping users with schedule lookup:', scheduleLookup);
    console.log('users list', users);
    return users.map((user) =>
      this.mapUser(user, scheduleLookup, onlineUserIds),
    );
  }

  private mapUser(
    user: LegacyUserRecord,
    scheduleLookup: Record<number, string>,
    onlineUserIds: Set<number>,
  ): UsersListRow {
    const resolvedUser = this.resolveUser(user);
    const id = Number(user.id ?? 0);
    const name = this.resolveText(resolvedUser.name, 'User');
    const lastName = this.resolveText(resolvedUser.last_name, '');
    const roleNumber = Number(resolvedUser.role ?? 0);
    const roleLabel = ROLE_LABELS[roleNumber] ?? `Role ${roleNumber || 'N/A'}`;

    return {
      id,
      employee_id: Number(resolvedUser.id ?? 0),
      name,
      last_name: lastName,
      displayName: `${name} ${lastName}`.trim(),
      email: this.resolveText(resolvedUser.email, 'N/A'),
      pictureUrl:
        this.resolveText(resolvedUser.picture, '') ||
        this.resolveText(resolvedUser.imagePath, '') ||
        DEFAULT_PROFILE_PIC,
      role: roleNumber,
      roleLabel,
      statusLabel: onlineUserIds.has(id) ? 'Online' : 'Offline',
      scheduleLabel: this.resolveScheduleLabel(
        resolvedUser,
        id,
        scheduleLookup,
      ),
      reportsLabel: 'Download',
      positionLabel: this.resolveText(resolvedUser.employee?.position, 'N/A'),
      companyName: this.resolveText(resolvedUser.company?.name, 'N/A'),
      companyId:
        Number(resolvedUser.company_id ?? resolvedUser.company?.id ?? null) ||
        null,
    };
  }

  private resolveScheduleLabel(
    user: LegacyUserRecord,
    id: number,
    scheduleLookup: Record<number, string>,
  ): string {
    const embedded = user.employee?.schedule;
    if (Array.isArray(embedded) && embedded.length > 0) {
      const allDays = new Set<string>();
      embedded.forEach((s) => {
        (s.days ?? []).forEach((d) => {
          const name = this.resolveText(d.name, '');
          if (name) allDays.add(name);
        });
      });
      const ordered = this.sortDays(Array.from(allDays));
      return ordered.length
        ? this.formatDaysRange(ordered)
        : 'No registered schedule';
    }
    return scheduleLookup[id] ?? 'No registered schedule';
  }

  private normalizeUserList(users: unknown): LegacyUserRecord[] {
    if (Array.isArray(users)) {
      return users
        .map((item) =>
          this.isRecord(item) ? (item as LegacyUserRecord) : null,
        )
        .filter((item): item is LegacyUserRecord => item !== null);
    }

    if (this.isRecord(users)) {
      const possibleList = users['items'] ?? users['users'] ?? users['data'];

      if (Array.isArray(possibleList)) {
        return possibleList
          .map((item) =>
            this.isRecord(item) ? (item as LegacyUserRecord) : null,
          )
          .filter((item): item is LegacyUserRecord => item !== null);
      }
    }

    return [];
  }

  private buildScheduleLookup(response: unknown): Record<number, string> {
    const schedules = this.normalizeScheduleList(response);
    const groupedDays = new Map<number, Set<string>>();

    console.log('SCHEDULES', schedules);
    console.log('USERS', this.rawUsers());
    schedules.forEach((schedule) => {
      const employeeId = Number(schedule.employee_id ?? 0);
      if (!employeeId) {
        return;
      }

      if (!groupedDays.has(employeeId)) {
        groupedDays.set(employeeId, new Set<string>());
      }

      const dayNames = Array.isArray(schedule.days)
        ? schedule.days
            .map((day) => this.resolveText(day?.name, ''))
            .filter((day): day is string => day.length > 0)
        : [];

      const currentDays = groupedDays.get(employeeId);
      dayNames.forEach((day) => currentDays?.add(day));
    });

    const lookup: Record<number, string> = {};

    groupedDays.forEach((days, employeeId) => {
      const orderedDays = this.sortDays(Array.from(days));
      lookup[employeeId] = orderedDays.length
        ? this.formatDaysRange(orderedDays)
        : 'No registered schedule';
    });

    return lookup;
  }

  private normalizeScheduleList(response: unknown): ScheduleRecord[] {
    if (Array.isArray(response)) {
      return response
        .map((item) => (this.isRecord(item) ? (item as ScheduleRecord) : null))
        .filter((item): item is ScheduleRecord => item !== null);
    }

    if (this.isRecord(response)) {
      const possibleList = response['schedules'] ?? response['data'];

      if (Array.isArray(possibleList)) {
        return possibleList
          .map((item) =>
            this.isRecord(item) ? (item as ScheduleRecord) : null,
          )
          .filter((item): item is ScheduleRecord => item !== null);
      }
    }

    return [];
  }

  private formatDaysRange(days: string[]): string {
    const indices = days
      .map((day) => WEEK_DAYS.indexOf(day))
      .filter((index) => index !== -1)
      .sort((left, right) => left - right);

    if (indices.length === 0) {
      return '';
    }

    let isConsecutive = true;
    for (let index = 1; index < indices.length; index += 1) {
      if (indices[index] !== indices[index - 1] + 1) {
        isConsecutive = false;
        break;
      }
    }

    if (isConsecutive && indices.length > 1) {
      return `${WEEK_DAYS[indices[0]]} to ${WEEK_DAYS[indices[indices.length - 1]]}`;
    }

    return days.join(', ');
  }

  private sortDays(days: string[]): string[] {
    return days.sort(
      (left, right) => WEEK_DAYS.indexOf(left) - WEEK_DAYS.indexOf(right),
    );
  }

  private buildPermissions(): {
    canView: boolean;
    canEdit: boolean;
    canManage: boolean;
    canDelete: boolean;
  } {
    const canManage = this.canManageUsers();

    return {
      canView: true,
      canEdit: canManage,
      canManage,
      canDelete: canManage,
    };
  }

  private buildDialogEmployeeData(
    user: LegacyUserRecord,
  ): Record<string, unknown> {
    const resolved = this.resolveUser(user);
    const id = Number(resolved.id ?? user.id ?? 0);

    return {
      id: user.id,
      company_id: resolved.company_id ?? resolved.company?.id,
      profile: {
        id,
        company_id: resolved.company_id ?? resolved.company?.id,
        name: resolved.name,
        last_name: resolved.last_name,
        email: resolved.email,
        position: resolved.employee?.position,
        hourly_rate: resolved.employee?.hourly_rate ?? 0,
        projects: [],
        imagePath:
          this.resolveText(resolved.picture ?? resolved.imagePath, '') ||
          DEFAULT_PROFILE_PIC,
      },
      user: {
        id: user.id,
        name: resolved.name,
        last_name: resolved.last_name,
        email: resolved.email,
        role: Number(resolved.role ?? 0),
      },
    };
  }

  private toEmployeeDialogData(row: UsersListRow): Record<string, unknown> {
    return {
      id: row.id,
      company_id: row.companyId,
      profile: {
        id: row.employee_id,
        company_id: row.companyId,
        name: row.name,
        last_name: row.last_name,
        email: row.email,
        position: null,
        hourly_rate: 0,
        projects: [],
        imagePath: row.pictureUrl,
      },
      user: {
        id: row.id,
        name: row.name,
        last_name: row.last_name,
        email: row.email,
        role: row.role,
      },
    };
  }

  private buildReportFilters(row: UsersListRow): Record<string, unknown> {
    return {
      company: row.companyId ?? 'all',
      project: 'all',
      byClient: false,
      useTimezone: false,
      multipleUsers: false,
    };
  }

  private buildReportFileName(
    row: UsersListRow,
    firstSelect: Date,
    lastSelect: Date,
  ): string {
    const displayName = `${row.name}_${row.last_name}`.replace(/\s+/g, '_');

    return `I-nimble_Report_${displayName}_${moment(firstSelect).format('DD-MM-YYYY')}_${moment(lastSelect).format('DD-MM-YYYY')}.xlsx`;
  }

  private resolveUser(user: LegacyUserRecord): LegacyUserRecord {
    if (this.isRecord(user.profile)) {
      return { ...user, ...user.profile };
    }

    if (this.isRecord(user.user)) {
      return { ...user, ...user.user };
    }

    return user;
  }

  private resolveCompanyId(response: unknown): number | null {
    if (!this.isRecord(response)) {
      return null;
    }

    const company = response['company'];
    if (this.isRecord(company)) {
      const companyId = Number(company['id'] ?? 0);
      return companyId > 0 ? companyId : null;
    }

    const directCompanyId = Number(response['id'] ?? 0);
    return directCompanyId > 0 ? directCompanyId : null;
  }

  private canManageUsers(): boolean {
    return ROLE_WITH_ACTIONS.has(Number(localStorage.getItem('role') ?? 0));
  }

  private applyFilters(
    users: UsersListRow[],
    filters: UsersListPageFilters,
  ): UsersListRow[] {
    const f = filters ?? {};
    const searchTerm = (f.searchTerm ?? '').trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !searchTerm ||
        [
          user.displayName,
          user.email,
          user.roleLabel,
          user.scheduleLabel,
          user.reportsLabel,
        ].some((value) => value.toLowerCase().includes(searchTerm));

      const matchesCompany =
        f.companyId === undefined ||
        f.companyId === null ||
        String(user.companyId ?? '') === String(f.companyId);

      const matchesRole =
        f.role === undefined ||
        f.role === null ||
        String(user.role) === String(f.role);

      const matchesStatus =
        !f.status ||
        f.status === 'all' ||
        (f.status === 'online'
          ? user.statusLabel === 'Online'
          : user.statusLabel === 'Offline');

      const matchesPredicate = f.predicate ? f.predicate(user) : true;

      return (
        matchesSearch &&
        matchesCompany &&
        matchesRole &&
        matchesStatus &&
        matchesPredicate
      );
    });
  }

  private resetLoadState(): void {
    this.usersLoaded.set(false);
    this.schedulesLoaded.set(false);
    this.entriesLoaded.set(false);
    this.loading.set(true);
  }

  private markUsersLoaded(): void {
    this.usersLoaded.set(true);
    this.finishLoadingIfReady();
  }

  private markSchedulesLoaded(): void {
    this.schedulesLoaded.set(true);
    this.finishLoadingIfReady();
  }

  private markEntriesLoaded(): void {
    this.entriesLoaded.set(true);
    this.finishLoadingIfReady();
  }

  private finishLoadingIfReady(): void {
    if (this.usersLoaded() && this.schedulesLoaded() && this.entriesLoaded()) {
      this.currentPage.set(1);
      this.loading.set(false);
    }
  }

  private getSortableValue(user: UsersListRow, sortBy: string): string {
    const valueMap: Record<string, string> = {
      displayName: user.displayName,
      roleLabel: user.roleLabel,
      email: user.email,
      statusLabel: user.statusLabel,
      scheduleLabel: user.scheduleLabel,
      reportsLabel: user.reportsLabel,
    };

    return (valueMap[sortBy] ?? user.displayName).toLowerCase();
  }

  private resolveText(value: unknown, fallback: string): string {
    if (typeof value === 'string') {
      return value.trim() || fallback;
    }

    if (typeof value === 'number') {
      return String(value);
    }

    return fallback;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
