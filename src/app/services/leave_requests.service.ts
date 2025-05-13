import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { NotificationStore } from 'src/app/stores/notification.store';

@Injectable({
  providedIn: 'root'
})
export class LeaveRequestsService {
  store = inject(NotificationStore);

  constructor(private http: HttpClient,) { }
  private API_URI = environment.apiUrl + '/leave_requests';

  public get(body: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.API_URI}/get`, body);
  }

  public getLeaveTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URI}/leave_types`);
  }

  public submit(data: any, id: any = null) {
    if (id) return this.http.put(`${this.API_URI}/${id}`, data);
    return this.http.post(`${this.API_URI}`, data);
  }

  public delete(id: number) {
    return this.http.delete(`${this.API_URI}/${id}`)
  }
}