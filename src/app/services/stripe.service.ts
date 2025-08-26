import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  constructor(private http: HttpClient) {}

  getPayments() {
    const headers = new HttpHeaders({'content-type':'application/json'});
    return this.http.get<any>(`${environment.apiUrl}/stripe`, { headers });
  }

  getPaymentDetail(id: number): Observable<any> {
      return this.http.get(`${environment.apiUrl}/${id}`);
  }

  getPaymentByInvoiceId(invoiceId: string): Observable<{ paymentId: number }> {
    return this.http.get<{ paymentId: number }>(`${environment.apiUrl}/stripe/invoice/${invoiceId}/payment`);
  }

  createPaymentIntent(invoiceId: string): Observable<{ clientSecret: string, amount: number }> {
    const headers = new HttpHeaders({'content-type':'application/json'});
    return this.http.post<{ clientSecret: string, amount: number }>(
      `${environment.apiUrl}/stripe/checkout/${invoiceId}`, 
      {},
      { headers }
    );
  }

  getReceiptUrl(paymentId: number): Observable<{ receiptUrl: string }> {
    return this.http.get<{ receiptUrl: string }>(`${environment.apiUrl}/stripe/${paymentId}/receipt-url`);
  }

  // charge(body: any){
  //   const headers = new HttpHeaders({'content_type':'application/json'})
  //   return this.http.post<any>(environment.apiUrl+'/stripe/checkout', body, {headers})
  // }
}