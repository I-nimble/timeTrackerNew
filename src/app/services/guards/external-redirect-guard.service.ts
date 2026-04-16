import { CanActivateFn } from '@angular/router';

export const externalRedirectGuard: CanActivateFn = (route) => {
  window.location.href = 'https://i-nimble.com/';
  return false;
};
