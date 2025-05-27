import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { Company } from '../models/Company.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {

  constructor(private http: HttpClient) {}
  private API_URI = environment.apiUrl + '/employees';

  public get(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URI}`);
  }

  public getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(this.API_URI);
  }

  public getById(id:any | string): Observable<any[]> {
    return this.http.get<any>(`${this.API_URI}/${id}`);
  }

  public getByEmployee(): Observable<any[]> {
    return this.http.post<any[]>(`${this.API_URI}`, {});
  }

  public addEmployee(employee: any, file: File | null) {
    let formData = new FormData();
    if(employee.name) formData.append('name', employee.name);
    if(employee.last_name) formData.append('last_name', employee.last_name);
    if(employee.email) formData.append('email', employee.email);
    if(employee.password) formData.append('password', employee.password);
    if(employee.position) formData.append('position', employee.position.toString());
    if(employee.projects && employee.projects.length > 0) 
      formData.append('projects', JSON.stringify(employee.projects));
    if(file) formData.append('image', file);

    return this.http.post<any>(`${this.API_URI}/add`, formData);
  }

  public deleteEmployee(id: number) {
    return this.http.delete(`${this.API_URI}/${id}`);
  }
}