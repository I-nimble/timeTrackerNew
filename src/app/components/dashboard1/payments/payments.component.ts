import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import {
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexTooltip,
  ApexAxisChartSeries,
  ApexPlotOptions,
  ApexResponsive,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { MaterialModule } from '../../../material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { UsersService } from 'src/app/services/users.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { forkJoin } from 'rxjs';
import { SchedulesService } from 'src/app/services/schedules.service';
import { ReportsService } from 'src/app/services/reports.service';
import moment from 'moment-timezone';

export interface paymentsChart {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [MaterialModule, NgApexchartsModule, TablerIconsModule],
  templateUrl: './payments.component.html',
})
export class AppPaymentsComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent = Object.create(null);
  public paymentsChart!: Partial<paymentsChart> | any;
  companyTimezone: string = 'UTC';
  workedPercent: number = 0;
  notWorkedPercent: number = 0;
  refreshInterval: any;

  constructor(
    private usersService: UsersService,
    private schedulesService: SchedulesService,
    private reportsService: ReportsService,
    private employeeService: EmployeesService,
  ) {
    this.paymentsChart = {
      series: [
        {
          name: 'Last Year ',
          data: [0, 0, 0, 0, 0, 0, 0],
        },
        {
          name: 'This Year ',
          data: [0, 0, 0, 0, 0, 0, 0],
        },
      ],

      chart: {
        type: 'bar',
        fontFamily: 'inherit',
        foreColor: '#adb0bb',
        toolbar: {
          show: false,
        },
        height: 150,
        stacked: true,
      },
      colors: ['var(--mat-sys-primary)', '#e7ecf0'],
      plotOptions: {
        bar: {
          horizontal: false,
          // barHeight: "90%",
          columnWidth: '26%',
          borderRadius: [3],
          borderRadiusApplication: 'end',
          borderRadiusWhenStacked: 'all',
        },
      },
      stroke: {
        show: false,
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: false,
      },
      grid: {
        show: false,
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
      },
      xaxis: {
        categories: [['M'], ['T'], ['W'], ['T'], ['F'], ['S'], ['S']],
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          show: false,
        },
      },
      tooltip: {
        enabled: false,
      },
    };
  }

  ngOnInit() {
    this.getAllUsers();
    this.refreshInterval = setInterval(() => {
      this.getAllUsers();
    }, 300000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  getAllUsers() {
    this.employeeService.get().subscribe({
      next: (employees: any) => {
        const filteredEmployees = employees.filter(
          (user: any) => user.user.active == 1 && user.user.role == 2
        );
        const employeeIds = filteredEmployees.map((emp: any) => emp.user.id);

        const today = new Date();
        const firstday = moment(today).isoWeekday(1).format('YYYY-MM-DD');
        const lastday = moment(today).isoWeekday(7).format('YYYY-MM-DD');

        const schedulesRequests = employeeIds.map((id: number) =>
          this.schedulesService.getById(id)
        );
        forkJoin<any[]>(schedulesRequests).subscribe((allSchedules: any[]) => {
          const entriesRequests = employeeIds.map((id: number) =>
            this.reportsService.getRange(
              { firstSelect: firstday, lastSelect: lastday },
              { id },
              {
                user: String(id),
                company: '',
                project: 'all',
                byClient: false,
                useTimezone: true,
              }
            )
          );
          (
            forkJoin(entriesRequests) as import('rxjs').Observable<any[][]>
          ).subscribe((allEntries: any[][]) => {
            const workedHoursPerDay: { [day: string]: number } = {};
            const totalHoursPerDay: { [day: string]: number } = {};

            allEntries.forEach((entries, idx) => {
              const employeeWorked = entries.reduce((acc, entry) => {
                const date = moment(entry.start_time)
                  .tz(this.companyTimezone)
                  .format('ddd');
                const duration =
                  (new Date(entry.end_time).getTime() -
                    new Date(entry.start_time).getTime()) /
                  (1000 * 60 * 60);
                acc[date] = (acc[date] || 0) + duration;
                return acc;
              }, {} as { [day: string]: number });

              const employeeSchedules = allSchedules[idx]?.schedules || [];
              const employeeTotal = employeeSchedules.reduce(
                (acc: any, schedule: any) => {
                  const todayStr = moment()
                    .tz(this.companyTimezone)
                    .format('YYYY-MM-DD');
                  const start = moment.tz(
                    `${todayStr} ${schedule.start_time}`,
                    'YYYY-MM-DD HH:mm:ss',
                    this.companyTimezone
                  );
                  const end = moment.tz(
                    `${todayStr} ${schedule.end_time}`,
                    'YYYY-MM-DD HH:mm:ss',
                    this.companyTimezone
                  );
                  if (end.isBefore(start)) end.add(1, 'day');
                  const duration = end.diff(start, 'hours', true);
                  if (Array.isArray(schedule.days)) {
                    schedule.days.forEach((dayObj: any) => {
                      const dayShort = dayObj.name.substring(0, 3);
                      acc[dayShort] = (acc[dayShort] || 0) + duration;
                    });
                  }
                  return acc;
                },
                {} as { [day: string]: number }
              );

              // --- Sumar al total general ---
              Object.keys(employeeWorked).forEach((day) => {
                workedHoursPerDay[day] =
                  (workedHoursPerDay[day] || 0) + employeeWorked[day];
              });
              Object.keys(employeeTotal).forEach((day) => {
                totalHoursPerDay[day] =
                  (totalHoursPerDay[day] || 0) + employeeTotal[day];
              });
            });

            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const workedData = days.map((day) =>
              Number(workedHoursPerDay[day] || 0).toFixed(2)
            );
            const notWorkedData = days.map((day) => {
              const total = totalHoursPerDay[day] || 0;
              const worked = workedHoursPerDay[day] || 0;
              return Number(Math.max(total - worked, 0)).toFixed(2);
            });

            const totalWorked = workedData.reduce(
              (acc, val) => acc + Number(val),
              0
            );
            const totalScheduled = days.reduce(
              (acc, day) => acc + (totalHoursPerDay[day] || 0),
              0
            );

            let workedPercent = 0;
            let notWorkedPercent = 0;
            if (totalScheduled > 0) {
              workedPercent = Math.round((totalWorked / totalScheduled) * 100);
              notWorkedPercent = 100 - workedPercent;
            }

            this.workedPercent = workedPercent;
            this.notWorkedPercent = notWorkedPercent;

            // console.log('Worked Data:', workedData);
            // console.log('Not Worked Data:', notWorkedData);

            this.paymentsChart.series = [
              {
                name: 'Worked',
                data: workedData,
              },
              {
                name: 'Not worked',
                data: notWorkedData,
              },
            ];
          });
        });
      },
      error: (err: any) => {
        console.error('Error fetching employees:', err);
      },
    });
  }
}
