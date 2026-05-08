import { TemplateRef } from '@angular/core';

import { UsersListColumn } from '@features/users/models/users-list.model';
import {
  UsersListPageFilters,
  UsersListRow,
  UserRecord,
} from '@features/users/models/users-list.types';
import {
  DynamicSortOrder,
  DynamicTableCellContext,
  DynamicTableColumn,
} from '@shared/models/dynamic-table.model';
import { ROLES } from '@shared/services/role.service';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export const normalizeUserList = (users: unknown): UserRecord[] => {
  if (Array.isArray(users)) {
    return users
      .map((item) =>
        typeof item === 'object' && item !== null ? (item as UserRecord) : null,
      )
      .filter((item): item is UserRecord => item !== null);
  }

  if (typeof users === 'object' && users !== null) {
    const rec = users as Record<string, unknown>;
    const possibleList = rec['items'] ?? rec['users'] ?? rec['data'];

    if (Array.isArray(possibleList)) {
      return possibleList
        .map((item) =>
          typeof item === 'object' && item !== null
            ? (item as UserRecord)
            : null,
        )
        .filter((item): item is UserRecord => item !== null);
    }
  }

  return [];
};

const WEEK_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const formatDaysRange = (days: string[]): string => {
  const indices = days
    .map((day) => WEEK_DAYS.indexOf(day))
    .filter((i) => i !== -1)
    .sort((a, b) => a - b);

  if (indices.length === 0) return '';

  let isConsecutive = true;
  for (let i = 1; i < indices.length; i += 1) {
    if (indices[i] !== indices[i - 1] + 1) {
      isConsecutive = false;
      break;
    }
  }

  if (isConsecutive && indices.length > 1) {
    return `${WEEK_DAYS[indices[0]]} to ${WEEK_DAYS[indices[indices.length - 1]]}`;
  }

  return days.join(', ');
};

export const sortDays = (days: string[]): string[] =>
  days.sort((l, r) => WEEK_DAYS.indexOf(l) - WEEK_DAYS.indexOf(r));

export const buildReportFileName = (
  row: UsersListRow,
  firstSelect: Date,
  lastSelect: Date,
): string => {
  const displayName = `${row.name}_${row.last_name}`.replace(/\s+/g, '_');
  const f = (d: Date) =>
    `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
  return `I-nimble_Report_${displayName}_${f(firstSelect)}_${f(lastSelect)}.xlsx`;
};

const ROLE_LABELS: Record<number, string> = {
  1: ROLES.ADMIN,
  2: ROLES.USER,
  3: ROLES.CLIENT,
  4: ROLES.SUPPORT,
};
export const DEFAULT_PROFILE_PIC = `${environment.assets}/default-user-profile-pic.webp`;

export const resolveText = (value: unknown, fallback: string): string => {
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number') return String(value);
  return fallback;
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const resolveUser = (user: UserRecord): UserRecord => {
  if (isRecord(user.profile)) return { ...user, ...user.profile };
  if (isRecord(user.user)) return { ...user, ...user.user };
  return user;
};

export const getUserId = (record: UserRecord): number => {
  const candidates = [record.user?.id, record.profile?.id, record.id];
  for (const c of candidates) {
    const n = Number(c ?? 0);
    if (n > 0) return n;
  }
  return 0;
};

export const resolvePositionLabel = (record: UserRecord): string => {
  const rec = record as Record<string, unknown>;
  const empBlock =
    (rec['employee'] as Record<string, unknown> | undefined) ?? rec;
  const pos = empBlock['position'];
  if (typeof pos === 'string') return pos.trim() || 'N/A';
  if (pos && typeof pos === 'object') {
    const title = (pos as { title?: string }).title;
    if (typeof title === 'string' && title.trim()) return title.trim();
  }
  const positionName = empBlock['position_name'];
  if (typeof positionName === 'string' && positionName.trim())
    return positionName.trim();
  return 'N/A';
};

export const getEmployeeId = (record: UserRecord): number => {
  const candidates = [record.id, record.profile?.id];
  for (const c of candidates) {
    const n = Number(c ?? 0);
    if (n > 0) return n;
  }
  return 0;
};

export const mapUser = (
  user: UserRecord,
  scheduleLookup: Record<number, string>,
  onlineUserIds: Set<number>,
  pictureLookup: Record<number, string> = {},
): UsersListRow => {
  const resolvedUser = resolveUser(user);
  const id = getUserId(user);
  const employeeId = getEmployeeId(user);
  const name = resolveText(resolvedUser.name, 'User');
  const lastName = resolveText(resolvedUser.last_name, '');
  const roleNumber = Number(resolvedUser.role ?? 0);
  const roleLabel = ROLE_LABELS[roleNumber] ?? `Role ${roleNumber || 'N/A'}`;

  return {
    id,
    employee_id: employeeId,
    name,
    last_name: lastName,
    displayName: `${name} ${lastName}`.trim(),
    email: resolveText(resolvedUser.email, 'N/A'),
    pictureUrl:
      pictureLookup[id] ||
      resolveText(resolvedUser.picture, '') ||
      resolveText(resolvedUser.imagePath, '') ||
      DEFAULT_PROFILE_PIC,
    role: roleNumber,
    roleLabel,
    statusLabel: resolveOnline(user, id, onlineUserIds) ? 'Online' : 'Offline',
    scheduleLabel: resolveScheduleLabel(user, employeeId, scheduleLookup),
    reportsLabel: 'Download',
    positionLabel: resolvePositionLabel(user),
    companyName: resolveText(resolvedUser.company?.name, 'N/A'),
    companyId:
      Number(resolvedUser.company_id ?? resolvedUser.company?.id ?? null) ||
      null,
  };
};

export const resolveOnline = (
  user: UserRecord,
  id: number,
  onlineUserIds: Set<number>,
): boolean => {
  const rec = user as Record<string, unknown>;
  if (rec['online'] === true) return true;
  if (rec['active_entry'] && typeof rec['active_entry'] === 'object')
    return true;
  return onlineUserIds.has(id);
};

export const resolveScheduleLabel = (
  user: UserRecord,
  id: number,
  scheduleLookup: Record<number, string>,
): string => {
  const rec = user as Record<string, unknown>;
  const embedded =
    (rec['schedule'] as
      | { days?: { name?: string | null }[] | null }[]
      | null
      | undefined) ?? user.employee?.schedule;
  if (Array.isArray(embedded) && embedded.length > 0) {
    const allDays = new Set<string>();
    embedded.forEach((s) => {
      (s?.days ?? []).forEach((d) => {
        const name = resolveText(d?.name, '');
        if (name) allDays.add(name);
      });
    });
    const ordered = sortDays(Array.from(allDays));
    return ordered.length ? formatDaysRange(ordered) : 'No registered schedule';
  }
  return scheduleLookup[id] ?? 'No registered schedule';
};

export const applyFilters = (
  users: UsersListRow[],
  filters: UsersListPageFilters,
): UsersListRow[] => {
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
};

export const buildDialogEmployeeData = (
  user: UserRecord,
): Record<string, unknown> => {
  const resolved = resolveUser(user);
  const userId = getUserId(user);
  const employeeId = getEmployeeId(user);
  const rec = user as Record<string, unknown>;
  const empBlock =
    (rec['employee'] as Record<string, unknown> | undefined) ?? rec;
  const readNum = (key: string): number | null => {
    const direct = Number(empBlock[key] ?? 0);
    if (direct > 0) return direct;
    const nested = (
      empBlock[key.replace('_id', '')] as { id?: number } | undefined
    )?.id;
    return Number(nested ?? 0) || null;
  };
  const positionId = readNum('position_id');
  const projectsRaw = Array.isArray(empBlock['projects'])
    ? (empBlock['projects'] as { id?: number }[])
    : Array.isArray(rec['projects'])
      ? (rec['projects'] as { id?: number }[])
      : [];
  const projects = projectsRaw
    .map((p) => Number(p?.id ?? 0))
    .filter((id) => id > 0);
  const hourlyRate = Number(empBlock['hourly_rate'] ?? rec['hourly_rate'] ?? 0);

  return {
    id: userId,
    company_id: resolved.company_id ?? resolved.company?.id,
    profile: {
      id: userId,
      employee_id: employeeId,
      company_id: resolved.company_id ?? resolved.company?.id,
      name: resolved.name,
      last_name: resolved.last_name,
      email: resolved.email,
      position: positionId,
      hourly_rate: hourlyRate,
      projects,
      imagePath:
        resolveText(resolved.picture ?? resolved.imagePath, '') ||
        DEFAULT_PROFILE_PIC,
    },
    user: {
      id: userId,
      name: resolved.name,
      last_name: resolved.last_name,
      email: resolved.email,
      role: Number(resolved.role ?? 0),
    },
  };
};

export const buildReportFilters = (
  row: UsersListRow,
): Record<string, unknown> => ({
  company: row.companyId ?? 'all',
  project: 'all',
  byClient: false,
  useTimezone: false,
  multipleUsers: false,
});

export const buildPermissions = () => {
  const role = Number(localStorage.getItem('role') ?? 0);
  const canManage = new Set([1, 2, 3, 4]).has(role);
  return {
    canView: true,
    canEdit: canManage,
    canManage,
    canDelete: canManage,
  };
};

export const getSortableValue = (
  user: UsersListRow,
  sortBy: string,
): string => {
  const valueMap: Record<string, string> = {
    displayName: user.displayName,
    roleLabel: user.roleLabel,
    email: user.email,
    statusLabel: user.statusLabel,
    scheduleLabel: user.scheduleLabel,
    reportsLabel: user.reportsLabel,
  };
  return (valueMap[sortBy] ?? user.displayName).toLowerCase();
};

export const sortRows = (
  rows: UsersListRow[],
  sortBy: string,
  sortOrder: DynamicSortOrder,
): UsersListRow[] =>
  [...rows].sort((left, right) => {
    const l = getSortableValue(left, sortBy);
    const r = getSortableValue(right, sortBy);
    if (l === r) return 0;
    const cmp = l > r ? 1 : -1;
    return sortOrder === 'asc' ? cmp : -cmp;
  });

export const paginateRows = <T>(rows: T[], page: number, size: number): T[] => {
  const start = (page - 1) * size;
  return rows.slice(start, start + size);
};

export const resolveCompanyId = (response: unknown): number | null => {
  if (!isRecord(response)) return null;
  const company = response['company'];
  if (isRecord(company)) {
    const id = Number(company['id'] ?? 0);
    return id > 0 ? id : null;
  }
  const direct = Number(response['id'] ?? 0);
  return direct > 0 ? direct : null;
};

export const buildDialogFromRow = (
  row: UsersListRow,
): Record<string, unknown> => ({
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
});

export const buildDownloadPayload = (
  row: UsersListRow,
  firstSelect: Date,
  lastSelect: Date,
) => ({
  reportParams: { firstSelect, lastSelect },
  filters: buildReportFilters(row),
  fileName: buildReportFileName(row, firstSelect, lastSelect),
});

export const canManageUsers = (): boolean =>
  new Set([1, 2, 3, 4]).has(Number(localStorage.getItem('role') ?? 0));

interface BuildTableColumnsArgs {
  reportTemplate: TemplateRef<DynamicTableCellContext<UsersListRow>> | null;
  canManage: boolean;
  allowedColumns?: UsersListColumn[];
}

export const buildTableColumns = ({
  reportTemplate,
  canManage,
  allowedColumns,
}: BuildTableColumnsArgs): DynamicTableColumn<UsersListRow>[] => {
  const allowedColumnsInput = Array.isArray(allowedColumns)
    ? allowedColumns
    : undefined;
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

  if (canManage) {
    columns.push({
      id: 'actions',
      header: 'Actions',
      renderer: {
        type: 'actions',
        triggerIcon: 'more_vert',
        items: [
          { id: 'edit', label: 'Edit', icon: 'edit' },
          { id: 'delete', label: 'Delete', icon: 'delete' },
        ],
      },
    });
  }

  if (!allowedColumnsInput) {
    return columns;
  }

  return columns.filter((column) =>
    allowedColumnsInput.includes(column.id as UsersListColumn),
  );
};

export const fetchUsers = (usersService: {
  getUserList: () => Observable<unknown>;
}): Observable<UserRecord[]> =>
  usersService
    .getUserList()
    .pipe(
      switchMap((users) =>
        of(
          normalizeUserList(users).filter(
            (u) => Number(u.active ?? u.user?.active ?? 0) === 1,
          ),
        ),
      ),
    );
