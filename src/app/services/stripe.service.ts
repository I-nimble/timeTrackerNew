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

  createPaymentIntent(invoiceId: string): Observable<{ clientSecret: string, amount: number }> {
  const headers = new HttpHeaders({'content-type':'application/json'});
  return this.http.post<{ clientSecret: string, amount: number }>(
    `${environment.apiUrl}/stripe/checkout/${invoiceId}`, 
    {},
    { headers }
  );
}

updateInvoiceStatus(invoiceId: string, status: 'paid' | 'unpaid'): Observable<any> {
  const headers = new HttpHeaders({'content-type':'application/json'});
  return this.http.patch<any>(`${environment.apiUrl}/stripe/invoice/${invoiceId}`, { status }, { headers });
}

  // charge(body: any){
  //   const headers = new HttpHeaders({'content_type':'application/json'})
  //   return this.http.post<any>(environment.apiUrl+'/stripe/checkout', body, {headers})
  // }
}