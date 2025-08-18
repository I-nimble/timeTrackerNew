import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { PossibleMember } from '../models/Client';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BehaviorSubject, catchError, Observable, of, switchMap, Subject, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private http: HttpClient, private sanitizer: DomSanitizer) { }
  selectedUser: any = { id: null, name: '' };
  private teamMemberSource = new BehaviorSubject<number | null>(null);
  teamMember$ = this.teamMemberSource.asObservable();
  private API_URI = environment.apiUrl;
  private profilePicUpdatedSource = new Subject<void>();
  profilePicUpdated$ = this.profilePicUpdatedSource.asObservable();

  public updatePassword(passwordData: any) {
    return this.http.put(`${this.API_URI}/users/password`, passwordData);
  }

  public getProfilePic(id?: number): Observable<SafeResourceUrl | null> {
    const headers = new HttpHeaders({ Accept: 'image/jpeg' });
    const options = { headers: headers, responseType: 'blob' as 'json' };
  
    return this.http.post<Blob>(`${this.API_URI}/users/profile`, { id }, options).pipe(
      switchMap((response: Blob) => {
        if (response.type === 'application/json') {
          return new Observable<null>((observer) => {
            const reader = new FileReader();
            reader.onload = () => {
              const responseText = reader.result as string;
              if (responseText.includes('Profile pic does not exists')) {
                console.warn('No profile picture available: ', responseText);
                observer.next(null);  
              }
              observer.complete(); 
            };
            reader.onerror = (error) => {
              observer.error(error); 
            };
            reader.readAsText(response); 
          });
        }

        const url = URL.createObjectURL(response);
        const safeUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        return of(safeUrl); 
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

    return this.http.patch(`${this.API_URI}/users`, form).pipe(
      map((result) => {
        if (userData.profile) {
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

  checkEmailExists(email: string): Observable<{ exists: boolean }> {
    return this.http.post<{ exists: boolean }>(`${this.API_URI}/users/check-email`, { email });
  }

  setTeamMember(userId: number) {
    this.teamMemberSource.next(userId);
  }

  getCurrentTeamMember(): number | null {
    return this.teamMemberSource.getValue();
  }
}
