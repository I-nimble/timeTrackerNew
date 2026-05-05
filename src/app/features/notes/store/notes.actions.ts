import { createAction, props } from '@ngrx/store';

import { CreateNoteDto, Note, UpdateNoteDto } from '../models/note.model';

// Load Notes
export const loadNotes = createAction(
  '[Notes Page] Load Notes',
  props<{ userId: number }>(),
);
export const loadNotesSuccess = createAction(
  '[Notes API] Load Notes Success',
  props<{ notes: Note[] }>(),
);
export const loadNotesFailure = createAction(
  '[Notes API] Load Notes Failure',
  props<{ error: string }>(),
);

// Create Note
export const createNote = createAction(
  '[Notes Page] Create Note',
  props<{ note: CreateNoteDto }>(),
);
export const createNoteSuccess = createAction(
  '[Notes API] Create Note Success',
  props<{ note: Note }>(),
);
export const createNoteFailure = createAction(
  '[Notes API] Create Note Failure',
  props<{ error: string }>(),
);

// Update Note
export const updateNote = createAction(
  '[Notes Page] Update Note',
  props<{ id: number; changes: UpdateNoteDto }>(),
);
export const updateNoteSuccess = createAction(
  '[Notes API] Update Note Success',
  props<{ note: Note }>(),
);
export const updateNoteFailure = createAction(
  '[Notes API] Update Note Failure',
  props<{ error: string }>(),
);

// Delete Note
export const deleteNote = createAction(
  '[Notes Page] Delete Note',
  props<{ id: number }>(),
);
export const deleteNoteSuccess = createAction(
  '[Notes API] Delete Note Success',
  props<{ id: number }>(),
);
export const deleteNoteFailure = createAction(
  '[Notes API] Delete Note Failure',
  props<{ error: string }>(),
);

// UI State
export const selectNote = createAction(
  '[Notes Page] Select Note',
  props<{ id: number }>(),
);

export const clearSelectedNote = createAction(
  '[Notes Page] Clear Selected Note',
);

export const setSearchQuery = createAction(
  '[Notes Page] Set Search Query',
  props<{ query: string }>(),
);
