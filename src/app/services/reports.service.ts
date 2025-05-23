import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from '../models/User.model';
import { UsersService } from './users.service';
import { ReportFilter } from '../components/reports-filter/reports-filter.component';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private dateRangeSource = new BehaviorSubject<any | null>(null);
  dateRange$ = this.dateRangeSource.asObservable();

  constructor(private http: HttpClient, private userService: UsersService) {}
  
  private API_URI: string = `${environment.apiUrl}/reports`;

  setDateRange(firstSelect: any, lastSelect: any) {
    this.dateRangeSource.next({ firstSelect, lastSelect });
  }

  getCurrentDateRange(): any | null {
    return this.dateRangeSource.getValue();
  }

  getRange(dates: any, user: any = null, filters: ReportFilter) {
    this.userService.selectedUser = user;
    const headers = new HttpHeaders({ 'content-type': 'application/json' });
    const info = this.toBeSent(dates, user, filters);

    return this.http.post(`${this.API_URI}/entries`, info, { headers });
  }

  getReport(dates: any, user: any = null, filters:any) { 
    const headers = new HttpHeaders({ 'content-type': 'application/json' });
    const info = this.toBeSent(dates, user, filters);
    return this.http.post(`${this.API_URI}`, info, {
      headers,
      responseType: 'blob',
    });
  }

  getToDoReport(dates: any, user: any = null, project: any = null) {
    const headers = new HttpHeaders({ 'content-type': 'application/json' });
    const info = this.toBeSent(dates, user, project);
    return this.http.post(`${this.API_URI}/to-do`, info, {
      headers,
      responseType: 'blob',
    });
  }

  toBeSent(dates: any, user: any, filters: ReportFilter) {
    let info = {
      firstSelect: dates.firstSelect,
      lastSelect: dates.lastSelect,
      timezone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...filters,
      ...user,
    };
    return info;
  }
}
