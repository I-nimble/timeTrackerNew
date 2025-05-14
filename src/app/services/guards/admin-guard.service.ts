import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from "@angular/router";
import { Observable } from "rxjs";
import { AuthService } from "../auth.service";

@Injectable({
  providedIn: 'root'
})
export class AdminGuard {
  isAdmin: boolean = false
  isLogged!: boolean
  constructor(private router: Router, private authservice: AuthService) { }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    this.authservice.verifyAdmin().subscribe(isAdmin =>{
      this.isAdmin = isAdmin
    })
    this.authservice.isLoggedIn().subscribe(isLogged => {
      this.isLogged = isLogged
    })

    if(this.isAdmin){
      return true;
    }else{
      this.router.navigateByUrl('/dashboard')
      return false
    }
  }
}
