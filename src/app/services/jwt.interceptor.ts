import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password'
];

export const JwtInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

  // Skip adding Authorization header for S3 pre-signed URLs
  if (request.url.includes('amazonaws.com')) {
    return next(request);
  }

  // Check if the request is for a public route
  const isPublicRoute = PUBLIC_ROUTES.some(route => request.url.includes(route));
  if (isPublicRoute) {
    return next(request);
  }

  // Only intercept requests to our API
  if (request.url.startsWith(environment.apiUrl)) {
    const jwt = localStorage.getItem('jwt');

    if (jwt) {
      const modifiedRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${jwt}`
        }
      });
      return next(modifiedRequest);
    }
  }

  return next(request);
};


