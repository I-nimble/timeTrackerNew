import { Component } from '@angular/core';
import { AppAddInvoiceComponent } from 'src/app/pages/apps/invoice/add-invoice/add-invoice.component';

@Component({
  selector: 'app-billing-add-invoice-page',
  standalone: true,
  imports: [AppAddInvoiceComponent],
  template: '<app-add-invoice></app-add-invoice>',
})
export class BillingAddInvoicePageComponent {}
