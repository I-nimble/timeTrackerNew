import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OrgchartsService {
  constructor(private http: HttpClient) {}
  API_URI: string = `${environment.apiUrl}/orgcharts`;

  public get(companyId?: number): Observable<any> {
    if(companyId) {
      return this.http.get<any>(`${this.API_URI}/${companyId}`);
    }
    else {
      return this.http.get<any>(`${this.API_URI}`);
    }
  }

  public save(data: any, companyId: number) {
    return this.http.post(`${this.API_URI}/${companyId}`, data);
  }

  public delete(id: number) {
    return this.http.delete(`${this.API_URI}/${id}`);
  }
}
