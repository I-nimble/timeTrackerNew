import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';
import { CompanyPlan } from '../models/Plan.model';

@Injectable({
  providedIn: 'root',
})
export class PlansService {
  constructor(private http: HttpClient) {}
  API_URI = environment.apiUrl + '/plans';

  private currentPlanSubject = new BehaviorSubject<CompanyPlan | null>(null);
  public currentPlan$ = this.currentPlanSubject.asObservable();

  public getCurrentPlan(companyId: number): Observable<CompanyPlan> {
    return this.http.get<CompanyPlan>(`${this.API_URI}/${companyId}`);
  }

  public getCurrentPlanValue(): CompanyPlan | null {
    return this.currentPlanSubject.value;
  }

  public setCurrentPlan(plan: CompanyPlan): void {
    this.currentPlanSubject.next(plan);
  }

  public clearCurrentPlan(): void {
    this.currentPlanSubject.next(null);
  }
}
