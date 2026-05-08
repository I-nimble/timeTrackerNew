import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { environment } from 'src/environments/environment';

// Usage: canActivate: [AuthGuard, featureFlagGuard]
// Route must have data: { featureFlag: 'billingRefactor' }
export const featureFlagGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
) => {
  const router = inject(Router);
  const flagKey = route.data?.['featureFlag'] as
    | keyof typeof environment.featureFlags
    | undefined;

  if (!flagKey) {
    console.warn('[FeatureFlagGuard] No featureFlag key found in route data.');
    return router.createUrlTree(['authentication/error']);
  }

  const isEnabled = environment.featureFlags[flagKey];

  if (isEnabled) {
    return true;
  }

  console.warn(
    `[FeatureFlagGuard] Feature flag "${flagKey}" is disabled. Redirecting.`,
  );
  return router.createUrlTree(['authentication/error']);
};
