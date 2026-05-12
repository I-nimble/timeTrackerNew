import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { Router, NavigationEnd } from '@angular/router';
import { RouterLink } from '@angular/router';

import { AuthService } from '@app/shared/services/auth.service';
import { Subscription } from 'rxjs';
import { Plan } from 'src/app/legacy/models/Plan.model';
import { CompaniesService } from 'src/app/legacy/services/companies.service';
import { PlansService } from 'src/app/legacy/services/plans.service';
import { environment } from 'src/environments/environment';

import { SharedModule } from '../shared.module';

@Component({
  selector: 'app-employees-position-popup',
  templateUrl: 'employees-position-popup.component.html',
  standalone: true,
  imports: [MatDialogModule, CommonModule, SharedModule, RouterLink],
  styleUrls: ['./employees-position-popup.component.scss'],
})
export class employeesPositionPopup implements OnInit {
  pageWP: string = environment.baseWP + '/register/client';
  public data = Inject(MAT_DIALOG_DATA);
  private dialog = Inject(MatDialog);
  private router = Inject(Router);
  private authService = Inject(AuthService);
  private plansService = Inject(PlansService);
  private companiesService = Inject(CompaniesService);
  routerSubscription!: Subscription;
  userType: any;
  plan?: Plan;

  ngOnInit(): void {
    this.routerSubscription = this.router.events.subscribe((event: unknown) => {
      if (event instanceof NavigationEnd) {
        this.closePopup();
      }
    });

    this.authService.getUserType().subscribe((role: unknown) => {
      this.userType = role;
      if (this.userType == '3') {
        this.companiesService.getByOwner().subscribe((company: any) => {
          if (company) {
            const companyId = company?.company?.id ?? company?.id ?? null;
            if (companyId !== null) {
              this.plansService
                .getCurrentPlan(companyId)
                .subscribe((companyPlan: any) => {
                  this.plan = companyPlan.plan;
                });
            }
          }
        });
      }
    });
  }

  closePopup(): void {
    this.dialog.closeAll();
  }
}
