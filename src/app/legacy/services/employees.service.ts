import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import { Company } from '../models/Company.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeesService {
  private http = inject(HttpClient);
  private API_URI = environment.apiUrl + '/employees';
  private USERS_API_URI = environment.apiUrl + '/users';

  private normalizeCompanyId(value: unknown, fallback: unknown): number | null {
    const primary = Number(value ?? 0);
    if (primary > 0) return primary;

    const alt = Number(fallback ?? 0);
    return alt > 0 ? alt : null;
  }

  public get(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.API_URI}`);
  }

  public getOrphanEmployees(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.API_URI}/orphan`);
  }

  public getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(this.API_URI);
  }

  public getById(id: unknown | string): Observable<unknown[]> {
    return this.http.get<unknown>(`${this.API_URI}/${id}`);
  }

  public getByEmployee(): Observable<unknown[]> {
    return this.http.post<unknown[]>(`${this.API_URI}`, {});
  }

  public inviteEmployee(data: unknown): Observable<HttpResponse<unknown>> {
    return this.http.post<HttpResponse<unknown>>(
      `${this.API_URI}/invite`,
      data,
    );
  }

  public deleteEmployee(id: number) {
    return this.http.delete(`${this.API_URI}/${id}`);
  }

  public registerEmployee(data: unknown): Observable<HttpResponse<unknown>> {
    return this.http.post<HttpResponse<unknown>>(
      `${this.API_URI}/register`,
      data,
    );
  }

  public updateEmployee(
    id: number,
    employee: unknown,
    companyId: number,
    file: File | null,
  ): Observable<HttpResponse<unknown>> {
    const formData = new FormData();
    const normalizedCompanyId = this.normalizeCompanyId(
      employee?.company_id,
      companyId,
    );

    formData.append('name', employee.name);
    formData.append('last_name', employee.last_name);
    if (employee.password) formData.append('password', employee.password);

    if (normalizedCompanyId !== null) {
      formData.append('company_id', String(normalizedCompanyId));
    }

    formData.append('position', employee.position);
    formData.append('projects', JSON.stringify(employee.projects));
    formData.append(
      'employee',
      JSON.stringify({
        id: normalizedCompanyId ?? companyId,
        position: employee.position,
      }),
    );
    formData.append('schedules', JSON.stringify(employee.schedules));
    formData.append('hourly_rate', employee.hourly_rate);
    if (file) formData.append('profile', file);
    return this.http.patch<unknown>(`${this.USERS_API_URI}/${id}`, formData);
  }

  public getLocations(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.API_URI}/locations`);
  }

  public getEmployeeGeolocation(userId: number): Observable<unknown> {
    return this.http.get<unknown>(
      `${environment.apiUrl}/geolocation/${userId}`,
    );
  }
}
