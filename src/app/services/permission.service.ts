import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private apiUrl = `${environment.apiUrl}/permissions`;

  constructor(private http: HttpClient) {}

  getAllPermissions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`);
  }

  getAllUsersPermissions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }
  
  getUserPermissions(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/${userId}`);
  }
  
  getPermissionsBySection(sectionKey: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/section/${sectionKey}`);
  }

  setUserOverride(userId: number, permissionId: number, allow: boolean): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/user/${userId}/overrides`, { permissionId, allow });
  }

  removeUserOverride(userId: number, permissionId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/user/${userId}/overrides/${permissionId}`);
  }

  assignRolePermissions(roleId: number, permissionIds: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/role/${roleId}/permissions`, { permissionIds });
  }

  removeRolePermission(roleId: number, permissionId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/role/${roleId}/permissions/${permissionId}`);
  }
}