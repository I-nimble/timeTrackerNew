import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UsersService } from 'src/app/services/users.service';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  userService = inject(UsersService);
  API_URI = environment.apiUrl;

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  getEvents(): Observable<any> {
    return this.http.get<any>(`${this.API_URI}/events`);
  }

  getEventById(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URI}/events/${id}`);
  }

  createEvent(data: any): Observable<any> {
    return this.http.post<any>(`${this.API_URI}/events`, data);
  }

  updateEvent(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.API_URI}/events/${id}`, data);
  }

  deleteEvent(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URI}/events/${id}`);
  }

  registerToEvent(eventId: number): Observable<any> {
    return this.http.post<any>(`${this.API_URI}/events/${eventId}/register`, {});
  }
}