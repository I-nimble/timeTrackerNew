import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CandidateEvaluationFilters,
  CandidateEvaluationResponse,
} from '../models/ai.model';

interface CandidateEvaluationQuery {
  page?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class AIService {
  private API_URI = environment.apiUrl;

  constructor(private http: HttpClient) {}

  evaluateExperts(
    experts: any[],
    question: string,
  ): Observable<{ answer: { parts: { text: string }[] } }> {
    return this.http.post<{ answer: { parts: { text: string }[] } }>(
      `${this.API_URI}/ai/expert-evaluation`,
      { experts, question },
    );
  }

  evaluateCandidates(payload: {
    question: string;
    filters: CandidateEvaluationFilters;
    page?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Observable<CandidateEvaluationResponse> {
    return this.http.post<CandidateEvaluationResponse>(
      `${this.API_URI}/ai/candidate-evaluation`,
      payload,
    );
  }

  getCandidateEvaluationResults(
    sessionId: string,
    query: CandidateEvaluationQuery,
  ): Observable<CandidateEvaluationResponse> {
    const queryParams = new URLSearchParams();
    if (query.page !== undefined) {
      queryParams.set('page', String(query.page));
    }
    if (query.offset !== undefined) {
      queryParams.set('offset', String(query.offset));
    }
    if (query.sortBy) {
      queryParams.set('sortBy', query.sortBy);
    }
    if (query.sortOrder) {
      queryParams.set('sortOrder', query.sortOrder);
    }

    const queryString = queryParams.toString();

    return this.http.get<CandidateEvaluationResponse>(
      `${this.API_URI}/ai/candidate-evaluation/${sessionId}/results${queryString ? `?${queryString}` : ''}`,
    );
  }

  evaluatePosts(question: string): Observable<{
    posts: { id: string; title: string; selftext: string; keyword: string }[];
  }> {
    return this.http.post<{
      posts: { id: string; title: string; selftext: string; keyword: string }[];
    }>(`${this.API_URI}/ai/post-evaluation`, { question });
  }
}
