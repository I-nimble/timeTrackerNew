import { Routes } from '@angular/router';

// front pages
import { AppIndustryComponent } from './industry/industry.component';

export const HomePageRoutes: Routes = [
   {
    path: '',
    component: AppIndustryComponent,
  },
];
