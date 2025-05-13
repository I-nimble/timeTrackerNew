import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationStore } from 'src/app/stores/notification.store';
import { environment } from 'src/environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';
import { NotificationsService } from './notifications.service';
// import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
// import { provideAuth, getAuth } from '@angular/fire/auth';
//import { Auth, authState, AuthProvider, signInWithPopup, GoogleAuthProvider } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  notificationStore = inject(NotificationStore);
  // private auth = inject(Auth);
  //readonly authState$ = authState(this.auth);
  private isLogged = new BehaviorSubject<boolean>(false);
  private isAdmin = new BehaviorSubject<boolean>(false);
  private role = new BehaviorSubject<string>(localStorage.getItem('role') || 'default');
  userType$ = this.role.asObservable();
  liveChatBubble?: any;
  constructor(
    private http: HttpClient,
    private jwtHelper: JwtHelperService,
    private routes: Router,
    private notificationsService: NotificationsService
  ) {}
  API_URI = environment.apiUrl + '/auth';

  login(email: string, password: string): Observable<any> {
    const headers = new HttpHeaders({ 'content-type': 'application/json' });
    const body = JSON.stringify({ email, password });
    return this.http.post<any>(`${this.API_URI}/signin`, body, { headers });
  }
  signup(newUser: any): Observable<any> {
    const headers = new HttpHeaders({ 'content-type': 'application/json' });
    return this.http.post<any>(`${this.API_URI}/signup`, newUser, { headers });
  }
  logout() {
    localStorage.clear();
    this.isLogged.next(false);
    this.notificationStore.removeAll();
    this.notificationsService.clearNotifications();
    this.updateLiveChatBubbleVisibility('0')
    this.updateTawkVisitorAttributes('Guest', '')
    this.routes.navigate(['/authentication/login']);
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
    if (role !== null && role === '1') {
      this.isAdmin.next(true);
      return this.isAdmin.asObservable();
    } else {
      this.isAdmin.next(false);
      return this.isAdmin.asObservable();
    }
  }
  userTypeRouting(rol: string) {
    if (rol == '1') {
      this.routes.navigate(['admin']);
      return;
    } else if (rol == '2') {
      this.routes.navigate(['dashboard']);
      return;
    } else if (rol == '3') {
      this.routes.navigate(['client']);
      return;
    }
  }

  getLoggedInUser(){
    return this.http.get(`${this.API_URI}/auth/loggedIn`)
  }

  updateLiveChatBubbleVisibility(role: string) {
    if ((window as any).Tawk_API) {
      if (role == '3') {
        (window as any).Tawk_API.showWidget();
      } else {
        (window as any).Tawk_API.hideWidget();
      }
    }
  }

  updateTawkVisitorAttributes(name: string, email: string) {
    (window as any).Tawk_API.setAttributes({
      'name': localStorage.getItem('name') || name,
      'email': localStorage.getItem('email') || email,
    }, function(error:any) {
      console.error(error);
    });
  }

  //signInWithGoogle(): Promise<{ name: string; email: string }> {
  //  const provider = new GoogleAuthProvider();
  //  return signInWithPopup(this.auth, provider).then((result) => {
  //    const user = result.user;
  //    const name = user.displayName || '';
  //    const email = user.email || '';
  //    return { name, email }; 
  //  });
  //}
}