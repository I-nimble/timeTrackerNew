import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Company } from '../models/Company.model';
import { PossibleClient } from '../models/Client';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class CompaniesService {
  selectedCompany: any = { id: null, name: '' };
  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}
  API_URI = environment.apiUrl + '/companies';

  public getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(this.API_URI);
  }

  public getFilteredCompanies(body:any): Observable<any> {
    return this.http.post<any>(`${this.API_URI}/filter`, body);
  }
  
  public getEmployer(id:number): Observable<any> {
    return this.http.get<any>(`${this.API_URI}/${id}`);
  }

  public getByOwner(): Observable<any> {
    return this.http.get<any>(`${this.API_URI}/owner`);
  }

  public getCompanyLogo(id: number): Observable<SafeResourceUrl | null> {
    if (!id) {
      return of(null);
    }

    const url = `${environment.upload}/company-logos/${id}.jpeg`;
    const safeUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

    return new Observable<SafeResourceUrl | null>((observer) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        if (img.width === 0 && img.height === 0) {
          observer.next(null);
        } else {
          observer.next(url);
        }
        observer.complete();
      };
  
      img.onerror = () => {
        observer.next(null);
        observer.complete();
      };
    });
  }

  public submit(data: any, id: any = null) {
    let form = new FormData();
    if (data.description) form.append('description', data.description);
    if (data.logo) form.append('logo', data.logo);
    if (data.name) form.append('name', data.name);
    if (data.timezone) form.append('timezone', data.timezone);

    if (id) return this.http.put(`${this.API_URI}/${id}`, form);
    return this.http.post(`${this.API_URI}`, form);
  }

  public delete(id: number) {
    return this.http.delete(`${this.API_URI}/${id}`);
  }

  public getEmployees(company_id: number | string) {
    return this.http.get(`${this.API_URI}/${company_id}/employees`);
  }
  
  public createPossible(body: PossibleClient) {
    return this.http.post(`${this.API_URI}/create/possible`, body);
  }

  setCompanyInformation(company: any) {
    this.selectedCompany = company;
  }
  getSelectedCompany() {
    return this.selectedCompany;
  }
  resetCompany() {
    this.selectedCompany = { id: null, name: null };
  }
  checkCompanyExists(company: string): Observable<{ exists: boolean }> {
    return this.http.post<{ exists: boolean }>(`${this.API_URI}/check-company`, { company });
  }
}
