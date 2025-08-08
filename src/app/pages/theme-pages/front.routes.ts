import { Routes } from '@angular/router';

// front pages
import { AppIndustryComponent } from './industry/industry.component';
import { AppLandingpageComponent } from './landingpage/landingpage.component';
import { AppPricingComponent } from './pricing/pricing.component';
import { AppProductsComponent } from './products/products.component';
import { AppWhyUsComponent } from './why-us/why-us.component';
import { AppCareersComponent } from './careers/careers.component';
import { AppIndustryOtherComponent } from './industry-pages/industry-other.component';
import { AppIndustryLegalServicesComponent } from './industry-pages/industry-legal-service.component';
import { AppIndustryPersonalInjuryComponent } from './industry-pages/industry-personal-injury.component';
import { AppIndustryRealStateComponent } from './industry-pages/industry-real-state.component';
import { AppIndustryWorkersCompensationComponent } from './industry-pages/industry-workers-compensation.component';

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
    path: 'careers',
    component: AppCareersComponent,
  },
  {
    path: 'why-us',
    component: AppWhyUsComponent,
  },
  {
    path: 'industry/other',
    component: AppIndustryOtherComponent,
  },
  {
    path: 'industry/legal-services',
    component: AppIndustryLegalServicesComponent,
  },
  {
    path: 'industry/personal-injury',
    component: AppIndustryPersonalInjuryComponent,
  },
  {
    path: 'industry/real-state',
    component: AppIndustryRealStateComponent,
  },
  {
    path: 'industry/workers-compensation',
    component: AppIndustryWorkersCompensationComponent,
  },
];
