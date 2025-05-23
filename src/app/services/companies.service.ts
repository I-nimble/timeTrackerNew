import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Company } from '../models/Company.model';
import { PossibleClient } from '../models/Client';
import { Observable, of, forkJoin } from 'rxjs';
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

            if (id) return this.http.put(`${this.API_URI}/${id}`, body);
            return this.http.post(`${this.API_URI}`, body);
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
