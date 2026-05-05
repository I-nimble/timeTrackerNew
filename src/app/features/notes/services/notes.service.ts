import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import { CreateNoteDto, Note, UpdateNoteDto } from '../models/note.model';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly apiUri = `${environment.apiUrl}/notes`;
  private readonly http = inject(HttpClient);

  getNotesByUserId(userId: number): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.apiUri}/user/${userId}`);
  }

  createNote(note: CreateNoteDto): Observable<Note> {
    return this.http.post<Note>(this.apiUri, note);
  }

  updateNote(id: number, changes: UpdateNoteDto): Observable<Note> {
    return this.http.put<Note>(`${this.apiUri}/${id}`, changes);
  }

  deleteNote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUri}/${id}`);
  }
}
