import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class QuickContactService {
  constructor(private http: HttpClient) {}
  private API_URI = environment.apiUrl + '/quick-contact';

  public submit(data: any) {
    const body = {
      name: data.name,
      email: data.email,
      phone: data.phone,
    };
    return this.http.post(`${this.API_URI}`, body);
  }
}