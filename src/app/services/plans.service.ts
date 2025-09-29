import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PlansService {
  constructor(private http: HttpClient) {}
  API_URI = environment.apiUrl + '/plans';

  private currentPlanSubject = new BehaviorSubject<any>(null);
  public currentPlan$ = this.currentPlanSubject.asObservable();

  public getCurrentPlan(companyId: number): Observable<any> {
    return this.http.get<any>(`${this.API_URI}/${companyId}`);
  }

  public getCurrentPlanValue(): any {
    return this.currentPlanSubject.value;
  }

  public setCurrentPlan(plan: any): void {
    this.currentPlanSubject.next(plan);
  }

  public clearCurrentPlan(): void {
    this.currentPlanSubject.next(null);
  }

}
