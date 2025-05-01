import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SharedModule } from '../shared.module';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { Plan } from 'src/app/models/Plan.model';
import { PlansService } from 'src/app/services/plans.service';
import { CompaniesService } from 'src/app/services/companies.service';
import { environment } from 'src/environments/environment';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'employees-position-popup',
  templateUrl: 'employees-position-popup.component.html',
  standalone: true,
  imports: [MatDialogModule, CommonModule, SharedModule, RouterLink],
  styleUrls: ['./employees-position-popup.component.scss'],
})
export class employeesPositionPopup implements OnInit {
  pageWP: string = environment.baseWP + '/register/client';
  private routerSubscription?: Subscription;
  userType: any;
  plan?: Plan;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, 
    private dialog: MatDialog,
    private router: Router,
    private authService: AuthService,
    private plansService: PlansService,
    private companiesService: CompaniesService,
  ) {}

  ngOnInit(): void {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.closePopup();
      }
    });  

    this.authService.getUserType().subscribe((role) => {
      this.userType = role;
      if(this.userType == '3') {
        this.companiesService.getByOwner().subscribe((company: any) => {
          const companyId = company.company.id;
          if(companyId) {
            this.plansService.getCurrentPlan(companyId).subscribe((companyPlan: any) => {
              this.plan = companyPlan.plan;
            });
          }
        });
      }
    });

  }

  closePopup(): void {
    this.dialog.closeAll();
  }
}
