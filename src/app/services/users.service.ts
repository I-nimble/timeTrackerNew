import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { PossibleMember } from '../models/Client';
import { BehaviorSubject, catchError, Observable, of, switchMap, Subject, map, forkJoin } from 'rxjs';
import { RocketChatService } from './rocket-chat.service';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private http: HttpClient, private chatService: RocketChatService) { }
  selectedUser: any = { id: null, name: '' };
  private teamMemberSource = new BehaviorSubject<number | null>(null);
  teamMember$ = this.teamMemberSource.asObservable();
  private API_URI = environment.apiUrl;
  private profilePicUpdatedSource = new Subject<void>();
  profilePicUpdated$ = this.profilePicUpdatedSource.asObservable();
  private usernameSource = new BehaviorSubject<string>(localStorage.getItem('username') || '');
  username$ = this.usernameSource.asObservable();

  public updateUsername(name: string) {
    localStorage.setItem('username', name);
    this.usernameSource.next(name);
  }

  public updatePassword(passwordData: any) {
    return this.http.put(`${this.API_URI}/users/password`, passwordData);
  }

  public getProfilePic(id?: number): Observable<string | null> {
    const headers = new HttpHeaders({ Accept: 'image/jpeg' });
    const options = { headers: headers, responseType: 'blob' as 'json' };
    return this.http.post<Blob>(`${this.API_URI}/users/profile`, { id }, options).pipe(
      switchMap((response: Blob) => {
        if (!response || !(response instanceof Blob)) {
          return of(null);
        }
        if (response.type === 'application/json') {
          return new Observable<null>((observer) => {
            const reader = new FileReader();
            reader.onload = () => {
              const responseText = reader.result as string;
              if (responseText.includes('Profile pic does not exist')) {
                console.warn('No profile picture available');
              }
              observer.next(null); 
              observer.complete(); 
            };
            reader.onerror = (error) => {
              observer.error(error); 
            };
            reader.readAsText(response); 
          });
        }

        if (response.type.startsWith('image/')) {
          const url = URL.createObjectURL(response);
          return of(url);
        } else {
          console.warn('Unexpected response type:', response.type);
          return of(null);
        }
      }),
      catchError((error) => {
        console.error('Error fetching profile picture:', error);
        return of(null);
      })
    );
  }

  public getUsername(): Observable<string | null> {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      return of(storedUsername);
    } else {
      return this.getUsers({ searchField: "", filter: { currentUser: true } }).pipe(
        switchMap((users) => {
          if (users && users.length > 0) {
            const userName = users[0].name + ' ' + users[0].last_name;
            localStorage.setItem('username', userName);
            return of(userName);
          } else {
            return of(null);
          }
        }),
        catchError((err) => {
          console.error('Error getting user name:', err);
          return of(null);
        })
      );
    }
  }

  getUsers(body: any) {
    const headers = new HttpHeaders({ 'content-type': 'application/json' });
    return this.http.post<any>(`${this.API_URI}/users`, body, { headers });
  }

  createUser(userData: any) {
    let form = new FormData();
    if (userData.id) form.append('id', userData.id);
    if (userData.name) form.append('name', userData.name);
    if (userData.last_name) form.append('last_name', userData.last_name);
    if (userData.password) form.append('password', userData.password);
    if (userData.active) form.append('active', userData.active);
    if (userData.email) form.append('email', userData.email);
    if (userData.phone) form.append('phone', userData.phone);
    if (userData.employee) form.append('employee', JSON.stringify(userData.employee));
    if (userData.role) form.append('role', userData.role);
    if (userData.company) form.append('company', JSON.stringify(userData.company));
    if (userData.profile) form.append('profile', userData.profile);
    return this.http.post(`${this.API_URI}/users/create`, form);
  }

  public updateProfile(userData: any) {
    let form = new FormData();
    if (userData.name) form.append('name', userData.name);
    if (userData.last_name) form.append('last_name', userData.last_name);
    if (userData.password) form.append('password', userData.password);
    if (userData.phone) form.append('phone', userData.phone);
    if (userData.address) form.append('address', userData.address);
    if (userData.employee) {
      form.append('employee', JSON.stringify(userData.employee))
      if (userData.employee.emergency_contact) form.append('emergency_contact', JSON.stringify(userData.employee.emergency_contact));
      if (userData.employee.social_media) form.append('social_media', JSON.stringify(userData.employee.social_media));
      if (userData.employee.insurance_data) form.append('insurance_data', JSON.stringify(userData.employee.insurance_data));
    };
    if (userData.company) form.append('company', JSON.stringify(userData.company));
    if (userData.profile instanceof File) {
      form.append('profile', userData.profile);
    } else if (userData.profile === null) {
      form.append('remove_picture', 'true');
    }
    if (userData.availability) form.append('availability', userData.availability);

    return this.http.patch(`${this.API_URI}/users`, form, {
      headers: this.chatService.getAuthHeaders(false),
    }).pipe(
      map((result) => {
        if (userData.profile || userData.profile === null) {
          this.profilePicUpdatedSource.next();
        }
        return result;
      })
    );
  }
  public delete(id: string | number) {
    return this.http.delete(`${this.API_URI}/users/${id}`);
  }

  public verifyUsername(email: any, userId: string) {
    const body = {
      email,
      userId,
    };
    return this.http.post(`${this.API_URI}/users/verifyusername`, body);
  }
  
  getRoles() {
    return this.http.get(`${this.API_URI}/roles`);
  }
  getPosition(id: number) {
    return this.http.get(`${this.API_URI}/positions/${id}`);
  }

  createPossible(body: PossibleMember) {
    let form = new FormData();
    form.append('name', body.name);
    form.append('email', body.email);
    form.append('phone', body.phone);
    form.append('englishLevel', body.englishLevel);
    form.append('resume', body.resume);
    return this.http.post(`${this.API_URI}/users/create/possible`, form);
  }
  setUserInformation(user: any) {
    this.selectedUser = user;
  }
  getSelectedUser() {
    return this.selectedUser;
  }
  resetUser() {
    this.selectedUser = { id: null, name: null };
  }

  registerInvitedTM(userData: any) {
    let form = new FormData();
    if (userData.firstName) form.append('firstName', userData.firstName);
    if (userData.lastName) form.append('lastName', userData.lastName);
    if (userData.password) form.append('password', userData.password);
    if (userData.email) form.append('email', userData.email);
    if (userData.token) form.append('token', userData.token);
    if (userData.positionId) form.append('positionId', userData.positionId);
    return this.http.post(`${this.API_URI}/users/register/invited`, userData);
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

  getIntroductionVideo(email: string) {
    return this.http.post<{ videoURL: string }>(`${this.API_URI}/generate_upload_url/video/introduction/download`, { email });
  }
  
  uploadIntroductionVideo(file: File, email: string, applicationId?: number) {
    return this.http.post(`${this.API_URI}/generate_upload_url/video/introduction`, {
      email: email,
      applicationId: applicationId,
      contentType: file.type
    }).pipe(
      switchMap((res: any) => {
        const headers = new HttpHeaders({ 
          'Content-Type': file.type,
          'X-Filename': res.fileName || res.key.split('/').pop()
        });
        return this.http.put(res.url, file, { headers }).pipe(
          switchMap(() => {
            return this.getIntroductionVideo(email);
          })
        );
      })
    );
  }

  public submitApplicationDetails(data: any, applicationId: number) {
    let resumeUpload$ = of(null);
    let pictureUpload$ = of(null);
    let introVideoUpload$ = of(null);
    let portfolioUpload$ = of(null);

    const form = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        form.append(key, data[key]);
      }
    });

    if (data.resume instanceof File) {
      resumeUpload$ = this.getUploadUrl('resumes', data.resume, data.email, applicationId, false).pipe(
        switchMap((res: any) => {
          const file = data.resume;
          const fileName = res.fileName || res.key.split('/').pop();
          const headers = new HttpHeaders({ 
            'Content-Type': file.type,
            'X-Filename': fileName
          });
          return this.http.put(res.url, file, { headers }).pipe(
            map(() => {
              return fileName;
            })
          );
        })
      );
    }

    if (data.picture instanceof File) {
      pictureUpload$ = this.getUploadUrl('photos', data.picture, data.email, applicationId, true).pipe(
        switchMap((res: any) => {
          const imgFile = data.picture;
          const fileName = res.fileName || res.key.split('/').pop();
          const headers = new HttpHeaders({ 
            'Content-Type': imgFile.type,
            'X-Filename': fileName
          });
          return this.http.put(res.url, imgFile, { headers }).pipe(
            map(() => {
              return fileName;
            })
          );
        })
      );
    }

    if (data.introduction_video instanceof File) {
      introVideoUpload$ = this.getUploadUrl('applications', data.introduction_video, data.email, applicationId, false).pipe(
        switchMap((res: any) => {
          const videoFile = data.introduction_video;
          const fileName = res.fileName || res.key.split('/').pop();
          const headers = new HttpHeaders({ 
            'Content-Type': videoFile.type,
            'X-Filename': fileName
          });
          return this.http.put(res.url, videoFile, { headers }).pipe(
            map(() => {
              return fileName;
            })
          );
        })
      );
    }

    if (data.portfolio instanceof File) {
      portfolioUpload$ = this.getUploadUrl('applications', data.portfolio, data.email, applicationId, false).pipe(
        switchMap((res: any) => {
          const portfolioFile = data.portfolio;
          const fileName = res.fileName || res.key.split('/').pop();
          const headers = new HttpHeaders({ 
            'Content-Type': portfolioFile.type,
            'X-Filename': fileName
          });
          return this.http.put(res.url, portfolioFile, { headers }).pipe(
            map(() => {
              return fileName;
            })
          );
        })
      );
    }

    return forkJoin([resumeUpload$, pictureUpload$, introVideoUpload$, portfolioUpload$]).pipe(
      switchMap(([resumeFileName, pictureFileName, introVideoFileName, portfolioFileName]) => {
        if (resumeFileName) form.append('file_name', resumeFileName);
        if (pictureFileName) form.append('profile_pic', pictureFileName);
        if (introVideoFileName) form.append('introduction_video_file_name', introVideoFileName);
        if (portfolioFileName) form.append('portfolio_file_name', portfolioFileName);
        
        const updateData = { ...data };
        if (resumeFileName) updateData.file_name = resumeFileName;
        if (pictureFileName) updateData.profile_pic = pictureFileName;
        if (introVideoFileName) updateData.introduction_video = introVideoFileName;
        if (portfolioFileName) updateData.portfolio = portfolioFileName;
        
        return this.http.put(`${this.API_URI}/applications/${applicationId}`, updateData);
      })
    );
  }

  public registerOrphanTeamMember(data: any) {
    return this.http.post(`${this.API_URI}/users/register/orphan`, data);
  }

  checkEmailExists(email: string): Observable<{ exists: boolean }> {
    return this.http.post<{ exists: boolean }>(`${this.API_URI}/users/check-email`, { email });
  }

  setTeamMember(userId: number) {
    this.teamMemberSource.next(userId);
  }

  getCurrentTeamMember(): number | null {
    return this.teamMemberSource.getValue();
  }

  requestMatch(userId: number): Observable<any> {
    return this.http.post(`${this.API_URI}/users/request-match/${userId}`, {});
  }

  checkIntroductionVideo(email: string) {
    return this.http.post<{ hasVideo: boolean }>(`${this.API_URI}/users/check-video`, { email });
  }

  checkMatchStatus(userId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.API_URI}/users/match-status/${userId}`);
  }
}
