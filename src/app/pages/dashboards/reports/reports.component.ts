import { Component } from '@angular/core';

import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';

import { AppActivityReportsComponent } from '../../../components/dashboard2/app-activity-reports/activity-reports.component';
import { AppEmployeesReportsComponent } from '../../../components/dashboard2/app-employees-reports/app-employees-reports.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    AppActivityReportsComponent,
    AppEmployeesReportsComponent,
    TourMatMenuModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  dataSource: any[] = [];

  onEmployeesDataSourceChange(data: any[]) {
    this.dataSource = data;
  }
}
