import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatNativeDateModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { NgApexchartsModule } from 'ng-apexcharts';
import { UsersService } from 'src/app/services/users.service';
import moment from 'moment';
import { PerformanceService } from 'src/app/services/performance.service';
import { CompaniesService } from 'src/app/services/companies.service';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [
    MaterialModule,
    TablerIconsModule,
    CommonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgApexchartsModule,
    FormsModule,
    RouterModule,
  ],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  templateUrl: './dashboard-admin.component.html',
  styleUrl: './dashboard-admin.component.scss',
})
export class AppDashboardAdminComponent implements OnInit {
  selectedClient: any = '';
  selectedEmployee: any = '';
  usersList: any[] = [];
  companiesList: any[] = [];
  employeeList: any[] = [];
  startDate: any = '';
  endDate: any = '';
  public barChartOptions: any = {
    series: [{ data: [] }],
    chart: { type: 'bar', height: 300, toolbar: { show: false } },
    xaxis: { categories: [] },
  };
  public lineChartOptions: any = {
    series: [{ data: [] }],
    chart: { type: 'line', height: 300, toolbar: { show: false } },
    xaxis: { categories: [] },
  };
  employeeTableDisplayedColumns: string[] = [
    'employee',
    'tasksCompleted',
    'punctuality',
    'quality',
  ];
  employeeTableData: any = [];
  filteredEmployeeTableData: any = [];
  avgTasksCompleted: number = 0;
  avgPerformance: number = 0;

  constructor(
    private usersService: UsersService,
    private performanceService: PerformanceService,
    private companiesService: CompaniesService	
  ) {}

  ngOnInit() {
    const today = moment();
    this.startDate = today.clone().startOf('isoWeek').toDate();
    this.endDate = today.clone().endOf('isoWeek').toDate();
    this.getUsers();
  }

  getUsers() {
    const body = {};
    this.usersService.getUsers(body).subscribe((res: any) => {
      this.usersList = res;
      this.employeeList = [];
      this.selectedClient = null;
      this.selectedEmployee = null;
    });
    this.companiesService.getCompanies().subscribe((res: any) => {
      this.companiesList = res;
    });
  }

  onClientChange(client: any) {
    if (client) {
      this.selectedEmployee = null;
      const companyId = client.id;
      const dateFrom = this.startDate
        ? moment(this.startDate).format('YYYY-MM-DD')
        : '2025-05-1';
      const dateTo = this.endDate
        ? moment(this.endDate).format('YYYY-MM-DD')
        : '2025-05-27';

      this.performanceService
        .getMetrics(companyId, dateFrom, dateTo)
        .subscribe((metrics: any[]) => {
          this.employeeTableData = metrics.map((emp) => ({
            name: emp.employeeName,
            tasksCompleted: emp.completedTasks,
            punctuality: emp.punctuality,
            quality: emp.qualityOfWork ?? 0,
            performance: emp.performance,
            performanceOverTime: emp.performanceOverTime,
            performanceByMonth: emp.performanceByMonth,
          }));

          this.employeeList = metrics;

          this.filteredEmployeeTableData = [...this.employeeTableData];

          this.avgTasksCompleted = this.employeeTableData.length
            ? Math.round(
                this.employeeTableData.reduce(
                  (sum: any, e: any) => sum + e.tasksCompleted,
                  0
                ) / this.employeeTableData.length
              )
            : 0;
          this.avgPerformance = this.employeeTableData.length
            ? Math.round(
                this.employeeTableData.reduce(
                  (sum: any, e: any) => sum + (e.performance ?? 0),
                  0
                ) / this.employeeTableData.length
              )
            : 0;

          this.loadPerformanceByEmployee();
          this.loadPerformanceOverTime();
        });
    } else {
      this.employeeTableData = [];
      this.filteredEmployeeTableData = [];
      this.avgTasksCompleted = 0;
      this.avgPerformance = 0;
      this.barChartOptions = {
        series: [{ data: [] }],
        chart: { type: 'bar', height: 300 },
        xaxis: { categories: [] },
      };
      this.lineChartOptions = {
        series: [{ data: [] }],
        chart: { type: 'line', height: 300 },
        xaxis: { categories: [] },
      };
    }
  }

  onEmployeeChange(employee: any) {
    this.selectedEmployee = employee;

    if (!employee) {
      this.filteredEmployeeTableData = [...this.employeeTableData];
    } else {
      this.filteredEmployeeTableData = this.employeeTableData.filter(
        (emp: any) => emp.name === employee.employeeName
      );
    }

    this.avgTasksCompleted = this.filteredEmployeeTableData.length
      ? Math.round(
          this.filteredEmployeeTableData.reduce(
            (sum: number, e: any) => sum + (e.tasksCompleted ?? 0),
            0
          ) / this.filteredEmployeeTableData.length
        )
      : 0;

    this.avgPerformance = this.filteredEmployeeTableData.length
      ? Math.round(
          this.filteredEmployeeTableData.reduce(
            (sum: number, e: any) => sum + (e.performance ?? 0),
            0
          ) / this.filteredEmployeeTableData.length
        )
      : 0;

    this.loadPerformanceByEmployee();
    this.loadPerformanceOverTime();
  }

  onDateRangeChange() {
    if (this.startDate && this.endDate) {
      this.onClientChange(this.selectedClient);
    }
  }

  loadPerformanceByEmployee() {
    const topEmployees = [...this.filteredEmployeeTableData]
      .sort((a, b) => (b.performance ?? 0) - (a.performance ?? 0))
      .slice(0, 5);

    this.barChartOptions = {
      series: [
        {
          name: 'Performance',
          data: topEmployees.map((e) => e.performance ?? 0),
        },
      ],
      chart: { type: 'bar', height: 300, toolbar: { show: false } },
      xaxis: { categories: topEmployees.map((e) => e.name) },
      plotOptions: { bar: { horizontal: true } },
      colors: ['#9CB764'],
    };
  }

  loadPerformanceOverTime() {
    let data = this.filteredEmployeeTableData;

    const allMonthsSet = new Set<string>();
    data.forEach((emp: any) => {
      (emp.performanceByMonth || []).forEach((item: any) => {
        allMonthsSet.add(item.month);
      });
    });
    const allMonths = Array.from(allMonthsSet).sort();

    const avgPerformance = allMonths.map((month) => {
      const performances = data
        .map((emp: any) => {
          const found = (emp.performanceByMonth || []).find(
            (item: any) => item.month === month
          );
          return found ? found.performance : null;
        })
        .filter((val: number | null) => val !== null);
      return performances.length
        ? Number(
            (
              performances.reduce((a: any, b: any) => a + (b ?? 0), 0) /
              performances.length
            ).toFixed(2)
          )
        : 0;
    });

    this.lineChartOptions = {
      series: [
        {
          name: 'Performance',
          data: avgPerformance,
        },
      ],
      chart: { type: 'line', height: 300, toolbar: { show: false } },
      xaxis: {
        categories: allMonths.map((m) =>
          moment(m, 'YYYY-MM').format('MMM YYYY')
        ),
      },
      colors: ['#9CB764'],
    };
  }
}
