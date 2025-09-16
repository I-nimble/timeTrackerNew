import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from "src/environments/environment";
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private apiUrl = `${environment.apiUrl}/stripe`;
  constructor(private http: HttpClient) { }

  public getInvoiceList(): Observable<any> {
    return this.http.get(`${this.apiUrl}/invoice`);
  }

  createInvoice(invoiceData: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/invoice`, invoiceData);
}

  updateInvoice(id: number, invoiceData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/invoice/${id}`, invoiceData);
  }

  getInvoiceDetail(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/invoice/${id}`);
  }

  approveInvoice(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/invoice/${id}/approve`, {id});
  }

  deleteInvoice(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/invoice/${id}`);
  }
}
