import { Component } from '@angular/core';
import { AppEditInvoiceComponent } from 'src/app/pages/apps/invoice/edit-invoice/edit-invoice.component';

@Component({
  selector: 'app-billing-edit-invoice-page',
  standalone: true,
  imports: [AppEditInvoiceComponent],
  template: '<app-edit-invoice></app-edit-invoice>',
})
export class BillingEditInvoicePageComponent {}
