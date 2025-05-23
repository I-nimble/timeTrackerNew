import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SchedulesService {
  constructor(private http: HttpClient) {}
  private API_URI = environment.apiUrl + '/schedules';

  public get(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URI}`);
  }

  public getById(id: number | string): Observable<any> {
    return this.http.get<any>(`${this.API_URI}/${id}`);
  }
}
