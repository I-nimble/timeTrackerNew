import { Component } from '@angular/core';

// components
import { AppWelcomeCardComponent } from '../../../components/dashboard2/welcome-card/welcome-card.component';
import { AppTopCardsComponent } from '../../../components/dashboard2/top-cards/top-cards.component';
import { AppProfileExpanceCpmponent } from '../../../components/dashboard2/profile-expance/profile-expance.component';
import { AppActivityReportsComponent } from '../../../components/dashboard2/app-activity-reports/activity-reports.component';
import { AppTopEmployeesComponent } from '../../../components/dashboard2/top-employees/top-employees.component';
import { AppVisitUsaComponent } from '../../../components/dashboard1/visit-usa/visit-usa.component';
import { AppWeeklyHoursComponent } from '../../../components/dashboard1/weekly-hours/weekly-hours.component';
import { AppEmployeesReportsComponent } from '../../../components/dashboard2/app-employees-reports/app-employees-reports.component';

@Component({
  selector: 'app-dashboard2',
  standalone: true,
  imports: [
    AppWelcomeCardComponent,
    AppTopCardsComponent,
    AppProfileExpanceCpmponent,
    AppActivityReportsComponent,
    AppTopEmployeesComponent,
    AppVisitUsaComponent,
    AppWeeklyHoursComponent,
    AppEmployeesReportsComponent,
  ],
  templateUrl: './dashboard2.component.html',
})
export class AppDashboard2Component {
  activityDataSource: any[] = [];
  onEmployeesDataSourceChange(data: any[]) {
    this.activityDataSource = data;
  }
}
