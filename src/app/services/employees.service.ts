import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {

  constructor(private http: HttpClient) {}
  private API_URI = environment.apiUrl + '/employees';

  public get(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URI}`);
  }

  public getById(id:number): Observable<any[]> {
    return this.http.get<any>(`${this.API_URI}/${id}`);
  }

  public getByEmployee(): Observable<any[]> {
    return this.http.post<any[]>(`${this.API_URI}`, {});
  }
}