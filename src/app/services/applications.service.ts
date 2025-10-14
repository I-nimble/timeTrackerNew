import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, forkJoin, of, Subject, tap } from 'rxjs';
import { switchMap, map, filter } from 'rxjs/operators';

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

  reject(id: number): Observable<any[]> {
    return this.http.put<any[]>(`${this.API_URI}/applications/reject/${id}`, {});
  }

  sendToTalentMatch(id: number): Observable<any> {
    return this.http.put(`${this.API_URI}/applications/talent-match/${id}`, {});
  }

  getCandidateFile(id: number, format: string): Observable<Blob> {
    return this.http.post(`${this.API_URI}/applications/file/${id}/`, { format }, { responseType: 'blob' });
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

  public getLocations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URI}/applications/locations`);
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

  getUploadUrl(type: string, file?: File) {
    return this.http.post<any>(
      `${this.API_URI}/generate_upload_url/${type}`,
      { contentType: file?.type || 'application/octet-stream' }
    );
  }

  uploadCV(file: File, candidateId: number): Observable<any> {
    let resumeUpload$ = of(null);
    if(file instanceof File) {
      resumeUpload$ = this.getUploadUrl('resumes', file).pipe(
        switchMap((resumeUrl: any) => {
          this.resumeUrl = resumeUrl.url;
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
    } else {
      resumeUpload$ = of(null);
    }

    return resumeUpload$.pipe(
      switchMap((resumeUrl: any) => {
        if(!resumeUrl) return of(null);

        const body = {
          resume: resumeUrl
        };
        return this.http.put(`${this.API_URI}/applications/resume/${candidateId}`, body);
      })
    );
  }

  public submit(data: any, id: any = null): Observable<any> {
    let resumeUpload$ = of(null);
    let photoUpload$ = of(null);

    if(data.cv instanceof File) {
      resumeUpload$ = this.getUploadUrl('resumes', data.cv).pipe(
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
        ? this.getUploadUrl('photos', data.profile_pic).pipe(
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
          phone: data.phone ?? null,
          company_id: data.company_id == -1 ? null : data.company_id,
        };

        if (id) return this.http.put(`${this.API_URI}/applications/${id}`, body);
        return this.http.post(`${this.API_URI}/applications`, body);
      })
    );
  }

  getFilteredApplicationsByDay(applications: any[]): any[] {
    let filteredApplications: any[] = [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(0, 0, 0, 0);
    // Only show applications if today is Monday to Friday
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      filteredApplications = applications.filter((app: any) => {
        if (!app.submission_date) return false;
        const [year, month, day] = app.submission_date.split('T')[0].split('-').map(Number);
        const submission = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)); 
        submission.setHours(0, 0, 0, 0);
        return submission >= monday && submission <= friday;
      });
    } else {
      filteredApplications = [];
    }
    return filteredApplications;
  }

    uploadIntroductionVideo(videoFile: File, userId: number): Observable<any> {
    return this.getVideoUploadUrl(videoFile, userId).pipe(
      switchMap((uploadData: any) => {
        const headers = new HttpHeaders({
          'Content-Type': videoFile.type,
        });

        return this.http.put(uploadData.url, videoFile, { 
          headers,
          reportProgress: true,
          observe: 'events'
        }).pipe(
          map(event => this.getUploadProgress(event)),
          filter((event: any) => event.type === HttpEventType.Response),
          map(() => {
            return {
              message: "Video uploaded successfully",
              videoUrl: `https://inimble-app.s3.us-east-1.amazonaws.com/${uploadData.key}`,
              fileName: uploadData.fileName
            };
          })
        );
      })
    );
  }

  private getVideoUploadUrl(videoFile: File, userId: number): Observable<any> {
    return this.http.post<any>(
      `${this.API_URI}/generate_upload_url/video/introduction`,
      { 
        contentType: videoFile.type,
        userId: userId
      }
    );
  }

  private getUploadProgress(event: any): any {
    if (event.type === HttpEventType.UploadProgress) {
      const progress = Math.round(100 * event.loaded / event.total);
      return { type: 'progress', progress };
    } else if (event.type === HttpEventType.Response) {
      return event;
    }
    return event;
  }
}
