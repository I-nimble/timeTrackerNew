import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface SubscriptionStatus {
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'inactive';
  current_period_end?: string;
  cancel_at_period_end: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private apiUrl = `${environment.apiUrl}/stripe/subscription`;

  constructor(private http: HttpClient) {}

  createSubscription(): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.apiUrl}/create`, {});
  }

  cancelSubscription(): Observable<{ message: string; current_period_end: number }> {
    return this.http.post<{ message: string; current_period_end: number }>(`${this.apiUrl}/cancel`, {});
  }

  getSubscriptionStatus(): Observable<SubscriptionStatus> {
    return this.http.get<SubscriptionStatus>(`${this.apiUrl}/status`);
  }
}