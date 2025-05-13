import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Services } from '../models/Service.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ServicesService {
  constructor(private http: HttpClient) {}
  private API_URI = environment.apiUrl + '/services';

  public get(): Observable<Services[]> {
    return this.http.get<Services[]>(`${this.API_URI}`);
  }

  public getById(id: number): Observable<Services> {
    return this.http.get<Services>(`${this.API_URI}/${id}`);
  }
}
