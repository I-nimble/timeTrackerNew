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
} from '@features/users/models/users-list.model';
import {
  LegacyUserRecord,
  UsersListPageFilters,
  UsersListRow,
} from '@features/users/models/users-list.types';
import * as UsersListService from '@features/users/services/users-list.service';
import { DynamicTableComponent } from '@shared/components/dynamic-table/dynamic-table.component';
import {
  DynamicTableCellContext,
  DynamicTablePageChange,
  DynamicTableRowActionEvent,
  DynamicTableSortChange,
  DynamicSortOrder,
} from '@shared/models/dynamic-table.model';
import { saveAs } from 'file-saver';
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

const DEFAULT_PAGE_SIZE = 5;
const DEFAULT_EMPTY_MESSAGE = 'No users available.';

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
  private readonly pictureLookup = signal<Record<number, string>>({});
  private readonly reportCellTemplateRef = signal<TemplateRef<
    DynamicTableCellContext<UsersListRow>
  > | null>(null);
  private readonly loaded = signal<Set<string>>(new Set<string>());

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(DEFAULT_PAGE_SIZE);
  readonly sortBy = signal<string>('displayName');
  readonly sortOrder = signal<DynamicSortOrder>('asc');

  readonly allUsers = computed(() =>
    this.rawUsers().map((user) =>
      UsersListService.mapUser(
        user,
        this.scheduleLookup(),
        this.onlineUserIds(),
        this.pictureLookup(),
      ),
    ),
  );

  readonly filteredUsers = computed(() =>
    UsersListService.applyFilters(this.allUsers(), this.filters()),
  );

  readonly hasUsers = computed(() => this.filteredUsers().length > 0);

  readonly backendMessage = computed(() => {
    if (this.error()) return this.error() ?? DEFAULT_EMPTY_MESSAGE;
    if (!this.loading() && !this.hasUsers()) return DEFAULT_EMPTY_MESSAGE;
    return '';
  });

  readonly visibleColumns = computed(() =>
    UsersListService.buildTableColumns({
      reportTemplate: this.reportCellTemplateRef(),
      canManage: UsersListService.buildPermissions().canManage,
      allowedColumns: this.columns(),
    }),
  );

  readonly sortedUsers = computed(() =>
    UsersListService.sortRows(
      this.filteredUsers(),
      this.sortBy(),
      this.sortOrder(),
    ),
  );

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sortedUsers().length / this.pageSize())),
  );

  readonly displayedPage = computed(() =>
    Math.min(this.currentPage(), this.totalPages()),
  );

  readonly pagedUsers = computed(() =>
    UsersListService.paginateRows(
      this.sortedUsers(),
      this.displayedPage(),
      this.pageSize(),
    ),
  );

  ngOnInit(): void {
    this.reloadAll();
  }

  private reloadAll(): void {
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
    if (change.sortOrder) this.sortOrder.set(change.sortOrder);
    this.currentPage.set(change.page);
  }

  onSortChange(change: DynamicTableSortChange): void {
    this.sortBy.set(change.sortBy);
    this.sortOrder.set(change.sortOrder);
    this.currentPage.set(change.page);
    if (change.pageSize > 0) this.pageSize.set(change.pageSize);
  }

  onRowAction(event: DynamicTableRowActionEvent<UsersListRow>): void {
    if (event.action.id === 'edit') return this.editUser(event.row);
    if (event.action.id === 'delete') this.confirmDeleteUser(event.row);
  }

  downloadReport(row: UsersListRow): void {
    this.dialog
      .open(AppDateRangeDialogComponent, { autoFocus: false, width: '420px' })
      .afterClosed()
      .subscribe((result) => {
        if (!result?.firstSelect || !result?.lastSelect) return;
        const payload = UsersListService.buildDownloadPayload(
          row,
          result.firstSelect,
          result.lastSelect,
        );
        this.reportsService
          .getReport(payload.reportParams, { id: row.id }, payload.filters)
          .subscribe({
            next: (blob: Blob) => saveAs(blob, payload.fileName),
            error: () => this.error.set('Unable to download report.'),
          });
      });
  }

  editUser(row: UsersListRow): void {
    const rawUser = this.rawUsers().find(
      (user) => UsersListService.getUserId(user) === row.id,
    );
    this.dialog
      .open(AppEmployeeDialogContentComponent, {
        autoFocus: false,
        width: '720px',
        data: {
          action: 'Update',
          employee: rawUser
            ? UsersListService.buildDialogEmployeeData(rawUser)
            : UsersListService.buildDialogFromRow(row),
          permissions: UsersListService.canManageUsers()
            ? { canView: true, canEdit: true, canManage: true, canDelete: true }
            : {
                canView: true,
                canEdit: false,
                canManage: false,
                canDelete: false,
              },
        },
      })
      .afterClosed()
      .subscribe(() => this.reloadAll());
  }

  confirmDeleteUser(row: UsersListRow): void {
    this.dialog
      .open(ModalComponent, {
        autoFocus: false,
        data: {
          action: 'delete',
          subject: 'user',
          message: `Delete ${row.displayName}?`,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.usersService.delete(row.id).subscribe({
          next: () => this.reloadAll(),
          error: () => this.error.set('Unable to delete user.'),
        });
      });
  }

  private loadUsers(): void {
    this.loaded.set(new Set());
    this.loading.set(true);
    this.error.set(null);
    const role = Number(localStorage.getItem('role') ?? 0);
    const fail = () => {
      this.rawUsers.set([]);
      this.error.set('Unable to load users.');
      this.mark('users');
    };

    UsersListService.fetchUsersForRole(
      role,
      this.employeesService,
      this.companiesService,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users: LegacyUserRecord[]) => {
          this.rawUsers.set(users);
          this.mark('users');
          this.loadProfilePics(users);
        },
        error: fail,
      });
  }

  private loadProfilePics(users: LegacyUserRecord[]): void {
    UsersListService.fetchProfilePics(users, this.usersService)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lookup: Record<number, string>) =>
          this.pictureLookup.set(lookup),
        error: () => this.pictureLookup.set({}),
      });
  }

  private loadSchedules(): void {
    UsersListService.fetchScheduleLookup(this.schedulesService)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lookup: Record<number, string>) => {
          this.scheduleLookup.set(lookup);
          this.mark('schedules');
        },
        error: () => {
          this.scheduleLookup.set({});
          this.mark('schedules');
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
    UsersListService.fetchOnlineUserIds(this.entriesService, start, start)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ids: Set<number>) => {
          this.onlineUserIds.set(ids);
          this.mark('entries');
        },
        error: () => {
          this.onlineUserIds.set(new Set<number>());
          this.mark('entries');
        },
      });
  }

  private mark(key: 'users' | 'schedules' | 'entries'): void {
    this.loaded.update((state) => new Set([...state, key]));
    if (this.loaded().size >= 3) {
      this.currentPage.set(1);
      this.loading.set(false);
    }
  }
}
