import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PendingBill {
  amount: number | string;
  currency: {
    name: string;
  };
  status: {
    name: string;
  };
  [key: string]: unknown;
}

export type PaymentPayload = Record<string, unknown>;

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/stripe`;

  getPayments(): Observable<PendingBill[]> {
    return this.http.get<PendingBill[]>(`${this.apiUrl}/`);
  }

  createPayment(paymentData: PaymentPayload): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/`, paymentData);
  }

  updatePayment(id: number, paymentData: PaymentPayload): Observable<unknown> {
    return this.http.put<unknown>(`${this.apiUrl}/${id}`, paymentData);
  }

  deletePayment(id: number): Observable<unknown> {
    return this.http.delete<unknown>(`${this.apiUrl}/${id}`);
  }

  getPendingBills(): Observable<PendingBill[]> {
    return this.http.get<PendingBill[]>(`${this.apiUrl}/`);
  }
}
