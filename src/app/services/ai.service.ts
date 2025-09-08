import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AIService {
  private API_URI = environment.apiUrl;

  constructor(private http: HttpClient) {}

  evaluateExperts(experts: any[], question: string): Observable<{ answer: string }> {
    return this.http.post<{ answer: string }>(
      `${this.API_URI}/ai/expert-evaluation`,
      { experts, question }
    );
  }
}