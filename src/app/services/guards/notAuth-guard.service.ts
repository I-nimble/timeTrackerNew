import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { Observable, map, take } from 'rxjs';
import { AuthService } from "../auth.service";

@Injectable({
  providedIn: 'root'
})
export class notAuthGuard {
  
  constructor(private authService: AuthService, private router: Router) { }
  
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    if (state.url.includes('/authentication/reset')) {
      return new Observable(subscriber => {
        subscriber.next(true);
        subscriber.complete();
      });
    }
    
    return this.authService.isLoggedIn().pipe(
      take(1),
      map(isLogged => {
        if (!isLogged) {
          return true;
        }
      
        const role = localStorage.getItem('role');
        
        if (role === '2') {
          return this.router.createUrlTree(['/dashboards/tm']);
        } else if (role === '1' || role === '4') {
          return this.router.createUrlTree(['/dashboards/admin']);
        } else if (role === '3') {
          return this.router.createUrlTree(['/dashboards/dashboard2']);
        }
        
        return true;
      })
    );
  }
}