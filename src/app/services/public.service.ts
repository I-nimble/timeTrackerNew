import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PublicService {
  private API_URI = `${environment.apiUrl}/public`;
  constructor(private http: HttpClient) {}

  getRecords(payload: any): Observable<any> {
    return this.http.post<any>(`${this.API_URI}/records`, payload);
  }
}