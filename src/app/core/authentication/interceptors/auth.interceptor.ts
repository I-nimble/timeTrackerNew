import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';

import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const normalizeUrl = (value: string): string => value.replace(/\/+$/, '');

const isApiRequest = (requestUrl: string, apiUrl: string): boolean => {
  const normalizedApiUrl = normalizeUrl(apiUrl);
  return normalizeUrl(requestUrl).startsWith(normalizedApiUrl);
};

const readToken = (): string | null => {
  try {
    return localStorage.getItem('jwt');
  } catch {
    return null;
  }
};

export const AuthInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  if (request.url.includes('amazonaws.com')) {
    return next(request);
  }

  if (!isApiRequest(request.url, environment.apiUrl)) {
    return next(request);
  }

  const token = readToken();
  if (!token) {
    return next(request);
  }

  const authorized = request.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(authorized);
};
