export interface UsersListPageFilters {
  searchTerm?: string;
  companyId?: number | string | null;
  role?: number | string | null;
  status?: 'all' | 'online' | 'offline';
  predicate?: (row: UsersListRow) => boolean;
}

export interface LegacyEmployeeSchedule {
  employee_id?: number | string | null;
  days?: { name?: string | null }[] | null;
}

export interface LegacyEmployee {
  id?: number | string | null;
  position?: string | number | null;
  hourly_rate?: number | null;
  schedule?: LegacyEmployeeSchedule[] | null;
}

export interface LegacyUserRecord extends Record<string, unknown> {
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

export interface ScheduleRecord {
  employee_id?: number | string | null;
  days?:
    | {
        name?: string | null;
      }[]
    | null;
}

export interface UsersListRow {
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
