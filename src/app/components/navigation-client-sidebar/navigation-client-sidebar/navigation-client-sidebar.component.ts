import { Component, inject } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { PlansService } from 'src/app/services/plans.service';
import { CompaniesService } from 'src/app/services/companies.service';
import { Plan } from 'src/app/models/Plan.model';
import { Router } from '@angular/router';
import { NgClass, NgIf, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-sidebar',
  standalone: true,
  imports: [NgClass, NgIf, NgFor, RouterLink],
  templateUrl: './navigation-client-sidebar.component.html',
  styleUrls: ['./navigation-client-sidebar.component.scss']
})
export class ClientSidebarComponent {
  constructor(private router: Router) { }
  dropdownOpen = false;
  sidebarOpen = false;
  isSidebarItemHovered = false;
  isMobile: boolean = false;
  plan?: Plan;
  authService = inject(AuthService);
  plansService = inject(PlansService);
  companiesService = inject(CompaniesService);

  ngOnInit(): void {
    this.companiesService.getByOwner().subscribe((company: any) => {
      this.plansService.getCurrentPlan(company.company.id).subscribe((companyPlan: any) => {
        this.plan = companyPlan.plan;
      });
    });

    window.innerWidth < 750 ?  this.isMobile = true : this.isMobile = false;
    this.isMobile ? this.sidebarOpen = false : this.sidebarOpen = true; // in mobile mode, sidebar is closed by default

    // if user clicks outside of sidebar, close sidebar
    document.addEventListener('click', (event) => {
      if (!(event.target as Element).closest('.client-sidebar') && this.isMobile && this.sidebarOpen) {
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