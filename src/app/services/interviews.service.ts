import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InterviewsService {
  constructor(private http: HttpClient) {}
  API_URI = environment.apiUrl + '/interviews';

  public post(data: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.API_URI}`, data);
  }

  public get(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URI}`);
  }

  // public delete(id: number): Observable<any[]> {
  //   return this.http.delete<any[]>(`${this.API_URI}${id}`);
  // }
}
