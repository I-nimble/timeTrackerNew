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

  public addEmployee(employee: any, file: File | null) {
    let formData = new FormData();
    if(employee.Name) formData.append('name', employee.Name);
    if(employee.LastName) formData.append('last_name', employee.LastName);
    if(employee.Email) formData.append('email', employee.Email);
    if(employee.Password) formData.append('password', employee.Password);
    if(employee.Position) formData.append('position', employee.Position.toString());
    if(employee.Projects && employee.Projects.length > 0) 
      formData.append('projects', JSON.stringify(employee.Projects));
    if(file) formData.append('image', file);

    return this.http.post<any>(`${this.API_URI}/add`, formData);
  }

  public deleteEmployee(id: number) {
    return this.http.delete(`${this.API_URI}/${id}`);
  }
}