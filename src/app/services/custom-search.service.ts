import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CustomSearchService {
  constructor(private http: HttpClient) {}
  API_URI = environment.apiUrl + '/custom-search';

  public getClientInfo(userId: string): Observable<any> {
    return this.http.get<any>(`${this.API_URI}/${userId}`);
  }

  public saveSubmission(data: any): Observable<any> {
    return this.http.post<any>(`${this.API_URI}`, data);
  }

}
