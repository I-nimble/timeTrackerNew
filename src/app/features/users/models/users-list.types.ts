export interface UsersListPageFilters {
  searchTerm?: string;
  companyId?: number | string | null;
  role?: number | string | null;
  status?: 'all' | 'online' | 'offline';
  predicate?: (row: UsersListRow) => boolean;
}

export interface UserEmployee {
  id?: number | string | null;
  position?: string | number | null;
  hourly_rate?: number | null;
  schedule?: { days?: { name?: string | null }[] | null }[] | null;
}

export interface UserRecord extends Record<string, unknown> {
  id?: number | string;
  name?: string;
  last_name?: string;
  email?: string;
  role?: number | string;
  active?: number | boolean | string;
  picture?: string | null;
  imagePath?: string | null;
  online?: boolean;
  active_entry?: {
    start_time?: string | null;
    end_time?: string | null;
  } | null;
  company_id?: number | string | null;
  company?: { id?: number | string | null; name?: string | null } | null;
  employee?: UserEmployee | null;
  profile?: UserRecord | null;
  user?: UserRecord | null;
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
