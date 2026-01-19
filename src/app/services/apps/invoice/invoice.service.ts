import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from "src/environments/environment";
import { Observable, forkJoin, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }

  getInvoiceFile(id: number, format: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/stripe/invoice/${id}/file/${format || 'excel'}`, {
      useTimezone: true,
    }, {
      responseType: 'blob'
    });
  }

  public getInvoiceList(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stripe/invoice`);
  }

  createInvoice(invoiceData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/stripe/invoice`, invoiceData);
  }

  updateInvoice(id: number, invoiceData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/stripe/invoice/${id}`, invoiceData);
  }

  getInvoiceDetail(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/stripe/invoice/${id}`);
  }

  approveInvoice(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/stripe/invoice/${id}/approve`, {id});
  }

  deleteInvoice(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/stripe/invoice/${id}`);
  }

  // Reports
  getReportsList(): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments-reports`);
  }

  getReportById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments-reports/${id}`, { responseType: 'blob' });
  }

  getUploadUrl(type: string, file?: File) {
    const escapedType = type.replace(/\//g, '%2F');
    return this.http.post<any>(
      `${environment.apiUrl}/generate_upload_url/${escapedType}`,
      { contentType: file?.type || 'application/octet-stream' }
    );
  }

  submitReport(data: any): Observable<any> {
    let fileUpload$ = of(null);

    if (data.file instanceof File) {
      fileUpload$ = this.getUploadUrl('reports', data.file).pipe(
        switchMap((uploadData: any) => {
          const uploadUrl = uploadData.url;
          const file = data.file;

          const headers = new HttpHeaders({
            'Content-Type': file.type,
          });

          return this.http.put(uploadUrl, file, { headers }).pipe(
            map(() => {
              const urlParts = uploadUrl.split('?')[0].split('/');
              return urlParts[urlParts.length - 1];
            })
          );
        })
      );
    } else if (data.file_path) {
      fileUpload$ = of(data.file_path);
    }

    return forkJoin([fileUpload$]).pipe(
      switchMap(([fileName]) => {
        const body = {
          ...data,
          file_path: fileName,
        };

        return this.http.post(`${this.apiUrl}/payments-reports`, body);
      })
    );
  }

  deleteReport(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/payments-reports/${id}`);
  }

  markReportAsSeen(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments-reports/${id}/mark-as-seen`, {});
  }
}
