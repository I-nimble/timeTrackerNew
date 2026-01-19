import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationStore } from 'src/app/stores/notification.store';
import { environment } from 'src/environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';
import { NotificationsService } from './notifications.service';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { Auth, authState, AuthProvider, signInWithPopup, GoogleAuthProvider, user } from '@angular/fire/auth';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { PushNotificationService } from './push-notification.service';
import { RocketChatService } from './rocket-chat.service';
import { from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  notificationStore = inject(NotificationStore);
  firebaseAuth = inject(Auth);
  user$ = user(this.firebaseAuth);
  
  private isLogged = new BehaviorSubject<boolean>(false);
  private isAdmin = new BehaviorSubject<boolean>(false);
  private role = new BehaviorSubject<string>(localStorage.getItem('role') || 'default');
  userType$ = this.role.asObservable();
  liveChatBubble?: any;
  constructor(
    private http: HttpClient,
    private jwtHelper: JwtHelperService,
    private routes: Router,
    private notificationsService: NotificationsService,
    private pushNotificationService: PushNotificationService,
    private rocketChatService: RocketChatService
  ) {}
  API_URI = environment.apiUrl + '/auth';

  login(email?: string, password?: string, googleId?: string): Observable<any> {
    const headers = new HttpHeaders({ 'content-type': 'application/json' });
    const body = JSON.stringify({ email, password, googleId });
    return this.http.post<any>(`${this.API_URI}/signin`, body, { headers });
  }
  signup(newUser: any): Observable<any> {
    const headers = new HttpHeaders({ 'content-type': 'application/json' });
    return this.http.post<any>(`${this.API_URI}/signup`, newUser, { headers });
  }
  async logout(redirect: boolean = true) {
    try {
      try {
        await this.pushNotificationService.cleanupPush(true);
      } catch (e) {}
      this.pushNotificationService.clearToken();
      try { localStorage.removeItem('rocketChatCredentials'); } catch(e) {}
      try { localStorage.removeItem('pushTokenUserId'); } catch(e) {}
      try { localStorage.removeItem('jwt'); } catch(e) {}
      try { localStorage.removeItem('id'); } catch(e) {}
      try { localStorage.removeItem('role'); } catch(e) {}
      this.isLogged.next(false);
      this.notificationStore.removeAll();
      this.notificationsService.clearNotifications();
      if (typeof this.rocketChatService.logout === 'function') {
        this.rocketChatService.logout();
      } else {
        console.warn('logout method not found on Rocket.ChatService, skipping cleanup.');
      }
      if (redirect) {
        this.routes.navigate(['/authentication/login']);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

 checkTokenExpiration(): void {
    let jwt = localStorage.getItem('jwt');
    const checkToken = () => {
      
        if(jwt && this.jwtHelper.isTokenExpired(jwt)) {
          this.logout();
          this.navigateToLoginIfNotRegister();
        }
       else {
        const remainingTime = this.getTokenRemainingTime();
        if (remainingTime !== null) {
          setTimeout(checkToken, remainingTime);
        }
      }
    }
    checkToken();
  }


  getTokenRemainingTime(): number | null {
    const token = localStorage.getItem('jwt');
    if (!token) {
      return null;
    }
    const expirationDate = this.jwtHelper.getTokenExpirationDate(token);
    if (!expirationDate) {
      return null;
    }
    const now = new Date().getTime();
    const expirationTime = expirationDate.getTime();
    return expirationTime - now;
  }

  navigateToLoginIfNotRegister(): void {
    if (!this.routes.url.includes('/register/')) {
      this.routes.navigate(['/login']);
    }
  }

  isLoggedIn() {
    const jwt = localStorage.getItem('jwt');
    try {
      if (jwt !== null && !this.jwtHelper.isTokenExpired(jwt)) {
        this.isLogged.next(true);
        return this.isLogged.asObservable();
      } else {
        this.isLogged.next(false);
        return this.isLogged.asObservable();
      }
    } catch (error) {
      this.isLogged.next(false);
      return this.isLogged.asObservable();
    }
  }
  setUserType(newUserType: string){
    localStorage.setItem('role', newUserType)
    this.role.next(newUserType)
  }
  getUserType() {
    const role = localStorage.getItem('role')
    if (role !== null) {
      this.role.next(localStorage.getItem('role')!.toString())
      return this.role.asObservable();
    }else{
      this.role.next('default')
      return this.role.asObservable();
    }
  }
  verifyAdmin() {
    const role = localStorage.getItem('role');
    if (role !== null && (role === '1' || role === '4')) {
      this.isAdmin.next(true);
      return this.isAdmin.asObservable();
    } else {
      this.isAdmin.next(false);
      return this.isAdmin.asObservable();
    }
  }
  userTypeRouting(rol: string) {
    if (rol == '1') {
      this.routes.navigate(['dashboards/dashboard2']);
      return;
    } else if (rol == '2') {
      this.routes.navigate(['dashboards/dashboard2']);
      return;
    } else if (rol == '3') {
      this.routes.navigate(['dashboards/dashboard2']);
      return;
    }
  }

  getLoggedInUser(){
    return this.http.get(`${this.API_URI}/auth/loggedIn`)
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.API_URI}/forgot-password`, { email });
  }

  resetPassword(token: string, email: string, newPassword: string): Observable<any> {
    return this.http.post<any>(
      `${this.API_URI}/reset-password`,
      { token, email, newPassword }
    );
  }

  // singUpWithGoogle(): Observable<{ name: string; email: string; picture: string; googleId: string }> {
  //   const provider = new GoogleAuthProvider();
  //   const promise =  signInWithPopup(this.firebaseAuth, provider).then((result) => {
  //     const user = result.user;
  //     const name = user.displayName || '';
  //     const email = user.email || '';
  //     const picture = user.photoURL || '';
  //     const googleId = user.uid;
  //     return { name, email, picture, googleId };
  //   });

  //   return from(promise);
  // }

  // signInWithGoogle(): Observable<{ googleId: string }> {
  //   const promise = signInWithPopup(this.firebaseAuth, new GoogleAuthProvider()).then(response => {
  //     const user = response.user;
  //     const googleId = user.uid;
  //     return { googleId };
  //   });
  //   return from(promise);
  // }

  checkEmailExists(email: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.API_URI}/check-email`, { email });
  }
}