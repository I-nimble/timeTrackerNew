import { Component } from '@angular/core';
import { AppPricingStripeComponent } from 'src/app/pages/apps/invoice/pricing/pricing.component';

@Component({
  selector: 'app-billing-pricing-page',
  standalone: true,
  imports: [AppPricingStripeComponent],
  template: '<app-pricing-stripe></app-pricing-stripe>',
})
export class BillingPricingPageComponent {}
