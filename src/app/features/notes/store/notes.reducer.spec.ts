/// <reference types="jasmine" />
import * as NotesActions from './notes.actions';
import { notesReducer } from './notes.reducer';
import { initialNotesState, NotesState } from './notes.state';
import { Note } from '../models/note.model';

describe('Notes Reducer', () => {
  const mockNote1: Note = {
    id: 1,
    user_id: 10,
    color: 'primary',
    content: 'Content 1',
    date_time: '2024-01-01T00:00:00.000Z',
  };

  const mockNote2: Note = {
    id: 2,
    user_id: 10,
    color: 'warning',
    content: 'Content 2',
    date_time: '2024-01-02T00:00:00.000Z',
  };

  const mockNotes: Note[] = [mockNote1, mockNote2];

  describe('unknown action', () => {
    it('should return the initial state', () => {
      const state = notesReducer(undefined, { type: 'UNKNOWN_ACTION' });
      expect(state).toEqual(initialNotesState);
    });

    it('should return the existing state unchanged', () => {
      const existingState: NotesState = {
        ...initialNotesState,
        notes: mockNotes,
      };
      const state = notesReducer(existingState, { type: 'UNKNOWN_ACTION' });
      expect(state).toEqual(existingState);
    });
  });

  describe('loadNotes', () => {
    it('should set loading to true, clear error, and store userId', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        error: 'Previous error',
      };
      const state = notesReducer(
        previousState,
        NotesActions.loadNotes({ userId: 10 }),
      );

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
      expect(state.userId).toBe(10);
      expect(state.notes).toEqual(previousState.notes);
    });

    it('should preserve existing notes while loading', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        notes: mockNotes,
      };
      const state = notesReducer(
        previousState,
        NotesActions.loadNotes({ userId: 10 }),
      );

      expect(state.notes).toEqual(mockNotes);
    });
  });

  describe('loadNotesSuccess', () => {
    it('should populate notes and set loading to false', () => {
      const previousState: NotesState = { ...initialNotesState, loading: true };
      const state = notesReducer(
        previousState,
        NotesActions.loadNotesSuccess({ notes: mockNotes }),
      );

      expect(state.notes).toEqual(mockNotes);
      expect(state.loading).toBe(false);
    });

    it('should auto-select first note when no note is currently selected', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        loading: true,
        selectedNoteId: null,
      };
      const state = notesReducer(
        previousState,
        NotesActions.loadNotesSuccess({ notes: mockNotes }),
      );

      expect(state.selectedNoteId).toBe(mockNote1.id);
    });

    it('should NOT change selectedNoteId when a note is already selected', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        loading: true,
        selectedNoteId: 2,
      };
      const state = notesReducer(
        previousState,
        NotesActions.loadNotesSuccess({ notes: mockNotes }),
      );

      expect(state.selectedNoteId).toBe(2);
    });

    it('should NOT auto-select when notes array is empty', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        loading: true,
        selectedNoteId: null,
      };
      const state = notesReducer(
        previousState,
        NotesActions.loadNotesSuccess({ notes: [] }),
      );

      expect(state.selectedNoteId).toBeNull();
      expect(state.notes).toEqual([]);
    });
  });

  describe('loadNotesFailure', () => {
    it('should set error message and set loading to false', () => {
      const previousState: NotesState = { ...initialNotesState, loading: true };
      const state = notesReducer(
        previousState,
        NotesActions.loadNotesFailure({ error: 'Failed to load' }),
      );

      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to load');
    });

    it('should preserve existing notes on failure', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        loading: true,
        notes: mockNotes,
      };
      const state = notesReducer(
        previousState,
        NotesActions.loadNotesFailure({ error: 'error' }),
      );

      expect(state.notes).toEqual(mockNotes);
    });
  });

  describe('createNote', () => {
    it('should set loading to true and clear error', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        error: 'Previous error',
      };
      const action = NotesActions.createNote({
        note: {
          user_id: 10,
          content: 'New',
          color: 'primary',
          date_time: '2024-01-03T00:00:00.000Z',
        },
      });
      const state = notesReducer(previousState, action);

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('createNoteSuccess', () => {
    it('should append the new note and set loading to false', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        notes: [mockNote1],
        loading: true,
      };
      const state = notesReducer(
        previousState,
        NotesActions.createNoteSuccess({ note: mockNote2 }),
      );

      expect(state.notes).toEqual([mockNote1, mockNote2]);
      expect(state.loading).toBe(false);
    });

    it('should add note to an empty list', () => {
      const previousState: NotesState = { ...initialNotesState, loading: true };
      const state = notesReducer(
        previousState,
        NotesActions.createNoteSuccess({ note: mockNote1 }),
      );

      expect(state.notes).toEqual([mockNote1]);
    });
  });

  describe('createNoteFailure', () => {
    it('should set error and set loading to false', () => {
      const previousState: NotesState = { ...initialNotesState, loading: true };
      const state = notesReducer(
        previousState,
        NotesActions.createNoteFailure({ error: 'Failed to create' }),
      );

      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to create');
    });
  });

  describe('updateNote', () => {
    it('should set loading to true and clear error', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        error: 'Previous error',
      };
      const action = NotesActions.updateNote({
        id: 1,
        changes: {
          content: 'Updated',
          color: 'secondary',
          date_time: '2024-01-01T00:00:00.000Z',
        },
      });
      const state = notesReducer(previousState, action);

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('updateNoteSuccess', () => {
    it('should replace the updated note and set loading to false', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        notes: mockNotes,
        loading: true,
      };
      const updatedNote: Note = {
        ...mockNote1,
        content: 'Updated Content',
        color: 'success',
      };
      const state = notesReducer(
        previousState,
        NotesActions.updateNoteSuccess({ note: updatedNote }),
      );

      expect(state.notes).toEqual([updatedNote, mockNote2]);
      expect(state.loading).toBe(false);
    });

    it('should not mutate unrelated notes', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        notes: mockNotes,
        loading: true,
      };
      const updatedNote: Note = { ...mockNote1, content: 'Changed' };
      const state = notesReducer(
        previousState,
        NotesActions.updateNoteSuccess({ note: updatedNote }),
      );

      expect(state.notes[1]).toEqual(mockNote2);
    });
  });

  describe('updateNoteFailure', () => {
    it('should set error and set loading to false', () => {
      const previousState: NotesState = { ...initialNotesState, loading: true };
      const state = notesReducer(
        previousState,
        NotesActions.updateNoteFailure({ error: 'Failed to update' }),
      );

      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to update');
    });
  });

  describe('deleteNote', () => {
    it('should set loading to true and clear error', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        error: 'Previous error',
      };
      const state = notesReducer(
        previousState,
        NotesActions.deleteNote({ id: 1 }),
      );

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('deleteNoteSuccess', () => {
    it('should remove the deleted note and set loading to false', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        notes: mockNotes,
        loading: true,
      };
      const state = notesReducer(
        previousState,
        NotesActions.deleteNoteSuccess({ id: 1 }),
      );

      expect(state.notes).toEqual([mockNote2]);
      expect(state.loading).toBe(false);
    });

    it('should clear selectedNoteId when the selected note is deleted', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        notes: mockNotes,
        selectedNoteId: 1,
        loading: true,
      };
      const state = notesReducer(
        previousState,
        NotesActions.deleteNoteSuccess({ id: 1 }),
      );

      expect(state.selectedNoteId).toBeNull();
    });

    it('should preserve selectedNoteId when a different note is deleted', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        notes: mockNotes,
        selectedNoteId: 2,
        loading: true,
      };
      const state = notesReducer(
        previousState,
        NotesActions.deleteNoteSuccess({ id: 1 }),
      );

      expect(state.selectedNoteId).toBe(2);
      expect(state.notes).toEqual([mockNote2]);
    });

    it('should handle deleting the only note', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        notes: [mockNote1],
        selectedNoteId: 1,
        loading: true,
      };
      const state = notesReducer(
        previousState,
        NotesActions.deleteNoteSuccess({ id: 1 }),
      );

      expect(state.notes).toEqual([]);
      expect(state.selectedNoteId).toBeNull();
    });
  });

  describe('deleteNoteFailure', () => {
    it('should set error and set loading to false', () => {
      const previousState: NotesState = { ...initialNotesState, loading: true };
      const state = notesReducer(
        previousState,
        NotesActions.deleteNoteFailure({ error: 'Failed to delete' }),
      );

      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to delete');
    });
  });

  describe('selectNote', () => {
    it('should set selectedNoteId', () => {
      const state = notesReducer(
        initialNotesState,
        NotesActions.selectNote({ id: 1 }),
      );
      expect(state.selectedNoteId).toBe(1);
    });

    it('should overwrite an existing selection', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        selectedNoteId: 1,
      };
      const state = notesReducer(
        previousState,
        NotesActions.selectNote({ id: 2 }),
      );
      expect(state.selectedNoteId).toBe(2);
    });
  });

  describe('clearSelectedNote', () => {
    it('should set selectedNoteId to null', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        selectedNoteId: 1,
      };
      const state = notesReducer(
        previousState,
        NotesActions.clearSelectedNote(),
      );
      expect(state.selectedNoteId).toBeNull();
    });

    it('should be a no-op when no note is selected', () => {
      const state = notesReducer(
        initialNotesState,
        NotesActions.clearSelectedNote(),
      );
      expect(state.selectedNoteId).toBeNull();
    });
  });

  describe('setSearchQuery', () => {
    it('should set the search query', () => {
      const state = notesReducer(
        initialNotesState,
        NotesActions.setSearchQuery({ query: 'meeting notes' }),
      );
      expect(state.searchQuery).toBe('meeting notes');
    });

    it('should overwrite a previous search query', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        searchQuery: 'old query',
      };
      const state = notesReducer(
        previousState,
        NotesActions.setSearchQuery({ query: 'new query' }),
      );
      expect(state.searchQuery).toBe('new query');
    });

    it('should allow setting an empty query', () => {
      const previousState: NotesState = {
        ...initialNotesState,
        searchQuery: 'something',
      };
      const state = notesReducer(
        previousState,
        NotesActions.setSearchQuery({ query: '' }),
      );
      expect(state.searchQuery).toBe('');
    });
  });
});
