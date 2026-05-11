import { createReducer, on } from '@ngrx/store';

import * as NotesActions from './notes.actions';
import { NotesState, initialNotesState } from './notes.state';

export const notesReducer = createReducer(
  initialNotesState,

  // Load Notes
  on(
    NotesActions.loadNotes,
    (state, { userId }): NotesState => ({
      ...state,
      loading: true,
      error: null,
      userId,
    }),
  ),

  on(
    NotesActions.loadNotesSuccess,
    (state, { notes }): NotesState => ({
      ...state,
      notes,
      loading: false,
      // Auto-select first note when none is selected
      selectedNoteId:
        state.selectedNoteId === null && notes.length > 0
          ? notes[0].id
          : state.selectedNoteId,
    }),
  ),

  on(
    NotesActions.loadNotesFailure,
    (state, { error }): NotesState => ({
      ...state,
      loading: false,
      error,
    }),
  ),

  // Create Note
  on(
    NotesActions.createNote,
    (state): NotesState => ({
      ...state,
      loading: true,
      error: null,
    }),
  ),

  on(
    NotesActions.createNoteSuccess,
    (state, { note }): NotesState => ({
      ...state,
      notes: [...state.notes, note],
      loading: false,
    }),
  ),

  on(
    NotesActions.createNoteFailure,
    (state, { error }): NotesState => ({
      ...state,
      loading: false,
      error,
    }),
  ),

  // Update Note
  on(
    NotesActions.updateNote,
    (state): NotesState => ({
      ...state,
      loading: true,
      error: null,
    }),
  ),

  on(
    NotesActions.updateNoteSuccess,
    (state, { note }): NotesState => ({
      ...state,
      notes: state.notes.map((n) => (n.id === note.id ? note : n)),
      loading: false,
    }),
  ),

  on(
    NotesActions.updateNoteFailure,
    (state, { error }): NotesState => ({
      ...state,
      loading: false,
      error,
    }),
  ),

  // Delete Note
  on(
    NotesActions.deleteNote,
    (state): NotesState => ({
      ...state,
      loading: true,
      error: null,
    }),
  ),

  on(
    NotesActions.deleteNoteSuccess,
    (state, { id }): NotesState => ({
      ...state,
      notes: state.notes.filter((n) => n.id !== id),
      loading: false,
      // Clear selection if the deleted note was selected
      selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
    }),
  ),

  on(
    NotesActions.deleteNoteFailure,
    (state, { error }): NotesState => ({
      ...state,
      loading: false,
      error,
    }),
  ),

  // UI State
  on(
    NotesActions.selectNote,
    (state, { id }): NotesState => ({
      ...state,
      selectedNoteId: id,
    }),
  ),

  on(
    NotesActions.clearSelectedNote,
    (state): NotesState => ({
      ...state,
      selectedNoteId: null,
    }),
  ),

  on(
    NotesActions.setSearchQuery,
    (state, { query }): NotesState => ({
      ...state,
      searchQuery: query,
    }),
  ),
);
