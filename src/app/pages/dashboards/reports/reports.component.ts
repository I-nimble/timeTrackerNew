import { Component } from '@angular/core';
import { AppActivityReportComponent } from '../../../components/dashboard2/activity-report/activity-report.component';
import { AppEmployeesReportsComponent } from '../../../components/dashboard2/employees-reports/employees-reports.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [AppActivityReportComponent, AppEmployeesReportsComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent {

}
