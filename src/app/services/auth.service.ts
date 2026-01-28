import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom, lastValueFrom } from 'rxjs';
import { NotificationStore } from 'src/app/stores/notification.store';
import { environment } from 'src/environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router, NavigationEnd } from '@angular/router';
import { NotificationsService } from './notifications.service';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { Auth, authState, AuthProvider, signInWithPopup, GoogleAuthProvider, user } from '@angular/fire/auth';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { from } from 'rxjs';
import { EmployeesService } from 'src/app/services/employees.service';
import { RoleTourService } from './role-tour.service';
import { filter, take } from 'rxjs/operators';

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
    private employeesService: EmployeesService,
    private roleTourService: RoleTourService
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
    try { this.roleTourService.skipActiveTour(); } catch (e) {}
    localStorage.clear();
    this.isLogged.next(false);
    this.notificationStore.removeAll();
    this.notificationsService.clearNotifications();
    
    if (redirect) {
      this.routes.navigate(['/authentication/login']);
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
  async userTypeRouting(rol: string) {
    if (rol == '1') {
      await this.navigateAndMaybeStart('/dashboards/dashboard2', rol);
      return;
    } else if (rol == '2') {
      await this.navigateAndMaybeStart('/dashboards/dashboard2', rol);
      return;
    } else if (rol == '3') {
      const hasTeam = await this.hasTeamMembers();
      localStorage.setItem('clientHasTeam', hasTeam ? 'true' : 'false');
      if(hasTeam){
        await this.navigateAndMaybeStart('/dashboards/dashboard2', rol);
      }else{
        await this.navigateAndMaybeStart('/apps/talent-match', rol);
      }
      return;
    }
  }

  private async navigateAndMaybeStart(path: string, role: string) {
    console.log('navigateAndMaybeStart', { path, role });
    try {
      await this.routes.navigateByUrl(path);
      // await firstValueFrom(
      //   this.routes.events.pipe(
      //     filter((e) => e instanceof NavigationEnd),
      //     filter((e) => (e as NavigationEnd).urlAfterRedirects.split('?')[0] === path),
      //     take(1)
      //   )
      // ).catch(() => undefined);
      console.log('navigateAndMaybeStart success', { path, role });
    } finally {
      console.log('navigateAndMaybeStart finally', { path, role });
      await this.waitForJwt();
      console.log('starting tour after navigation', { path, role });
      void this.roleTourService.maybeStartForCurrentUser(false, role, path);
    }
  }

  private async waitForJwt(timeoutMs = 2000): Promise<void> {
    const start = Date.now();
    while (!localStorage.getItem('jwt')) {
      if (Date.now() - start > timeoutMs) return;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  async hasTeamMembers(): Promise<boolean> {
    try {
      const employees = await lastValueFrom(this.employeesService.get());
      return employees && employees.length > 0;
    } catch (err) {
      return false;
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