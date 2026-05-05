import { Note } from '../models/note.model';

export interface NotesState {
  notes: Note[];
  loading: boolean;
  error: string | null;
  selectedNoteId: number | null;
  searchQuery: string;
  userId: number | null;
}

export const initialNotesState: NotesState = {
  notes: [],
  loading: false,
  error: null,
  selectedNoteId: null,
  searchQuery: '',
  userId: null,
};
