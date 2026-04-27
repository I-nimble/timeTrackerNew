import { Component } from '@angular/core';

import { AppInvoiceViewComponent } from 'src/app/pages/apps/invoice/invoice-view/invoice-view.component';

@Component({
  selector: 'app-billing-invoice-view-page',
  standalone: true,
  imports: [AppInvoiceViewComponent],
  template: '<app-invoice-view></app-invoice-view>',
})
export class BillingInvoiceViewPageComponent {}
