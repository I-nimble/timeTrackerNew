import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { Observable } from 'rxjs';
import { AuthService } from "../auth.service";

@Injectable({
  providedIn: 'root'
})
export class notAuthGuard {
  loggedIn: boolean= true
  isAdmin!: boolean

    constructor(private authService: AuthService, private router: Router) { }
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
      this.authService.isLoggedIn().subscribe(isLogged =>{
        this.loggedIn = isLogged
      })
      this.authService.verifyAdmin().subscribe(isAdmin =>{
        this.isAdmin = isAdmin
      })
      if(localStorage.getItem('role') !== null && this.loggedIn == true && localStorage.getItem('role') === '2'){
        this.router.navigate(['dashboard'])
        return false;
      }else if(localStorage.getItem('role') !== null && this.loggedIn == true && localStorage.getItem('role') === '1'){
        this.router.navigate(['admin'])
        return false
      }else if(localStorage.getItem('role') !== null && this.loggedIn == true && localStorage.getItem('role') === '3'){
        this.router.navigate(['client'])
        return false
      }else{
        return true
      }
    }
}
