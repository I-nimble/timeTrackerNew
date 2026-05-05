import { createFeatureSelector, createSelector } from '@ngrx/store';

import { NotesState } from './notes.state';

export const selectNotesState = createFeatureSelector<NotesState>('notes');

// Base Selectors
export const selectAllNotes = createSelector(
  selectNotesState,
  (state) => state.notes,
);

export const selectNotesLoading = createSelector(
  selectNotesState,
  (state) => state.loading,
);

export const selectNotesError = createSelector(
  selectNotesState,
  (state) => state.error,
);

export const selectSelectedNoteId = createSelector(
  selectNotesState,
  (state) => state.selectedNoteId,
);

export const selectSearchQuery = createSelector(
  selectNotesState,
  (state) => state.searchQuery,
);

export const selectUserId = createSelector(
  selectNotesState,
  (state) => state.userId,
);

// Derived Selectors

export const selectSelectedNote = createSelector(
  selectAllNotes,
  selectSelectedNoteId,
  (notes, selectedId) => notes.find((note) => note.id === selectedId) ?? null,
);

export const selectFilteredNotes = createSelector(
  selectAllNotes,
  selectSearchQuery,
  (notes, searchQuery) => {
    if (!searchQuery.trim()) {
      return notes;
    }
    const query = searchQuery.toLowerCase();
    return notes.filter((note) => note.content.toLowerCase().includes(query));
  },
);

export const selectNotesCount = createSelector(
  selectFilteredNotes,
  (notes) => notes.length,
);
