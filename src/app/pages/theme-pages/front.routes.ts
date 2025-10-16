import { Routes } from '@angular/router';

// front pages
import { AppPricingComponent } from './pricing/pricing.component';

export const HomePageRoutes: Routes = [
  {
    path: 'pricing',
    component: AppPricingComponent,
  },
];
