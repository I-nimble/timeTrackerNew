import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ErrorHandlerService } from '../services/error-handler.service';

export const ErrorInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  // S3 pre-signed URLs are consumed directly by feature code; skip global handling.
  if (request.url.includes('amazonaws.com')) {
    return next(request);
  }

  const errorHandler = inject(ErrorHandlerService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        errorHandler.handle(errorHandler.fromHttp(error, request.url));
      }
      return throwError(() => error);
    }),
  );
};
