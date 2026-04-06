import { Routes } from '@angular/router';
import { AppInvoiceListComponent } from '../../pages/apps/invoice/invoice-list/invoice-list.component';
import { AppAddInvoiceComponent } from '../../pages/apps/invoice/add-invoice/add-invoice.component';
import { AppInvoiceViewComponent } from '../../pages/apps/invoice/invoice-view/invoice-view.component';
import { AppEditInvoiceComponent } from '../../pages/apps/invoice/edit-invoice/edit-invoice.component';
import { PaymentsReportsComponent } from '../../pages/apps/invoice/payments-reports/payments-reports.component';
import { AppPricingStripeComponent } from '../../pages/apps/invoice/pricing/pricing.component';

export const BillingRoutes: Routes = [
	{
		path: '',
		redirectTo: 'invoice',
		pathMatch: 'full',
	},
	{
		path: 'invoice',
		component: AppInvoiceListComponent,
		data: {
			title: 'Invoice',
			urls: [
				{ title: 'Dashboard', url: '/dashboards/dashboard2' },
				{ title: 'Invoice' },
			],
		},
	},
	{
		path: 'payments-reports',
		component: PaymentsReportsComponent,
		data: {
			title: 'Reports',
			showGoBack: true,
			urls: [
				{ title: 'Dashboard', url: '/dashboards/dashboard2' },
				{ title: 'Reports' },
			],
		},
	},
	{
		path: 'addInvoice',
		component: AppAddInvoiceComponent,
		data: {
			title: 'Add Invoice',
			showGoBack: true,
			urls: [
				{ title: 'Dashboard', url: '/dashboards/dashboard2' },
				{ title: 'Add Invoice' },
			],
		},
	},
	{
		path: 'viewInvoice/:id',
		component: AppInvoiceViewComponent,
		data: {
			title: 'View Invoice',
			showGoBack: true,
			urls: [
				{ title: 'Dashboard', url: '/dashboards/dashboard2' },
				{ title: 'View Invoice' },
			],
		},
	},
	{
		path: 'editinvoice/:id',
		component: AppEditInvoiceComponent,
		data: {
			title: 'Edit Invoice',
			showGoBack: true,
			urls: [
				{ title: 'Dashboard', url: '/dashboards/dashboard2' },
				{ title: 'Edit Invoice' },
			],
		},
	},
	{
		path: 'pricing',
		component: AppPricingStripeComponent,
		data: {
			title: 'Pricing',
			showGoBack: true,
			urls: [
				{ title: 'Dashboard', url: '/dashboards/dashboard1' },
				{ title: 'Pricing' },
			],
		},
	},
];
