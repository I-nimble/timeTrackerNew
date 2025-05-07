import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { RatingsEntries } from '../models/RatingsEntries.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RatingsEntriesService {

  constructor(private http: HttpClient) {}
  private API_URI = environment.apiUrl + '/ratings_entries';

  public get(): Observable<RatingsEntries[]> {
    return this.http.get<RatingsEntries[]>(`${this.API_URI}`);
  }
  
  public checkPending(data: any): Observable<any> {
    return this.http.post(`${this.API_URI}/pending`, data);
  }

  public getByUser(id:number): Observable<RatingsEntries[]> {
    return this.http.get(`${this.API_URI}/user/${id}`).pipe(
      map((res: any) => res.ratings)
    );
  }

  public submit(data: any, id: any = null) {
    if (id) return this.http.put(`${this.API_URI}/${id}`, data);
    return this.http.post(`${this.API_URI}`, data);
  }

  public delete(id: number){
    return this.http.delete(`${this.API_URI}/${id}`)
  }

  public getEntryId (entries: any[]){
    return this.http.post(`${this.API_URI}/get-entry-id`, entries);
  }

  getUserGoalsByDate(userId: number, date: any): Observable<any> {
    const body = { userId, date };
    return this.http.post(`${this.API_URI}/user-goals`, body);
  }

  public getRange(datesRange: any, userId?: any): Observable<any[]> {
    const body = { 
      dateRange: [datesRange.firstSelect, datesRange.lastSelect], 
      userId 
    };
    return this.http.post<any[]>(`${this.API_URI}/range/`, body).pipe(
      map((res: any) => res.ratings)
    );
  }
}