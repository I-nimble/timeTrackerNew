import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface TourProgress {
  id?: number;
  user_id?: number;
  tour_key: string;
  current_step: number;
  completed: boolean;
  skipped: boolean;
  started_at?: string;
  completed_at?: string | null;
  progress?: any;
}

@Injectable({ providedIn: 'root' })
export class TourApiService {
  private baseUrl = `${environment.apiUrl}/tours`;

  constructor(private http: HttpClient) {}

  getProgress(tourKey?: string): Observable<TourProgress | null> {
    const params = tourKey ? new HttpParams().set('tour_key', tourKey) : undefined;
    return this.http.get<TourProgress | null>(`${this.baseUrl}`, { params });
  }

  start(payload: Partial<TourProgress>, tourKey?: string): Observable<TourProgress> {
    const body = tourKey ? { ...payload, tour_key: tourKey } : payload;
    return this.http.post<TourProgress>(`${this.baseUrl}/start`, body);
  }

  updateProgress(payload: Partial<TourProgress>, tourKey?: string): Observable<TourProgress> {
    const body = tourKey ? { ...payload, tour_key: tourKey } : payload;
    return this.http.patch<TourProgress>(`${this.baseUrl}/progress`, body);
  }

  complete(payload: Partial<TourProgress> = {}, tourKey?: string): Observable<TourProgress> {
    const body = tourKey ? { ...payload, tour_key: tourKey } : payload;
    return this.http.post<TourProgress>(`${this.baseUrl}/complete`, body);
  }

  skip(tourKey?: string): Observable<TourProgress> {
    const body = tourKey ? { tour_key: tourKey } : {};
    return this.http.post<TourProgress>(`${this.baseUrl}/skip`, body);
  }
}
