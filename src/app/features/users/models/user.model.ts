export type UserStatus = 0 | 1;

export interface TimeTrackerEntryReview {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: number;
  task_id: number;
  project_id?: number | null;
}

export interface UserScheduleDay {
  id?: number;
  name?: string | null;
}

export interface UserSchedule {
  id?: number;
  employee_id?: number | null;
  days?: UserScheduleDay[] | null;
  start_time?: string | null;
  end_time?: string | null;
}

export interface UserEmployee extends User {
  position_id?: number | null;
  position?: string | { id?: number; title?: string | null } | null;
  position_name?: string | null;
  hourly_rate?: number | null;
  schedule?: UserSchedule[] | null;
  projects?: { id?: number | null; name?: string | null }[] | null;
}

export interface UserCompany {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: number | null;
  active?: UserStatus | number | boolean | string | null;
  phone?: string | null;
  picture?: string | null;
  imagePath?: string | null;
  address?: string | null;
  profile?: User | File | string | null;
  availability?: boolean;
  online?: boolean;
  active_entry?: {
    start_time?: string | null;
    end_time?: string | null;
    status?: number | null;
    user_id?: number | null;
  } | null;
  user?: User | null;
  user_id?: number | string | null;
  company_id?: number | string | null;
  company?: UserCompany | null;
  employee?: UserEmployee | null;
  employee_id?: number | string | null;
  displayName?: string | null;
  pictureUrl?: string | null;
  roleLabel?: string | null;
  statusLabel?: string | null;
  scheduleLabel?: string | null;
  reportsLabel?: string | null;
  positionLabel?: string | null;
  companyName?: string | null;
  entriesForReview?: TimeTrackerEntryReview[];
  review?: TimeTrackerEntryReview[];
}
