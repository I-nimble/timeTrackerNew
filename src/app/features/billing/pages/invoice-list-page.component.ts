import { Component } from '@angular/core';

import { AppInvoiceListComponent } from 'src/app/pages/apps/invoice/invoice-list/invoice-list.component';

@Component({
  selector: 'app-billing-invoice-list-page',
  standalone: true,
  imports: [AppInvoiceListComponent],
  template: '<app-invoice-list></app-invoice-list>',
})
export class BillingInvoiceListPageComponent {}
