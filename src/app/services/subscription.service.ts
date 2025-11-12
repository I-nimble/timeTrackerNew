import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface SubscriptionStatus {
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'inactive';
  current_period_end?: string;
  cancel_at_period_end: boolean;
}

export interface SubscriptionReceipt {
  id: string;
  number: string;
  amount_paid: number;
  currency: string;
  status: string;
  created: Date;
  period_start: Date;
  period_end: Date;
  receipt_url: string;
  pdf_url: string;
  subscription_id: string;
  customer_name: string;
  customer_email: string;
  plan_name: string;
  plan_amount: number;
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

  getSubscriptionReceipt(): Observable<SubscriptionReceipt> {
    return this.http.get<SubscriptionReceipt>(`${this.apiUrl}/receipt`);
  }
}