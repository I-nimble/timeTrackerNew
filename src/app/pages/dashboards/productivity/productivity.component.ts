import { Component } from '@angular/core';

import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';
import { AppDailyProductivityComponent } from 'src/app/components/dashboard2/daily-productivity/daily-productivity.component';
import { AppProductivityReportsComponent } from 'src/app/components/dashboard2/productivity-reports/productivity-reports.component';

import { TeamProductivityComponent } from '../../../components/dashboard2/team-productivity/team-productivity.component';

@Component({
  selector: 'app-productivity',
  standalone: true,
  imports: [
    AppDailyProductivityComponent,
    TeamProductivityComponent,
    AppProductivityReportsComponent,
    TourMatMenuModule,
  ],
  templateUrl: './productivity.component.html',
  styleUrl: './productivity.component.scss',
})
export class ProductivityComponent {
  dataSource: any[] = [];

  onEmployeesDataSourceChange(data: any[]) {
    this.dataSource = data;
  }
}
