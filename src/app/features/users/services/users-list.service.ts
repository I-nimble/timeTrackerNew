import { TemplateRef } from '@angular/core';

import { User } from '@features/users/models/user.model';
import { UsersListColumn } from '@features/users/models/users-list.model';
import { UsersListPageFilters } from '@features/users/models/users-list.types';
import {
  DynamicSortOrder,
  DynamicTableCellContext,
  DynamicTableColumn,
} from '@shared/models/dynamic-table.model';
import { ROLES } from '@shared/services/role.service';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export const normalizeUserList = (users: unknown): User[] => {
  if (Array.isArray(users)) {
    return users
      .map((item) =>
        typeof item === 'object' && item !== null ? (item as User) : null,
      )
      .filter((item): item is User => item !== null);
  }

  if (typeof users === 'object' && users !== null) {
    const rec = users as Record<string, unknown>;
    const possibleList = rec['items'] ?? rec['users'] ?? rec['data'];

    if (Array.isArray(possibleList)) {
      return possibleList
        .map((item) =>
          typeof item === 'object' && item !== null ? (item as User) : null,
        )
        .filter((item): item is User => item !== null);
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

const ROLE_LABELS: Record<number, string> = {
  1: ROLES.ADMIN,
  2: ROLES.USER,
  3: ROLES.CLIENT,
  4: ROLES.SUPPORT,
};

export const DEFAULT_PROFILE_PIC = `${environment.assets}/default-user-profile-pic.webp`;

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

export const resolveText = (value: unknown, fallback: string): string => {
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number') return String(value);
  return fallback;
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const getDisplayName = (user: User): string => {
  const name = resolveText(user.name, 'User');
  const lastName = resolveText(user.last_name, '');
  return `${name} ${lastName}`.trim();
};

export const getRoleLabel = (user: User): string => {
  const roleNumber = Number(user.role ?? 0);
  return ROLE_LABELS[roleNumber] ?? `Role ${roleNumber || 'N/A'}`;
};

export const getPictureUrl = (
  user: User,
  pictureLookup: Record<number, string>,
  id: number,
): string =>
  pictureLookup[id] ||
  resolveText(user.picture, '') ||
  resolveText(user.imagePath, '') ||
  DEFAULT_PROFILE_PIC;

export const mapUser = (
  user: User,
  scheduleLookup: Record<number, string>,
  onlineUserIds: Set<number>,
  pictureLookup: Record<number, string> = {},
): User => {
  const resolvedUser = resolveUser(user);
  const id = getUserId(resolvedUser);
  const employeeId = getEmployeeId(resolvedUser);
  const name = resolveText(resolvedUser.name, 'User');
  const lastName = resolveText(resolvedUser.last_name, '');
  const roleNumber = Number(resolvedUser.role ?? 0);

  return {
    ...resolvedUser,
    id,
    employee_id: employeeId,
    name,
    last_name: lastName,
    displayName: `${name} ${lastName}`.trim(),
    email: resolveText(resolvedUser.email, 'N/A'),
    picture: resolvedUser.picture ?? null,
    imagePath: resolvedUser.imagePath ?? null,
    pictureUrl: getPictureUrl(resolvedUser, pictureLookup, id),
    role: roleNumber,
    roleLabel: getRoleLabel(resolvedUser),
    online: resolveOnline(resolvedUser, id, onlineUserIds),
    statusLabel: getStatusLabel(resolvedUser, id, onlineUserIds),
    scheduleLabel: resolveScheduleLabel(
      resolvedUser,
      employeeId,
      scheduleLookup,
    ),
    reportsLabel: 'Download',
    positionLabel: resolvePositionLabel(resolvedUser),
    companyName: getCompanyName(resolvedUser),
    company_id: normalizeCompanyId(
      resolvedUser.company_id ?? resolvedUser.company?.id,
    ),
    active: resolvedUser.active ?? 0,
  };
};

export const resolveUser = (user: User): User => {
  if (isRecord(user.profile)) return { ...user, ...(user.profile as User) };
  if (isRecord(user.user)) return { ...user, ...(user.user as User) };
  if (isRecord(user.employee)) return { ...user, ...(user.employee as User) };
  return user;
};

export const getUserId = (record: User): number => {
  const id = (
    isRecord(record.employee) ? record?.employee?.user_id : record?.id
  ) as number | undefined;
  return Number(id ?? 0) || 0;
};

export const getEmployeeId = (record: User): number => {
  const profile = isRecord(record.profile) ? (record.profile as User) : null;
  const candidates = [
    record.employee_id,
    profile?.employee_id,
    profile?.id,
    record.id,
  ];

  for (const candidate of candidates) {
    const n = Number(candidate ?? 0);
    if (n > 0) return n;
  }

  return 0;
};

export const resolvePositionLabel = (record: User): string => {
  const rec = record as unknown as Record<string, unknown>;
  const empBlock =
    (rec['employee'] as Record<string, unknown> | undefined) ?? rec;
  const pos = empBlock['position'];

  if (typeof pos === 'string') return pos.trim() || 'N/A';

  if (pos && typeof pos === 'object') {
    const title = (pos as { title?: string | null }).title;
    if (typeof title === 'string' && title.trim()) return title.trim();
  }

  const positionName = empBlock['position_name'];
  if (typeof positionName === 'string' && positionName.trim()) {
    return positionName.trim();
  }

  return 'N/A';
};

export const getStatusLabel = (
  user: User,
  id: number,
  onlineUserIds: Set<number>,
): string => (resolveOnline(user, id, onlineUserIds) ? 'Online' : 'Offline');

export const getCompanyName = (user: User): string =>
  resolveText(user.company?.name, 'N/A');

export const normalizeCompanyId = (value: unknown): number | null => {
  const id = Number(value ?? 0);
  return id > 0 ? id : null;
};

export const buildReportFileName = (
  row: User,
  firstSelect: Date,
  lastSelect: Date,
): string => {
  const displayName = getDisplayName(row).replace(/\s+/g, '_');
  const f = (d: Date) =>
    `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
  return `I-nimble_Report_${displayName}_${f(firstSelect)}_${f(lastSelect)}.xlsx`;
};

export const resolveOnline = (
  user: User,
  id: number,
  onlineUserIds: Set<number>,
): boolean => {
  const rec = user as unknown as Record<string, unknown>;
  if (rec['online'] === true) return true;
  if (rec['active_entry'] && typeof rec['active_entry'] === 'object')
    return true;
  return onlineUserIds.has(id);
};

export const resolveScheduleLabel = (
  user: User,
  id: number,
  scheduleLookup: Record<number, string>,
): string => {
  const rec = user as unknown as Record<string, unknown>;
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
  users: User[],
  filters: UsersListPageFilters,
): User[] => {
  const f = filters ?? {};
  const searchTerm = (f.searchTerm ?? '').trim().toLowerCase();

  return users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      [
        getDisplayName(user),
        resolveText(user.email, ''),
        getRoleLabel(user),
        user.scheduleLabel ??
          resolveScheduleLabel(user, getEmployeeId(user), {}),
        user.reportsLabel ?? 'Download',
        resolvePositionLabel(user),
        getCompanyName(user),
      ].some((value) => value.toLowerCase().includes(searchTerm));

    const matchesCompany =
      f.companyId === undefined ||
      f.companyId === null ||
      String(user.company_id ?? user.company?.id ?? '') === String(f.companyId);

    const matchesRole =
      f.role === undefined ||
      f.role === null ||
      String(user.role ?? 0) === String(f.role);

    const statusLabel = getStatusLabel(user, getUserId(user), new Set());
    const matchesStatus =
      !f.status ||
      f.status === 'all' ||
      (f.status === 'online'
        ? statusLabel === 'Online'
        : statusLabel === 'Offline');

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
  user: User,
): Record<string, unknown> => {
  const resolved = resolveUser(user);
  const userId = getUserId(user);
  const employeeId = getEmployeeId(user);
  const rec = user as unknown as Record<string, unknown>;
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
    .filter((projectId) => projectId > 0);
  const hourlyRate = Number(empBlock['hourly_rate'] ?? rec['hourly_rate'] ?? 0);
  const companyId = normalizeCompanyId(
    resolved.company_id ??
      resolved.company?.id ??
      empBlock['company_id'] ??
      (isRecord(empBlock['company']) ? empBlock['company']?.id : null) ??
      (isRecord(rec['company']) ? rec['company']?.id : null),
  );

  return {
    id: employeeId,
    user_id: userId,
    company_id: companyId,
    profile: {
      id: employeeId,
      user_id: userId,
      employee_id: employeeId,
      company_id: companyId,
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

export const buildReportFilters = (row: User): Record<string, unknown> => ({
  company: normalizeCompanyId(row.company_id ?? row.company?.id) ?? 'all',
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

export const getSortableValue = (user: User, sortBy: string): string => {
  const valueMap: Record<string, string> = {
    name: getDisplayName(user),
    displayName: getDisplayName(user),
    role: getRoleLabel(user),
    roleLabel: user.roleLabel ?? getRoleLabel(user),
    email: resolveText(user.email, 'N/A'),
    status:
      user.statusLabel ?? getStatusLabel(user, getUserId(user), new Set()),
    statusLabel:
      user.statusLabel ?? getStatusLabel(user, getUserId(user), new Set()),
    schedule:
      user.scheduleLabel ?? resolveScheduleLabel(user, getEmployeeId(user), {}),
    scheduleLabel:
      user.scheduleLabel ?? resolveScheduleLabel(user, getEmployeeId(user), {}),
    reports: user.reportsLabel ?? 'Download',
    reportsLabel: user.reportsLabel ?? 'Download',
  };

  return (valueMap[sortBy] ?? getDisplayName(user)).toLowerCase();
};

export const sortRows = (
  rows: User[],
  sortBy: string,
  sortOrder: DynamicSortOrder,
): User[] =>
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

export const buildDialogFromRow = (row: User): Record<string, unknown> => ({
  id: row.id,
  company_id: normalizeCompanyId(row.company_id ?? row.company?.id),
  profile: {
    id: row.employee_id ?? row.id,
    company_id: normalizeCompanyId(row.company_id ?? row.company?.id),
    name: row.name,
    last_name: row.last_name,
    email: row.email,
    position: null,
    hourly_rate: 0,
    projects: [],
    imagePath:
      row.pictureUrl ?? row.picture ?? row.imagePath ?? DEFAULT_PROFILE_PIC,
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
  row: User,
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
  reportTemplate: TemplateRef<DynamicTableCellContext<User>> | null;
  canManage: boolean;
  allowedColumns?: UsersListColumn[];
}

export const buildTableColumns = ({
  reportTemplate,
  canManage,
  allowedColumns,
}: BuildTableColumnsArgs): DynamicTableColumn<User>[] => {
  const allowedColumnsInput = Array.isArray(allowedColumns)
    ? allowedColumns
    : undefined;

  const columns: DynamicTableColumn<User>[] = [
    {
      id: 'name',
      header: 'User',
      accessor: (row) => getDisplayName(row),
      sortable: true,
      sortKey: 'name',
      renderer: {
        type: 'avatar-name',
        imageAccessor: (row) =>
          row.pictureUrl ?? row.picture ?? row.imagePath ?? DEFAULT_PROFILE_PIC,
        titleAccessor: (row) => getDisplayName(row),
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
      accessor: (row) => getStatusLabel(row, getUserId(row), new Set<number>()),
      sortable: true,
      sortKey: 'status',
      renderer: {
        type: 'status-pill',
        valueAccessor: (row) =>
          getStatusLabel(row, getUserId(row), new Set<number>()),
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
      accessor: (row) =>
        row.scheduleLabel ?? resolveScheduleLabel(row, getEmployeeId(row), {}),
      sortable: true,
      sortKey: 'schedule',
    },
    {
      id: 'reports',
      header: 'Reports',
      accessor: (row) => row.reportsLabel ?? 'Download',
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
}): Observable<User[]> =>
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
