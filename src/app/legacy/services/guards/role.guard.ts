import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { switchMap, map, take } from 'rxjs/operators';

import { AuthService } from '../../../shared/services/auth.service';
import { RoleService } from '../../../shared/services/role.service';

/**
 * Authorization guard — use alongside AuthGuard in canActivate arrays.
 * Reads `data.allowedRoles` from the route and checks the current user's
 * role slug (resolved from the DB via RoleService) against that list.
 *
 * Usage in route config:
 *   canActivate: [AuthGuard, roleGuard],
 *   data: { allowedRoles: [ROLES.ADMIN, ROLES.SUPPORT] }  // specific roles
 *   data: { allowedRoles: '*' }                            // any DB role
 *   (omit allowedRoles entirely to skip role check)
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const roleService = inject(RoleService);
  const router = inject(Router);

  const allowedRoles: string[] | '*' = route.data['allowedRoles'] ?? [];
  if (allowedRoles !== '*' && allowedRoles.length === 0) return true;

  return authService.getUserType().pipe(
    take(1),
    switchMap((roleId) => roleService.getSlugById(roleId)),
    map((slug) => {
      const allowed =
        slug !== null && (allowedRoles === '*' || allowedRoles.includes(slug));
      return allowed || router.createUrlTree(['/authentication/error']);
    }),
  );
};
