import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';
import {
  ApplicationDetails,
  FormQuestion,
  SubmitApplicationPayload
} from '../models/Careers';


@Injectable({
  providedIn: 'root'
})
export class CareersService {
  constructor(private http: HttpClient) {}
  API_URI = environment.apiUrl + '/careers';

  // GET /application (returns positions, departments, and locations)
  getApplicationOptions(): Observable<any> {
    return this.http.get(`${this.API_URI}/application`);
  }

  // GET /application with optional filters
  getFilteredApplicationOptions(
    location_id?: number,
    role_type?: 'position' | 'department',
    role_id?: number
  ): Observable<any> {
    let params = new HttpParams();

    if (location_id) {
      params = params.set('location_id', location_id.toString());
    }
    if (role_type) {
      params = params.set('role_type', role_type);
    }
    if (role_id) {
      params = params.set('role_id', role_id.toString());
    }

    return this.http.get(`${this.API_URI}/application`, { params });
  }

  // GET /questions?locationId=1&positionId=16 or &departmentId=3
  getFormQuestions(locationId: number, positionId?: number, departmentId?: number): Observable<FormQuestion[]> {
    let params = new HttpParams().set('locationId', locationId.toString());

    if (positionId) {
      params = params.set('positionId', positionId.toString());
    } else if (departmentId) {
      params = params.set('departmentId', departmentId.toString());
    }

    return this.http
      .get<{ questions: FormQuestion[] }>(`${this.API_URI}/questions`, { params })
      .pipe(map(res => res.questions)); // <-- this line extracts just the array
  }

  submitApplication(data: SubmitApplicationPayload): Observable<any> {
    return this.http.post(`${this.API_URI}/application`, data);
  }

  getApplicationById(id: number): Observable<ApplicationDetails> {
    return this.http.get<ApplicationDetails>(`${this.API_URI}/application/${id}`);
  }
}
