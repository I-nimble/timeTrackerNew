import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AIService {
  private API_URI = environment.apiUrl;

  constructor(private http: HttpClient) { }

  evaluateExperts(experts: any[], question: string): Observable<{ answer: { parts: { text: string }[] } }> {
    return this.http.post<{ answer: { parts: { text: string }[] } }>(
      `${this.API_URI}/ai/expert-evaluation`,
      { experts, question }
    );
  }

  evaluateCandidates(candidates: any[], question: string): Observable<{ answer: { parts: { text: string }[] } }> {
    return this.http.post<{ answer: { parts: { text: string }[] } }>(
      `${this.API_URI}/ai/candidate-evaluation`,
      { candidates, question }
    );
  }

  evaluatePosts(question: string): Observable<{ posts: { id: string, title: string, selftext: string, keyword: string }[] }> {
    return this.http.post<{ posts: { id: string, title: string, selftext: string, keyword: string }[] }>(
      `${this.API_URI}/ai/post-evaluation`,
      { question }
    );
  }
}