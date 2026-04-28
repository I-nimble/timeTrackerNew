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
  id: number;
  name: string;
}

export interface UserSchedule {
  days: UserScheduleDay[];
  start_time: string;
  end_time: string;
}

export interface UserEmployee {
  id: number;
  position?: string | null;
  hourly_rate?: number | null;
  schedule?: UserSchedule[];
}

export interface UserCompany {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  last_name: string;
  email: string;
  role: number;
  active: UserStatus;
  phone?: string | null;
  picture?: string | null;
  address?: string | null;
  profile?: File | string | null;
  availability?: boolean;
  company?: UserCompany | null;
  employee?: UserEmployee | null;
  entriesForReview?: TimeTrackerEntryReview[];
  review?: TimeTrackerEntryReview[];
}
