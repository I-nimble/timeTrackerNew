import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PositionCategory {
  id: number;
  category_name: string;
  is_active: boolean;
}

export interface MatchScore {
  id?: number;
  application_id: number;
  position_category_id: number;
  match_percentage: number;
  category?: PositionCategory;
}

export interface CreateMatchScoresRequest {
  application_id: number;
  match_scores: {
    position_category_id: number;
    match_percentage: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationMatchScoresService {
  private apiUrl = environment.apiUrl + '/match-scores';

  constructor(private http: HttpClient) { }

  getByApplicationId(applicationId: number): Observable<MatchScore[]> {
    return this.http.get<MatchScore[]>(`${this.apiUrl}/application/${applicationId}`);
  }

  createMatchScores(data: CreateMatchScoresRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}`, data);
  }

  updateMatchScore(id: number, matchPercentage: number): Observable<MatchScore> {
    return this.http.patch<MatchScore>(`${this.apiUrl}/${id}`, { match_percentage: matchPercentage });
  }

  getPositionCategories(): Observable<PositionCategory[]> {
    return this.http.get<PositionCategory[]>(`${this.apiUrl}/position-categories/all`);
  }
}