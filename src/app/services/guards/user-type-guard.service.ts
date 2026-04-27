import { Injectable } from '@angular/core';
import {
  Route,
  CanActivateFn,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
} from '@angular/router';

import { Observable } from 'rxjs';

import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserTypeGuardService {
  isLogged = false;

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}
  canActivate(
    route: ActivatedRouteSnapshot,
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    this.authService.isLoggedIn().subscribe((next) => {
      this.isLogged = next;
    });
    if (!this.isLogged) return this.router.parseUrl('/login');

    const userType = localStorage.getItem('role');
    if (this.checkUserType(route.data['allowedUserTypes'], userType!)) {
      return true;
    }
    return this.router.parseUrl('/');
  }

  private checkUserType(allowedUserTypes: string[], userType: string): boolean {
    return allowedUserTypes.includes(userType);
  }
}
