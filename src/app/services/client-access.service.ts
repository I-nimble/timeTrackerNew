import { Injectable, inject, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { EmployeesService } from './employees.service';
import { CompaniesService } from './companies.service';
import { PlansService } from './plans.service';
import { CompanyPlan } from '../models/Plan.model';

const ACTIVE_STATUSES = ['active', 'trialing'] as const;

@Injectable({ providedIn: 'root' })
export class ClientAccessService {
  private readonly employeesService = inject(EmployeesService);
  private readonly companiesService = inject(CompaniesService);
  private readonly plansService = inject(PlansService);

  private readonly _hasAccess = signal<boolean>(localStorage.getItem('clientHasTeam') === 'true');
  private readonly _hasEmployees = signal<boolean>(false);

  readonly hasAccess = this._hasAccess.asReadonly();
  readonly hasEmployees = this._hasEmployees.asReadonly();

  async refresh(): Promise<boolean> {
    const role = localStorage.getItem('role');
    if (role !== '3') {
      this._hasAccess.set(true);
      this._hasEmployees.set(true);
      return true;
    }
    try {
      const [employees, company] = await Promise.all([
        lastValueFrom(this.employeesService.get()).catch(() => [] as any[]),
        lastValueFrom(this.companiesService.getByOwner()).catch(() => null),
      ]);

      const employeesExist = Array.isArray(employees) && employees.length > 0;

      let hasSubscription = false;
      if (company?.company_id) {
        const planData: CompanyPlan | null = await lastValueFrom(
          this.plansService.getCurrentPlan(company.company_id),
        ).catch(() => null);

        if (planData) {
          this.plansService.setCurrentPlan(planData);
          const paidPlanActive =
            planData.plan.id > 1 &&
            ACTIVE_STATUSES.includes(planData.status as any);
          const clientPlanActive = ACTIVE_STATUSES.includes(
            planData.client_plan?.status as any,
          );
          hasSubscription = paidPlanActive || clientPlanActive;
        }
      }

      const hasAccess = employeesExist || hasSubscription;
      this._hasEmployees.set(employeesExist);
      this._hasAccess.set(hasAccess);
      localStorage.setItem('clientHasTeam', hasAccess ? 'true' : 'false');
      return hasAccess;
    } catch {
      return this._hasAccess();
    }
  }
}
