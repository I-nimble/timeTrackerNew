import { Routes } from '@angular/router';

// front pages
import { AppIndustryComponent } from './industry/industry.component';
import { AppLandingpageComponent } from './landingpage/landingpage.component';
import { AppPricingComponent } from './pricing/pricing.component';
import { AppProductsComponent } from './products/products.component';
import { AppWhyUsComponent } from './why-us/why-us.component';

export const HomePageRoutes: Routes = [
  {
    path: '',
    component: AppLandingpageComponent,
  },
   {
    path: 'industry',
    component: AppIndustryComponent,
  },
  {
    path: 'pricing',
    component: AppPricingComponent,
  },
  {
    path: 'products',
    component: AppProductsComponent,
  },
  {
    path: 'why-us',
    component: AppWhyUsComponent,
  },
];
