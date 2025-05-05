import { NgClass, NgForOf, NgIf, NgStyle } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Plan } from 'src/app/models/Plan.model';
import { PlansService } from 'src/app/services/plans.service';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';
import { CompaniesService } from 'src/app/services/companies.service';
import { NotificationStore } from 'src/app/stores/notification.store';
import { NotificationsService } from 'src/app/services/notifications.service';
import { EntriesService } from 'src/app/services/entries.service';

export interface DashboardItems {
  path?: string | null;
  title: string;
  description: string;
  header: string;
  resource?: string;
  href?: string | null;
  alert?: string;
  options?: DashboardItemsOptions[];
  addons?: DashboardItemsAddOns[];
  background?: string;
  plans_available?: Plan[];
  available?: boolean;
}

export interface DashboardItemsOptions {
  title: string;
  path: string;
  icon?: string;
  label?: string;
}

export interface DashboardItemsAddOns {
  addOnTitle: string;
  data: addOnData[];
}
export interface addOnData {
  title: string;
  description: string;
  path: string;
  icon?: string;
  id?: number;
}

@Component({
  selector: 'app-dashboard-lib',
  standalone: true,
  imports: [NgIf, NgForOf, NgClass, RouterLink, NgStyle],
  templateUrl: './dashboard-lib.component.html',
  styleUrl: './dashboard-lib.component.scss',
})
export class DashboardLibComponent {
getSlicedNotifications(arg0: () => any[],arg1: number,arg2: number): any {
throw new Error('Method not implemented.');
}
  @Input() components!: DashboardItems[];
  userType: any;
  plan?: Plan;
  store = inject(NotificationStore);
  plansService = inject(PlansService);
  companiesService = inject(CompaniesService);
  notificationsService = inject(NotificationsService);

  constructor(
    private authService: AuthService,
    public entriesService: EntriesService
  ) {}
  assetsPath: string = environment.assets + '/resources/';

  isDisabledOption(optionTitle: string): boolean {
    return (optionTitle === 'Kanban board' || optionTitle === 'Matrix board') 
           && this.plan?.name === 'Basic';
  }

  handleOptionClick(event: Event, title: string) {
    if (this.isDisabledOption(title)) {
      event.preventDefault();
      this.upgradePlanMessage();
    }
  }

  upgradePlanMessage(){
    this.store.addNotifications('Upgrade your plan to enjoy the full experience!');
  }

  combinedNotifications() {
    if (this.userType === '1') {
      return [...this.notificationsService.recentNotifications, ...this.entriesService.reviewEntries];
    }
    return this.notificationsService.recentNotifications;
  }

  ngOnInit(): void {
    this.authService.getUserType().subscribe((role) => {
      this.userType = role;
    });
    this.companiesService.getByOwner().subscribe((company: any) => {
      this.plansService.getCurrentPlan(company.company.id).subscribe((companyPlan: any) => {
        this.plan = companyPlan.plan;
      });
    });
    this.combinedNotifications();
  }
}
