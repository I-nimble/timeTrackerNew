import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  getProgress(): Observable<TourProgress | null> {
    return this.http.get<TourProgress | null>(`${this.baseUrl}`);
  }

  start(payload: Partial<TourProgress>): Observable<TourProgress> {
    return this.http.post<TourProgress>(`${this.baseUrl}/start`, payload);
  }

  updateProgress(payload: Partial<TourProgress>): Observable<TourProgress> {
    return this.http.patch<TourProgress>(`${this.baseUrl}/progress`, payload);
  }

  complete(payload: Partial<TourProgress> = {}): Observable<TourProgress> {
    return this.http.post<TourProgress>(`${this.baseUrl}/complete`, payload);
  }

  skip(): Observable<TourProgress> {
    return this.http.post<TourProgress>(`${this.baseUrl}/skip`, {});
  }
}
