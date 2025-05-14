import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Company } from '../models/Company.model';
import { Observable } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class PlansService {
  constructor(private http: HttpClient) {}
  API_URI = environment.apiUrl + '/plans';

  public getCurrentPlan(companyId: number): Observable<any> {
    return this.http.get<any>(`${this.API_URI}/${companyId}`);
  }
}
