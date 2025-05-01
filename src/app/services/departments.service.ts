import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Department } from '../models/Department.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DepartmentsService {
  constructor(private http: HttpClient) {}
  private API_URI = environment.apiUrl + '/departments';

  public get(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.API_URI}`);
  }
}
