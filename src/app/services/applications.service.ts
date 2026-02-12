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

  private applicationsUpdatedSource = new Subject<any>();
  applicationsUpdated$ = this.applicationsUpdatedSource.asObservable();

  getUserApplication(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URI}/applications/user/${id}`);
  }

  reject(id: number, reason: string | null): Observable<any> {
    return this.http.put<any>(
      `${this.API_URI}/applications/reject/${id}`,
      { rejection_reason: reason }
    );
  }

  sendToTalentMatch(id: number): Observable<any> {
    return this.http.put(`${this.API_URI}/applications/talent-match/${id}`, {});
  }

  sendToCandidates(id: number): Observable<any> {
    return this.http.put(`${this.API_URI}/applications/candidates/${id}`, {});
  }

  getCandidateFile(id: number, format: string): Observable<Blob> {
    return this.http.post(`${this.API_URI}/applications/file/${id}/`, { format }, { responseType: 'blob' });
  }

  checkProfile(id: number): Observable<any> {
    return this.http.get(`${this.API_URI}/applications/check-profile/${id}`, {});
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

  public getRankings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URI}/applications/rankings`);
  }

  public get(onlyTalentPool: boolean = false): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URI}/applications/${onlyTalentPool ? '?onlyTalentPool=true' : ''}`);
  }

  public getSelectedApplications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URI}/applications/selected`);
  }

  public getApplicationsByPosition(position_id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URI}/applications/${position_id}`);
  }

  public delete(id: number, action: 'delete' | 'review' = 'review'): Observable<any> {
    return this.http.delete<any[]>(`${this.API_URI}/applications/${id}`, {
      body: { action }
    });
  }

  getUploadUrl(type: string, file?: File, email?: string, applicationId?: number, isProfilePicture: boolean = false) {
    return this.http.post<any>(
      `${this.API_URI}/generate_upload_url/${type}`,
      { 
        contentType: file?.type || 'application/octet-stream',
        originalFileName: file?.name,
        email: email,
        applicationId: applicationId,
        isProfilePicture: isProfilePicture
      }
    );
  }

  uploadCV(file: File, candidateId: number): Observable<any> {
    let resumeUpload$ = of(null);
    if(file instanceof File) {
      resumeUpload$ = this.getUploadUrl('resumes', file, undefined, candidateId, false).pipe(
        switchMap((resumeUrl: any) => {
          this.resumeUrl = resumeUrl.url;
          const fileName = resumeUrl.fileName || resumeUrl.key.split('/').pop();
          const headers = new HttpHeaders({
            'Content-Type': file.type,
            'X-Filename': fileName
          });
          return this.http.put(`${this.resumeUrl}`, file, { headers }).pipe(
            map(() => fileName)
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
      resumeUpload$ = this.getUploadUrl('resumes', data.cv, undefined, id, false).pipe(
        switchMap((resumeUrl: any) => {
          this.resumeUrl = resumeUrl.url;
          const file = data.cv;
          const fileName = resumeUrl.fileName || resumeUrl.key.split('/').pop();
          const headers = new HttpHeaders({
            'Content-Type': file.type,
            'X-Filename': fileName
          });
          return this.http.put(`${this.resumeUrl}`, file, { headers }).pipe(
            map(() => fileName)
          );
        })
      );
    }
    else if (data.resume_url) {
      resumeUpload$ = of(data.resume_url);
    }
    if(data.profile_pic instanceof File) {
      photoUpload$ = data.profile_pic
        ? this.getUploadUrl('photos', data.profile_pic, data.email, id, true).pipe(
            switchMap((photoUrl: any) => {
              this.photoUrl = photoUrl.url;
              const imgFile = data.profile_pic;
              const fileName = photoUrl.fileName || photoUrl.key.split('/').pop();
              const headers = new HttpHeaders({
                'Content-Type': imgFile.type,
                'X-Filename': fileName
              });
              return this.http.put(`${this.photoUrl}`, imgFile, { headers }).pipe(
                map(() => fileName)
              );
            })
          )
        : of(null);
    }
    else {
      // If profile_pic is a string URL (not a File), forward it. Fall back to profile_pic_url if present.
      photoUpload$ = of(data.profile_pic || data.profile_pic_url || null);
    }

    return forkJoin([resumeUpload$, photoUpload$]).pipe(
      switchMap(([fileName, profilePic]) => {
        const body = {
          ...data,
          file_name: fileName,
          profile_pic: profilePic,
          phone: null,
          company_id: data.company_id == -1 ? null : data.company_id,
          work_experience_summary: data.work_experience_summary || null
        };

        if (id) return this.http.put<any>(`${this.API_URI}/applications/${id}`, body);
        return this.http.post<any>(`${this.API_URI}/applications`, body);
      })
    );
  }

  updateAvailability(payload: { user_id?: number, application_id?: number, availability: boolean }) {
    return this.http.patch(
      `${this.API_URI}/applications/availability`,
      payload
    );
  }

  // Notify other components that an application was updated
  notifyApplicationUpdated(application: any) {
    this.applicationsUpdatedSource.next(application);
  }

  approveApplicationUpdates(id: number): Observable<any> {
    return this.http.put(`${this.API_URI}/applications/${id}/approve`, {});
  }

  rejectApplicationUpdates(id: number): Observable<any> {
    return this.http.put(`${this.API_URI}/applications/${id}/reject`, {});
  }

  uploadIntroductionVideo(videoFile: File, userId: number): Observable<any> {
    return this.getVideoUploadUrl(videoFile, userId).pipe(
      switchMap((uploadData: any) => {
        const fileName = uploadData.fileName || uploadData.key.split('/').pop();
        const headers = new HttpHeaders({
          'Content-Type': videoFile.type,
          'X-Filename': fileName
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
              fileName: fileName
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

  private async checkUrlExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.status === 200 || response.status != 403;
    } catch (error) {
      return false;
    }
  }

  async getResumeUrl(
    filename: string | null | undefined,
    applicationId?: number,
  ): Promise<string> {
    if (!filename && !applicationId) return '';

    if (filename?.startsWith('http')) {
      const urlExists = await this.checkUrlExists(filename);
      if (urlExists) return filename;
      filename = filename.split('/').pop();
    }

    const baseUrl = !environment.production
      ? `${environment.socket}/uploads/resumes`
      : 'https://inimble-app.s3.us-east-1.amazonaws.com/resumes';

    const candidates: string[] = [];
    if (filename) candidates.push(filename);
    if (applicationId) {
      ['pdf', 'doc', 'docx'].forEach((ext) => {
        candidates.push(`app-${applicationId}.${ext}`);
      });
    }

    for (const candidate of candidates) {
      const url = `${baseUrl}/${candidate}`;
      const urlExists = await this.checkUrlExists(url);
      if (urlExists) return url;
    }

    return '';
  }
}
