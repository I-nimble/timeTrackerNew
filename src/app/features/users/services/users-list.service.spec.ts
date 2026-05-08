import { User } from '@features/users/models/user.model';
import { of } from 'rxjs';

import * as svc from './users-list.service';

const buildRecord = (
  id: number,
  overrides: Record<string, unknown> = {},
): User =>
  ({
    id,
    name: `User ${id}`,
    last_name: `Last ${id}`,
    email: `user${id}@example.com`,
    role: 2,
    active: 1,
    picture: null,
    online: id % 2 === 0,
    company: { id: 1, name: 'Inimble' },
    employee: {
      id: 100 + id,
      user_id: id,
      company_id: 1,
      position_id: 5,
      position: { id: 5, title: 'Staff Developer' },
      hourly_rate: 12,
      projects: [{ id: 1, name: 'Project A' }],
      schedule: [
        {
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
  }) as unknown as User;

describe('users-list.service', () => {
  afterEach(() => localStorage.clear());

  describe('normalizeUserList', () => {
    it('returns array as-is, filtering non-objects', () => {
      const result = svc.normalizeUserList([{ id: 1 }, null, 'x', { id: 2 }]);
      expect(result.length).toBe(2);
    });

    it('extracts items / users / data envelopes', () => {
      expect(svc.normalizeUserList({ items: [{ id: 1 }] }).length).toBe(1);
      expect(svc.normalizeUserList({ users: [{ id: 2 }] }).length).toBe(1);
      expect(svc.normalizeUserList({ data: [{ id: 3 }] }).length).toBe(1);
    });

    it('returns empty for unknown shapes', () => {
      expect(svc.normalizeUserList(null).length).toBe(0);
      expect(svc.normalizeUserList(42).length).toBe(0);
      expect(svc.normalizeUserList({ noop: true }).length).toBe(0);
    });
  });

  describe('formatDaysRange', () => {
    it('returns empty string when no week days match', () => {
      expect(svc.formatDaysRange(['Caturday'])).toBe('');
    });
    it('returns single day verbatim', () => {
      expect(svc.formatDaysRange(['Monday'])).toBe('Monday');
    });
  });

  describe('sortDays', () => {
    it('sorts by week order', () => {
      expect(svc.sortDays(['Friday', 'Monday', 'Wednesday'])).toEqual([
        'Monday',
        'Wednesday',
        'Friday',
      ]);
    });
  });

  describe('buildReportFileName', () => {
    it('encodes the user name and date range', () => {
      const row = {
        name: 'Sofia',
        last_name: 'Bracho',
      } as unknown as User;
      const start = new Date(2026, 4, 5);
      const end = new Date(2026, 4, 9);
      expect(svc.buildReportFileName(row, start, end)).toBe(
        'I-nimble_Report_Sofia_Bracho_05-05-2026_09-05-2026.xlsx',
      );
    });
  });

  describe('id helpers', () => {
    it('reads user_id from nested user/profile/top-level', () => {
      expect(svc.getUserId({ user: { id: 9 } } as never)).toBe(9);
      expect(svc.getUserId({ profile: { id: 8 } } as never)).toBe(8);
      expect(svc.getUserId({ id: 7 } as never)).toBe(7);
      expect(svc.getUserId({} as never)).toBe(0);
    });

    it('reads employee_id from top-level then profile', () => {
      expect(svc.getEmployeeId({ id: 1 } as never)).toBe(1);
      expect(svc.getEmployeeId({ profile: { id: 2 } } as never)).toBe(2);
      expect(svc.getEmployeeId({} as never)).toBe(0);
    });
  });

  describe('resolvePositionLabel', () => {
    it('reads employee.position.title', () => {
      expect(svc.resolvePositionLabel(buildRecord(1))).toBe('Staff Developer');
    });
    it('reads top-level position string', () => {
      expect(svc.resolvePositionLabel({ position: 'Designer' } as never)).toBe(
        'Designer',
      );
    });
    it('reads position_name fallback', () => {
      expect(
        svc.resolvePositionLabel({
          employee: { position_name: 'Manager' },
        } as never),
      ).toBe('Manager');
    });
    it('returns N/A when nothing matches', () => {
      expect(svc.resolvePositionLabel({} as never)).toBe('N/A');
    });
  });

  describe('mapUser', () => {
    it('produces a flat row with derived labels', () => {
      const row = svc.mapUser(buildRecord(1), {}, new Set<number>([1]));
      expect(row.id).toBe(1);
      expect(row.displayName).toBe('User 1 Last 1');
      expect(row.scheduleLabel).toBe('Monday to Friday');
      expect(row.statusLabel).toBe('Online');
      expect(row.companyName).toBe('Inimble');
      expect(row.positionLabel).toBe('Staff Developer');
    });

    it('falls back to picture lookup map', () => {
      const row = svc.mapUser(
        buildRecord(2, { picture: null, online: false }),
        {},
        new Set<number>(),
        { 2: 'https://example.com/pic.png' },
      );
      expect(row.pictureUrl).toBe('https://example.com/pic.png');
      expect(row.statusLabel).toBe('Offline');
    });
  });

  describe('resolveOnline', () => {
    it('honors record.online', () => {
      expect(svc.resolveOnline({ online: true } as never, 1, new Set())).toBe(
        true,
      );
    });
    it('honors active_entry presence', () => {
      expect(
        svc.resolveOnline(
          { active_entry: { status: 0 } } as never,
          2,
          new Set(),
        ),
      ).toBe(true);
    });
    it('falls back to onlineUserIds set', () => {
      expect(svc.resolveOnline({} as never, 3, new Set([3]))).toBe(true);
      expect(svc.resolveOnline({} as never, 4, new Set())).toBe(false);
    });
  });

  describe('applyFilters', () => {
    const rows = [
      svc.mapUser(buildRecord(1), {}, new Set([1])),
      svc.mapUser(buildRecord(2, { online: false }), {}, new Set()),
      svc.mapUser(
        buildRecord(3, {
          company: { id: 2, name: 'Other' },
          online: false,
        }),
        {},
        new Set(),
      ),
    ];

    it('matches free-text search', () => {
      expect(svc.applyFilters(rows, { searchTerm: 'user 1' }).length).toBe(1);
    });
    it('filters by company id', () => {
      expect(svc.applyFilters(rows, { companyId: 2 }).length).toBe(1);
    });
    it('filters by status', () => {
      expect(svc.applyFilters(rows, { status: 'online' }).length).toBe(1);
      expect(svc.applyFilters(rows, { status: 'offline' }).length).toBe(2);
    });
    it('honors a custom predicate', () => {
      expect(
        svc.applyFilters(rows, { predicate: (row) => row.id === 3 }).length,
      ).toBe(1);
    });
    it('treats null filter object as empty', () => {
      expect(svc.applyFilters(rows, null as never).length).toBe(rows.length);
    });
  });

  describe('sort + paginate helpers', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7].map((id) =>
      svc.mapUser(buildRecord(id), {}, new Set()),
    );

    it('sorts by configured field', () => {
      const sorted = svc.sortRows(rows, 'email', 'desc');
      expect(sorted[0].email).toBe('user7@example.com');
    });

    it('paginates the slice', () => {
      const page = svc.paginateRows(rows, 2, 3);
      expect(page.map((r) => r.id)).toEqual([4, 5, 6]);
    });

    it('produces sortable value for known fields', () => {
      const row = rows[0];
      expect(svc.getSortableValue(row, 'email')).toBe(
        String(row.email ?? '').toLowerCase(),
      );
      expect(svc.getSortableValue(row, 'unknown')).toBe(
        `${row.name} ${row.last_name}`.trim().toLowerCase(),
      );
    });
  });

  describe('resolveCompanyId', () => {
    it('reads company.id from response', () => {
      expect(svc.resolveCompanyId({ company: { id: 4 } })).toBe(4);
    });
    it('falls back to root id', () => {
      expect(svc.resolveCompanyId({ id: 5 })).toBe(5);
    });
    it('returns null otherwise', () => {
      expect(svc.resolveCompanyId(null)).toBeNull();
      expect(svc.resolveCompanyId({})).toBeNull();
    });
  });

  describe('dialog payload helpers', () => {
    it('buildDialogFromRow exposes profile + user fields', () => {
      const row = svc.mapUser(buildRecord(1), {}, new Set());
      const dialog = svc.buildDialogFromRow(row);
      expect((dialog as { profile: { name: string } }).profile.name).toBe(
        'User 1',
      );
    });

    it('buildDialogEmployeeData reads from employee block', () => {
      const dialog = svc.buildDialogEmployeeData(buildRecord(1));
      const profile = (dialog as { profile: Record<string, unknown> }).profile;
      expect(profile['position']).toBe(5);
      expect(profile['hourly_rate']).toBe(12);
      expect(profile['projects']).toEqual([1]);
    });

    it('buildReportFilters mirrors the row company', () => {
      const row = svc.mapUser(buildRecord(1), {}, new Set());
      expect(svc.buildReportFilters(row)).toEqual(
        jasmine.objectContaining({ company: 1, project: 'all' }),
      );
    });

    it('buildDownloadPayload bundles params and file name', () => {
      const row = svc.mapUser(buildRecord(1), {}, new Set());
      const payload = svc.buildDownloadPayload(
        row,
        new Date(2026, 4, 5),
        new Date(2026, 4, 9),
      );
      expect(payload.fileName).toContain('I-nimble_Report');
    });
  });

  describe('permissions', () => {
    it('returns false when no role is stored', () => {
      expect(svc.canManageUsers()).toBeFalse();
      expect(svc.buildPermissions().canManage).toBeFalse();
    });
    it('returns true for the four authenticated roles', () => {
      [1, 2, 3, 4].forEach((role) => {
        localStorage.setItem('role', String(role));
        expect(svc.canManageUsers()).toBeTrue();
        expect(svc.buildPermissions().canEdit).toBeTrue();
      });
    });
  });

  describe('buildTableColumns', () => {
    it('hides actions when canManage is false', () => {
      const cols = svc.buildTableColumns({
        reportTemplate: null,
        canManage: false,
      });
      expect(cols.find((c) => c.id === 'actions')).toBeUndefined();
    });

    it('includes actions when canManage is true', () => {
      const cols = svc.buildTableColumns({
        reportTemplate: null,
        canManage: true,
      });
      expect(cols.some((c) => c.id === 'actions')).toBeTrue();
    });

    it('filters by allowedColumns input', () => {
      const cols = svc.buildTableColumns({
        reportTemplate: null,
        canManage: true,
        allowedColumns: ['name', 'email'],
      });
      expect(cols.map((c) => c.id)).toEqual(['name', 'email']);
    });
  });

  describe('fetch helpers', () => {
    it('fetchUsers filters out inactive rows', (done) => {
      const api = {
        getUserList: () =>
          of([
            { id: 1, active: 1 },
            { id: 2, active: 0 },
          ]),
      };
      svc.fetchUsers(api).subscribe((rows) => {
        expect(rows.map((r) => r.id)).toEqual([1]);
        done();
      });
    });
  });
});
