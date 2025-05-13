import { Component, ViewChild, OnInit } from '@angular/core';
import {
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexLegend,
  ApexTooltip,
  ApexAxisChartSeries,
  ApexPlotOptions,
  ApexStroke,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { MaterialModule } from '../../../material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CompaniesService } from 'src/app/services/companies.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { UsersService } from 'src/app/services/users.service';
import { EntriesService } from 'src/app/services/entries.service';
import { forkJoin, Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { SchedulesService } from 'src/app/services/schedules.service';
import { DecimalPipe } from '@angular/common';

export interface trafficChart {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  stroke: ApexStroke;
}
@Component({
  selector: 'app-activity-report',
  standalone: true,
  imports: [MaterialModule, NgApexchartsModule, TablerIconsModule, DecimalPipe],
  templateUrl: './activity-report.component.html',
})
export class AppActivityReportComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent = Object.create(null);
  public trafficChart!: Partial<trafficChart> | any;
  dateRange: any = this.getCurrentWeekDates();
  userRole: string | null = localStorage.getItem('role');
  employees: any[] = [];
  totalHours: number = 0;
  hoursWorked: number = 0;

  constructor(
    private companiesService: CompaniesService,
    private employeesService: EmployeesService,
    private usersService: UsersService,
    private entriesService: EntriesService,
    private schedulesService: SchedulesService
  ) {
    this.trafficChart = {
      series: [0, 0],

      chart: {
        type: 'donut',
        fontFamily: "'Plus Jakarta Sans', sans-serif;",
        foreColor: '#adb0bb',
        toolbar: {
          show: false,
        },
        height: 250,
      },
      labels: [
        'Worked hours',
        'Hours left'
      ],
      colors: ['#92b46c', '#adb0bb'],
      plotOptions: {
        pie: {
          donut: {
            size: '75%',
            background: 'none',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '18px',
                color: undefined,
                offsetY: 5,
              },
              value: {
                show: false,
                color: '#98aab4',
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: false,
      },
      legend: {
        show: false,
      },
      tooltip: {
        theme: 'dark',
        fillSeriesColor: false,
      },
    };
  }

  ngOnInit(): void {
    this.getTeamMembers().subscribe((employees: number[]) => {
      this.employees = employees;

      // Get the entries for the selected date range for every employee
      const entriesObservables = employees.map((employee: number) => {
        return this.entriesService.getAllEntries({ 
          start_time: this.dateRange.firstSelect, 
          end_time: this.dateRange.lastSelect,
          user_id: employee
        });
      });

      const schedulesObservables = employees.map((employee: number) => {
        return this.schedulesService.getById(employee);
      });

      // Wait for all entries requests to complete
      forkJoin([
        forkJoin(entriesObservables),
        forkJoin(schedulesObservables)
      ]).subscribe(([userEntries, schedules]) => {
        // create an array with all the entries
        const allEntries = userEntries.map((obj: any) => obj.entries).flat();
        // Accumulate the total hours worked by summing the durations of the entries
        allEntries.forEach((entry: any) => {
          const start = new Date(entry.start_time);
          const end = new Date(entry.end_time);
          const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          this.hoursWorked += duration;
        });

        // Get the schedules for every employee, calculate the hours of every shift and add them to the total hours
        const allSchedules = schedules.map((schedule: any) => schedule.schedules).flat();

        allSchedules.forEach((schedule: any) => {
          // console.log('schedule: ', schedule)
          const [startHour, startMinute, startSecond] = schedule.start_time.split(':').map(Number);
          const [endHour, endMinute, endSecond] = schedule.end_time.split(':').map(Number);
          // Calculate duration in hours
          let startDate = new Date(0, 0, 0, startHour, startMinute, startSecond);
          let endDate = new Date(0, 0, 0, endHour, endMinute, endSecond);
          let duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
          // Handle overnight shifts where end is before start
          if (duration < 0) {
            duration += 24;
          }
          this.totalHours += duration * schedule.days.length;
        });
        // Calculate hours left
        const hoursLeft = this.totalHours - this.hoursWorked;
        // Update chart
        this.trafficChart.series = [this.hoursWorked, hoursLeft];
      });
    });
  }

  getTeamMembers(): Observable<number[]> {
    // Return an Observable of employee IDs depending on user role
    if(this.userRole === '3') {
      return this.companiesService.getByOwner().pipe(
        switchMap((company: any) => this.companiesService.getEmployees(company.company.id)),
        map((employees: any) => employees.map((employee: any) => employee.user.id))
      );
    }
    else if(this.userRole === '1') {
      return this.employeesService.get().pipe(
        map((employees: any) => employees.map((employee: any) => employee.user.id))
      );
    }
    else {
      return this.usersService.getUsers({ searchField: "", filter: { currentUser: true } }).pipe(
        switchMap((res: any) => {
          const userId = res[0].id;
          return this.employeesService.getById(userId);
        }),
        map((employee: any) => [employee.user.id])
      );
    }
  }

  getCurrentWeekDates() {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    
    return {
      firstSelect: sevenDaysAgo.toISOString(),
      lastSelect: today.toISOString()
    };
  }
}
