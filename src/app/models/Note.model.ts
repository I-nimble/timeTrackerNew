export interface Note {
  id: number;
  date_time: string | Date;
  user_id: number;
  content: string | null;
  color: string | null;
  createdAt?: string;
  updatedAt?: string;
}