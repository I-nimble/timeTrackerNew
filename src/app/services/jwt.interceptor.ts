import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class JwtInterceptor implements HttpInterceptor {

  constructor(private jwtHelper: JwtHelperService, private authService: AuthService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>{
    // if(!this.jwtHelper.isTokenExpired()){
      // Skip adding Authorization header for S3 pre-signed URLs
      if (request.url.includes('amazonaws.com')) {
        return next.handle(request);
      }

      const jwt = localStorage.getItem('jwt');
      if(jwt){
        request = request.clone({
          setHeaders: {
            Authorization: `bearer ${jwt}`
          }
        })
    //   }else{
    //     console.log('token expired')
    //     return this.authService.refreshToken().pipe(
    //       switchMap((response: any)=>{
    //         const newToken = response.access_token

    //         this.authService.setAccessToken(newToken)
    //         request = request.clone({
    //           setHeaders: {
    //             Authorization: `bearer ${newToken}`
    //           }
    //         })
    //         return next.handle(request)
    //       }),
    //       catchError((error: any)=>{
    //         return throwError(error)
    //       })
    //     )
    //   }
    }
    return next.handle(request);
  }


}


