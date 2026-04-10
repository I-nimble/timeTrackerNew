import { Routes } from '@angular/router';
import { AppTalentMatchComponent } from '../../pages/talent-match/talent-match.component';
import { CustomSearchComponent } from '../../pages/custom-search/custom-search.component';
import { CandidateDetailsComponent } from '../../pages/candidates/candidate-details/candidate-details.component';

export const TalentMatchRoutes: Routes = [
	{
		path: '',
		component: AppTalentMatchComponent,
		data: {
			title: 'Talent match',
			urls: [
				{ title: 'Dashboard', url: '/dashboards/dashboard1' },
				{ title: 'Talent match' },
			],
		},
	},
	{
		path: 'custom-search',
		component: CustomSearchComponent,
		data: {
			title: 'Custom Search',
			showGoBack: true,
			urls: [
				{ title: 'Dashboard', url: '/dashboards/dashboard1' },
				{ title: 'Talent match', url: '/talent-match' },
			],
		},
	},
	{
		path: ':id',
		component: CandidateDetailsComponent,
		data: {
			title: 'Candidate Details',
			showGoBack: true,
			urls: [
				{ title: 'Dashboard', url: '/dashboards/dashboard1' },
				{ title: 'Talent match', url: '/talent-match' },
				{ title: 'Details' },
			],
		},
	},
];
