import { Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { ClientAccessService } from '../client-access.service';

const ALLOWED_RESTRICTED_PATHS = ['/apps/talent-match', '/apps/account-settings', '/dashboards/notifications'];

@Injectable({
  providedIn: 'root',
})
export class ClientNoTMGuard implements CanActivate {
  private readonly clientAccessService = inject(ClientAccessService);
  private readonly router = inject(Router);

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const role = localStorage.getItem('role');
    if (role !== '3') {
      return true;
    }
    if (this.clientAccessService.hasAccess()) {
      return true;
    }
    const urlPath = state.url.split('?')[0];
    if (ALLOWED_RESTRICTED_PATHS.includes(urlPath)) {
      return true;
    }
    return this.router.createUrlTree(['/apps/talent-match']);
  }
}