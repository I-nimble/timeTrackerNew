import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of, switchMap, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CertificationsService {
  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get(`${environment.apiUrl}/certifications`);
  }

  getOne(id: number) {
    return this.http.get(`${environment.apiUrl}/certifications/${id}`);
  }

  create(data: any) {
    console.log('Creating certification with data:', data);
    return this.http.post(`${environment.apiUrl}/certifications`, data);
  }

  update(id: number, data: any) {
    return this.http.put(`${environment.apiUrl}/certifications/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`${environment.apiUrl}/certifications/${id}`);
  }

  getUploadUrl(type: string, file: File) {
    return this.http.post<any>(
      `${environment.apiUrl}/generate_upload_url/${type}`,
      { contentType: file.type, originalFileName: file.name }
    );
  }

  uploadAttachment(file: File): Observable<any> {
     return this.getUploadUrl('certifications', file).pipe(
        switchMap((uploadData: any) => {
           const filename = uploadData.key.split('/')[1]; // Extract filename from key
           const headers = new HttpHeaders({ 'Content-Type': file.type, 'X-Filename': filename });
           return this.http.put(uploadData.url, file, { headers }).pipe(
              map(() => {
                 return {
                    url: uploadData.url,
                    key: uploadData.key
                 };
              })
           );
        })
     );
  }

  getAttachmentUrl(key: string): string {
    return `${environment.apiUrl}/certifications/attachment/${key}`;
  }
}
