import { Company } from './Company.model';

export interface User {
  id: string;
  name: string;
  last_name: string;
  email: string;
  password: string;
  role: number;
  active: number;
  profile?: any;
  review?: Review[];
  company?: Company;
  schedule?: Schedule;
  employee?: Employee;
}

export interface Review {
  id: number;
  end_time: Date;
  start_time: Date;
  date: string;
  project_id?: number | null;
  status: number;
  task_id: number;
}

export interface Employee {
  id: string;
  position?: string;
  hourly_rate?: number;
  schedule?: Schedule[];
}

export interface Schedule {
  days: Day[];
  start_time: string;
  end_time: string;
}

export interface Day {
  id: number;
  name: string;
}
