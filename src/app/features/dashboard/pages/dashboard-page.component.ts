import { Component } from '@angular/core';

import { AppDashboard2Component } from 'src/app/pages/dashboards/dashboard2/dashboard2.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [AppDashboard2Component],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {}
