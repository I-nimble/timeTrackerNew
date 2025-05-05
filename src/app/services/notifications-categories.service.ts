import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationsCategoriesService {
  API_URI = `${environment.apiUrl}/notifications_categories`;

  constructor(private http: HttpClient) { }

  get() {
    return this.http.get<any>(`${this.API_URI}`);
  }
}