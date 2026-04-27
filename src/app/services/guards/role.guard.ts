import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { switchMap, map, take } from 'rxjs/operators';

import { AuthService } from '../auth.service';
import { RoleService } from '../role.service';

/**
 * Authorization guard — use alongside AuthGuard in canActivate arrays.
 * Reads `data.allowedRoles` from the route and checks the current user's
 * role slug (resolved from the DB via RoleService) against that list.
 *
 * Usage in route config:
 *   canActivate: [AuthGuard, roleGuard],
 *   data: { allowedRoles: [ROLES.ADMIN, ROLES.SUPPORT] }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const roleService = inject(RoleService);
  const router = inject(Router);

  const allowedRoles: string[] = route.data['allowedRoles'] ?? [];
  if (allowedRoles.length === 0) return true;

  return authService.getUserType().pipe(
    take(1),
    switchMap((roleId) => roleService.getSlugById(roleId)),
    map((slug) => {
      if (slug && allowedRoles.includes(slug)) {
        return true;
      }
      return router.createUrlTree(['/authentication/error']);
    }),
  );
};
