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
  private USERS_API_URI = environment.apiUrl + '/users';

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

  public inviteEmployee(data: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${this.API_URI}/invite`, data);
  }

  public deleteEmployee(id: number) {
    return this.http.delete(`${this.API_URI}/${id}`);
  }

  public registerEmployee(data: any): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${this.API_URI}/register`, data);
  }

  public updateEmployee(id: number, employee: any, companyId: number, file: File | null): Observable<HttpResponse<any>> {
    const formData = new FormData();
    formData.append('name', employee.name);
    formData.append('last_name', employee.last_name);
    if (employee.password) formData.append('password', employee.password);
    formData.append('company_id', employee.company_id);
    formData.append('position', employee.position);
    formData.append('projects', JSON.stringify(employee.projects));
    formData.append('employee', JSON.stringify({ id: companyId, position: employee.position }));
    formData.append('schedules', JSON.stringify(employee.schedules));
    formData.append('hourly_rate', employee.hourly_rate);
    if (file) formData.append('profile', file);
    return this.http.patch<any>(`${this.USERS_API_URI}/${id}`, formData);
  }

  public getLocations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URI}/locations`);
  }
}