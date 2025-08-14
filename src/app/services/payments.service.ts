import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from "src/environments/environment";
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  constructor(private http: HttpClient) {}

  private apiUrl = `${environment.apiUrl}/stripe`;

  getPayments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/`);
  }

  createPayment(paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/`, paymentData);
  }

  updatePayment(id: number, paymentData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, paymentData);
  }

  deletePayment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
