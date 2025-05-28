import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor(private http: HttpClient) {}
  private API_URI = environment.apiUrl + '/companies';

  public uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post(`${this.API_URI}/upload-company-file`, formData);
  }

  public get(): Observable<any> {
    return this.http.get(`${this.API_URI}/company-files`);
  }
}
