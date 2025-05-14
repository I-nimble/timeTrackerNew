export interface Entries {
  status?: number;
  task?: string;
  start_time?: any;
  end_time?: any;
  date?: Date;
  description?: string;
  project_id?: string|null;
  project?: string;
}

export class Entry {
  status: any = null;
  timeRef!: any;
  started: string = '';
  totalHours: string = '';
  start_time: any;
}
