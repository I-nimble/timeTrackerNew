import { Component } from '@angular/core';
import { PaymentsReportsComponent } from 'src/app/pages/apps/invoice/payments-reports/payments-reports.component';

@Component({
  selector: 'app-billing-payments-reports-page',
  standalone: true,
  imports: [PaymentsReportsComponent],
  template: '<app-payments-reports></app-payments-reports>',
})
export class BillingPaymentsReportsPageComponent {}
