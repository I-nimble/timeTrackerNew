import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Company } from '../models/Company.model';
import { PossibleClient } from '../models/Client';
import { Observable, of, forkJoin, Subject } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CompaniesService {
  selectedCompany: any = { id: null, name: '' };
  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}
  API_URI = environment.apiUrl + '/companies';
  logoUrl: any = null;
  private logoUpdatedSource = new Subject<void>();
  logoUpdated$ = this.logoUpdatedSource.asObservable();

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
    return this.http.post<{ logo: string }>(`${this.API_URI}/logo`, { id }).pipe(
      map(response => {
        if (!response.logo) return null;
        const url = `${environment.upload}/company-logos/${response.logo}`;
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
      })
    );
  }

  getUploadUrl(type: string) {
    const escapedType = type.replace(/\//g, '%2F');
    return this.http.get<any>(`${environment.apiUrl}/generate_upload_url/${escapedType}`);
  }

  public submit(data: any, id: any = null) {
    let logoUpload$ = of(null);
    if (data.logo instanceof File) {
        logoUpload$ = this.getUploadUrl('uploads/company-logos').pipe(
            switchMap((logoUrl: any) => {
                this.logoUrl = logoUrl.url;
                const imgFile = data.logo;

                const headers = new HttpHeaders({
                    'Content-Type': imgFile.type,
                });
                return this.http.put(`${this.logoUrl}`, imgFile, { headers }).pipe(
                    map(() => {
                        const urlParts = this.logoUrl.split('?')[0].split('/');
                        return urlParts[urlParts.length - 1];
                    })
                );
            })
        );
    } else {
      const newLogo = data.logo ? data.logo.split('?')[0].split('/').pop() : null
      logoUpload$ = of(newLogo);
    }

    return forkJoin([logoUpload$]).pipe(
        switchMap(([logo]) => {
            const body = {
                ...data,
                logo: logo,
                id: data.id == -1 ? null : data.id,
            };

            const request$ = id
              ? this.http.put(`${this.API_URI}/${id}`, body)
              : this.http.post(`${this.API_URI}`, body);

            return request$.pipe(
              map((result) => {
                this.logoUpdatedSource.next();
                return result;
              })
            );
        })
    );
  }

  public delete(id: number) {
    return this.http.delete(`${this.API_URI}/${id}`);
  }

  public getEmployees(company_id: number | string) {
    return this.http.get(`${this.API_URI}/${company_id}/employees`);
  }
  
  public createPossible(body: any) {
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
