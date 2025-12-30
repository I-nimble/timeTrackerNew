import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EmployeesService } from '../employees.service';

@Injectable({
  providedIn: 'root'
})
export class ClientNoTMGuard implements CanActivate {
  constructor(
    private employeesService: EmployeesService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    const role = localStorage.getItem('role');
    if (role !== '3') {
      return of(true);
    }
    return this.employeesService.get().pipe(
      map((employees) => {
        if (!employees || employees.length === 0) {
          return this.router.createUrlTree(['/apps/talent-match']);
        }
        return true;
      }),
      catchError(() => {
        return of(this.router.createUrlTree(['/apps/talent-match']));
      })
    );
  }
}