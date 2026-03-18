import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApplicationListResponse } from '../models/application.model';
import { CandidateEvaluationRequest, CandidateEvaluationResponse, CandidateEvaluationResultsParams } from '../models/ai.model';

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

  evaluateCandidates(request: CandidateEvaluationRequest): Observable<CandidateEvaluationResponse> {
    return this.http.post<CandidateEvaluationResponse>(
      `${this.API_URI}/ai/candidate-evaluation`,
      request
    );
  }

  getCandidateEvaluationResults(
    sessionId: string,
    params: CandidateEvaluationResultsParams,
  ): Observable<CandidateEvaluationResponse> {
    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      httpParams = httpParams.set(key, String(value));
    });

    return this.http.get<CandidateEvaluationResponse>(
      `${this.API_URI}/ai/candidate-evaluation/${sessionId}/results`,
      { params: httpParams },
    );
  }

  evaluatePosts(question: string): Observable<{ posts: { id: string, title: string, selftext: string, keyword: string }[] }> {
    return this.http.post<{ posts: { id: string, title: string, selftext: string, keyword: string }[] }>(
      `${this.API_URI}/ai/post-evaluation`,
      { question }
    );
  }
}