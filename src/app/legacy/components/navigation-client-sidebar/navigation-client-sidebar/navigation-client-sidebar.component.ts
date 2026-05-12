import { BreakpointObserver } from '@angular/cdk/layout';
import { NgClass, NgIf, NgFor } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';

import { AuthService } from '@app/shared/services/auth.service';
import { Plan } from 'src/app/legacy/models/Plan.model';
import { CompaniesService } from 'src/app/legacy/services/companies.service';
import { PlansService } from 'src/app/legacy/services/plans.service';

@Component({
  selector: 'app-client-sidebar',
  standalone: true,
  imports: [NgClass, NgIf, NgFor, RouterLink],
  templateUrl: './navigation-client-sidebar.component.html',
  styleUrls: ['./navigation-client-sidebar.component.scss'],
})
export class ClientSidebarComponent implements OnInit {
  dropdownOpen = false;
  sidebarOpen = false;
  isSidebarItemHovered = false;
  isMobile = false;
  plan?: Plan;
  authService = inject(AuthService);
  plansService = inject(PlansService);
  companiesService = inject(CompaniesService);
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);

  ngOnInit(): void {
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

    this.breakpointObserver
      .observe(['(max-width: 767px)'])
      .subscribe((result) => {
        this.isMobile = result.matches;
        this.sidebarOpen = !this.isMobile;
      });

    // if user clicks outside of sidebar, close sidebar
    document.addEventListener('click', (event) => {
      if (
        !(event.target as Element).closest('.client-sidebar') &&
        this.isMobile &&
        this.sidebarOpen
      ) {
        this.sidebarOpen = false;
      }
    });
  }

  onSidebarItemHover(isHovered: boolean): void {
    this.isSidebarItemHovered = isHovered;
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  isFreePlan(): boolean {
    return this.plan?.name === 'Basic';
  }

  handlePlanNavigation(): void {
    if (this.isFreePlan()) {
      this.router.navigate(['client/plans']);
    } else {
      this.router.navigate(['/client/dashboard']);
    }
  }
}
