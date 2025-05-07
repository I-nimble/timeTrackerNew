import { Injectable } from '@angular/core';
import { AuthService } from "../auth.service";
import { UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChildFn, Router } from "@angular/router";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class NotAdmin {
  private isAdmin!: boolean
  constructor(public authService: AuthService, public router: Router) { }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    this.authService.verifyAdmin().subscribe(isAdmin =>{
      this.isAdmin = isAdmin
    })
    if(this.isAdmin){
      this.router.navigate(['admin/dashboard'])
      return false
    }else{
      return true
    }
  }
}
