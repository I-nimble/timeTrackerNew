import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Project } from '../models/Project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  constructor(private http: HttpClient) {}
  API_URI: string = `${environment.apiUrl}/projects`;

  public get(userId: string = '0', type: string = ''): Observable<Project[]> {
    if (type && userId != '0') {
      let body = {
        type,
        userId,
      };
      return this.http.post<Project[]>(`${this.API_URI}/${type}`, body);
    }
    return this.http.get<Project[]>(`${this.API_URI}`);
  }

  public submit(data: any, id: any = null) {
    if (id) return this.http.put(`${this.API_URI}/${id}`, data);
    return this.http.post(`${this.API_URI}`, data);
  }

  public delete(id: number) {
    return this.http.delete(`${this.API_URI}/${id}`);
  }
}
