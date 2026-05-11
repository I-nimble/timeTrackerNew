/// <reference types="jasmine" />
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from 'src/environments/environment';

import { NotesService } from './notes.service';
import { Note, CreateNoteDto, UpdateNoteDto } from '../models/note.model';

describe('NotesService', () => {
  let service: NotesService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/notes`;

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotesService],
    });

    service = TestBed.inject(NotesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getNotesByUserId', () => {
    it('should GET notes for the given user', () => {
      const userId = 10;

      service.getNotesByUserId(userId).subscribe((notes) => {
        expect(notes).toEqual(mockNotes);
        expect(notes.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/user/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockNotes);
    });

    it('should return an empty array when user has no notes', () => {
      const userId = 99;

      service.getNotesByUserId(userId).subscribe((notes) => {
        expect(notes).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}/user/${userId}`);
      req.flush([]);
    });

    it('should propagate HTTP errors', () => {
      const userId = 10;

      service.getNotesByUserId(userId).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/user/${userId}`);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should propagate 401 Unauthorized errors', () => {
      const userId = 10;

      service.getNotesByUserId(userId).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/user/${userId}`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('createNote', () => {
    it('should POST the new note and return the created note', () => {
      const newNote: CreateNoteDto = {
        user_id: 10,
        content: 'New note content',
        color: 'primary',
        date_time: '2024-01-03T00:00:00.000Z',
      };
      const createdNote: Note = { ...newNote, id: 3 };

      service.createNote(newNote).subscribe((note) => {
        expect(note).toEqual(createdNote);
        expect(note.id).toBe(3);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newNote);
      req.flush(createdNote);
    });

    it('should propagate 400 validation errors', () => {
      const invalidNote: CreateNoteDto = {
        user_id: 10,
        content: '',
        color: 'primary',
        date_time: '',
      };

      service.createNote(invalidNote).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(
        { message: 'Validation failed' },
        { status: 400, statusText: 'Bad Request' },
      );
    });

    it('should propagate 500 server errors', () => {
      const newNote: CreateNoteDto = {
        user_id: 10,
        content: 'Content',
        color: 'primary',
        date_time: '2024-01-03T00:00:00.000Z',
      };

      service.createNote(newNote).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('updateNote', () => {
    it('should PUT the changes and return the updated note', () => {
      const noteId = 1;
      const changes: UpdateNoteDto = {
        content: 'Updated content',
        color: 'success',
        date_time: '2024-01-01T12:00:00.000Z',
      };
      const updatedNote: Note = { ...mockNote1, ...changes };

      service.updateNote(noteId, changes).subscribe((note) => {
        expect(note).toEqual(updatedNote);
        expect(note.content).toBe('Updated content');
      });

      const req = httpMock.expectOne(`${apiUrl}/${noteId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(changes);
      req.flush(updatedNote);
    });

    it('should propagate 404 when the note does not exist', () => {
      const noteId = 999;
      const changes: UpdateNoteDto = {
        content: 'Updated',
        color: 'primary',
        date_time: '2024-01-01T00:00:00.000Z',
      };

      service.updateNote(noteId, changes).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/${noteId}`);
      req.flush(null, { status: 404, statusText: 'Not Found' });
    });

    it('should propagate 500 server errors', () => {
      const noteId = 1;
      const changes: UpdateNoteDto = {
        content: 'Updated',
        color: 'primary',
        date_time: '2024-01-01T00:00:00.000Z',
      };

      service.updateNote(noteId, changes).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/${noteId}`);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('deleteNote', () => {
    it('should DELETE the note and complete with void', () => {
      const noteId = 1;
      let completed = false;

      service.deleteNote(noteId).subscribe({
        next: () => {
          completed = true;
        },
        complete: () => {
          expect(completed).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/${noteId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('should propagate 404 when the note does not exist', () => {
      const noteId = 999;

      service.deleteNote(noteId).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/${noteId}`);
      req.flush(null, { status: 404, statusText: 'Not Found' });
    });

    it('should propagate 500 server errors', () => {
      const noteId = 1;

      service.deleteNote(noteId).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/${noteId}`);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
