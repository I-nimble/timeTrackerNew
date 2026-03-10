import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { inject } from '@angular/core';
import { FingerprintService } from '../services/fingerprint.service';
import { environment } from 'src/environments/environment';

export const FingerprintInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  if (!request.url.startsWith(environment.apiUrl + '/public')) {
    return next(request);
  }
  const fingerprintService = inject(FingerprintService);
  return from(fingerprintService.getFingerprint()).pipe(
    switchMap((fingerprint) => {
      const modifiedRequest = request.clone({
        setHeaders: {
          'X-Client-Fingerprint': fingerprint
        }
      });
      return next(modifiedRequest);
    })
  );
};