import { Component } from '@angular/core';
import { AppTrafficDistributionComponent } from '../../../components/dashboard2/traffic-distribution/traffic-distribution.component';
import { AppEmployeesReportsComponent } from '../../../components/dashboard2/employees-reports/employees-reports.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [AppTrafficDistributionComponent, AppEmployeesReportsComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent {

}
