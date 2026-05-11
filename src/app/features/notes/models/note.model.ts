export interface Note {
  id: number;
  user_id: number;
  color: NoteColor;
  content: string;
  date_time: Date | string;
}

export type NoteColor =
  | 'primary'
  | 'warning'
  | 'secondary'
  | 'error'
  | 'success';

export type CreateNoteDto = Omit<Note, 'id'>;

export type UpdateNoteDto = Pick<Note, 'date_time' | 'content' | 'color'>;
