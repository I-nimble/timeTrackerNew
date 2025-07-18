import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PerformanceService {
  constructor(private http: HttpClient) {}
  API_URI = environment.apiUrl + '/performance';

  getMetrics(companyId: number, dateFrom: string, dateTo: string) {
    return this.http.post<any[]>(
      `${this.API_URI}/metrics`,
      { companyId, dateFrom, dateTo }
    );
  }
}
