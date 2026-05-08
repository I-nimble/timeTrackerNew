import { Injectable, inject, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { EmployeesService } from './employees.service';
import { SubscriptionService } from './subscription.service';

@Injectable({ providedIn: 'root' })
export class ClientAccessService {
  private readonly employeesService = inject(EmployeesService);
  private readonly subscriptionService = inject(SubscriptionService);

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
      const [employees, clientStatus] = await Promise.all([
        lastValueFrom(this.employeesService.get()).catch(() => [] as any[]),
        lastValueFrom(this.subscriptionService.getClientStatus()).catch(() => ({ status: 'inactive' })),
      ]);
      const employeesExist = Array.isArray(employees) && employees.length > 0;
      const hasSubscription = ['active', 'trialing'].includes((clientStatus as any).status);
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
