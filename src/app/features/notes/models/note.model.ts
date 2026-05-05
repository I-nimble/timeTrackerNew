export interface Note {
  id: number;
  user_id: number;
  color: string;
  content: string;
  date_time: Date | string;
}

export type NoteColor =
  | 'primary'
  | 'warning'
  | 'secondary'
  | 'error'
  | 'success';

export interface CreateNoteDto {
  user_id: number;
  date_time: string;
  content: string;
  color: string;
}

export interface UpdateNoteDto {
  date_time: string;
  content: string;
  color: string;
}
