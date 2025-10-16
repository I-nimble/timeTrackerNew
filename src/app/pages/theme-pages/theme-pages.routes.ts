import { Routes } from '@angular/router';

// theme pages
import { AppAccountSettingComponent } from '../apps/account-setting/account-setting.component';
import { AppPricingComponent } from './pricing/pricing.component';

export const ThemePagesRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'account-setting',
        component: AppAccountSettingComponent,
        data: {
          title: 'Account Setting',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Account Setting' },
          ],
        },
      },
      {
        path: 'pricing',
        component: AppPricingComponent,
        data: {
          title: 'Pricing',
          urls: [
            { title: 'Dashboard', url: '/dashboards/dashboard2' },
            { title: 'Pricing' },
          ],
        },
      },
    ],
  },
];
