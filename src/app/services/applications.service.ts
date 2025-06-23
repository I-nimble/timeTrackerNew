import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, forkJoin, of, Subject, tap } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ApplicationsService {
  constructor(private http: HttpClient) {}
  API_URI = environment.apiUrl;
  selectedCards: any[] = [];
  selectedApplicants: any[] = [];
  resumeUrl: any = null;
  photoUrl: any = null;
  private applicationsSeenSource = new Subject<void>();
  applicationsSeen$ = this.applicationsSeenSource.asObservable();

  markAsSeen() {
    return this.http.put(`${this.API_URI}/applications/mark-as-seen`, {}).pipe(
      tap(() => this.applicationsSeenSource.next())
    );
  }

  addSelectedCard(card: any): Observable<any[]> {
    return this.http.put<any[]>(`${this.API_URI}/applications/select/${card.id}`, card)
  }

  removeSelectedCard(id: number): Observable<any[]> {
    return this.http.put<any[]>(`${this.API_URI}/applications/deselect/${id}`, {});
  }

  getSelectedCards() {
    return this.selectedCards;
  }

  clearSelectedCards() {
    this.selectedCards = [];
  }

  setSelectedApplicants(applicants: any[]) {
    this.selectedApplicants = applicants;
  }

  getSelectedApplicant() {
    return this.selectedApplicants;
  }

  clearSelectedApplicants() {
    this.selectedApplicants = [];
  }

  public get(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URI}/applications/`);
  }

  public getSelectedApplications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URI}/applications/selected`);
  }

  public getApplicationsByPosition(position_id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URI}/applications/${position_id}`);
  }

  public delete(id: number): Observable<any[]> {
    return this.http.delete<any[]>(`${this.API_URI}/applications/${id}`);
  }

  getUploadUrl(type: string) {
    return this.http.get<any>(`${this.API_URI}/generate_upload_url/${type}`);
  }

  public submit(data: any, id: any = null): Observable<any> {
    let resumeUpload$ = of(null);
    let photoUpload$ = of(null);

    if(data.cv instanceof File) {
      resumeUpload$ = this.getUploadUrl('resumes').pipe(
        switchMap((resumeUrl: any) => {
          this.resumeUrl = resumeUrl.url;
          const file = data.cv
          const headers = new HttpHeaders({
            'Content-Type': file.type,
          });
          return this.http.put(`${this.resumeUrl}`, file, { headers }).pipe(
            map(() => {
              const urlParts = this.resumeUrl.split('?')[0].split('/');
              return urlParts[urlParts.length - 1];
            })
          );
        })
      );
    }
    else if (data.resume_url) {
      resumeUpload$ = of(data.resume_url);
    }
    if(data.profile_pic instanceof File) {
      photoUpload$ = data.profile_pic
        ? this.getUploadUrl('photos').pipe(
            switchMap((photoUrl: any) => {
              this.photoUrl = photoUrl.url;
              const imgFile = data.profile_pic
  
              const headers = new HttpHeaders({
                'Content-Type': imgFile.type,
              });
              return this.http.put(`${this.photoUrl}`, imgFile, { headers }).pipe(
                map(() => {
                  const urlParts = this.photoUrl.split('?')[0].split('/');
                  return urlParts[urlParts.length - 1];
                })
              );
            })
          )
        : of(null);
    }
    else {
      photoUpload$ = of(data.profile_pic_url);
    }

    return forkJoin([resumeUpload$, photoUpload$]).pipe(
      switchMap(([fileName, profilePic]) => {
        const body = {
          ...data,
          file_name: fileName,
          profile_pic: profilePic,
          phone: null,
          company_id: data.company_id == -1 ? null : data.company_id,
        };

        if (id) return this.http.put(`${this.API_URI}/applications/${id}`, body);
        return this.http.post(`${this.API_URI}/applications`, body);
      })
    );
  }
}
