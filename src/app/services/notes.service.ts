import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Note } from '../pages/apps/notes/note';

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  constructor(private http: HttpClient) {}

  API_URI = `${environment.apiUrl}/notes`;

  getNotesByUserId(user_id: number) {
    return this.http.get<Note[]>(`${this.API_URI}/user/${user_id}`);
  }

  createNote(note: { user_id: number; date_time: string; content: string }) {
    return this.http.post(this.API_URI, note);
  }

  updateNote(id: number, note: { date_time: string; content: string }) {
    return this.http.put(`${this.API_URI}/${id}`, note);
  }
}