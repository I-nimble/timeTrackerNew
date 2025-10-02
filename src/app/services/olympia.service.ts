import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, catchError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class OlympiaService {
  API_URI = `${environment.apiUrl}/olympia`;

  constructor(private http: HttpClient) { }

  checkOlympiaForm(): Observable<boolean> {
    return this.http.get<{ submitted: boolean }>(`${this.API_URI}/check`).pipe(
      map(response => response.submitted),
      catchError(() => of(false))
    );
  } 

  submitOlympiaForm(data: any): Observable<any> {
    return this.http.post(`${this.API_URI}`, data);
  }
}
