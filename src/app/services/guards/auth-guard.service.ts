import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { Observable } from 'rxjs';
import { AuthService } from "../auth.service";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard{
  loggedIn!: boolean
  isAdmin!: boolean

  constructor(private authService: AuthService, private router: Router) { }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    this.authService.isLoggedIn().subscribe(isLogged =>{
      this.loggedIn = isLogged
    })
    // this.authService.verifyAdmin().subscribe(isAdmin => {
    //   this.isAdmin = isAdmin
    // })

    if(this.loggedIn == true){
      return true;
    }else{
      this.router.navigate(['login'])
      return false
    }
  }


}

