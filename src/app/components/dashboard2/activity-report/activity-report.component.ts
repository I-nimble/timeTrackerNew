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
  this.resetCounters();
  
  this.getTeamMembers().pipe(
    switchMap((employees: number[]) => {
      const entriesRequests = employees.map(employee => 
        this.entriesService.getAllEntries({
          start_time: this.dateRange.firstSelect,
          end_time: this.dateRange.lastSelect,
          user_id: employee
        })
      );

      const schedulesRequests = employees.map(employee => 
        this.schedulesService.getById(employee)
      );

      return forkJoin([
        forkJoin(entriesRequests),
        forkJoin(schedulesRequests)
      ]);
    })
  ).subscribe(([entriesResults, schedulesResults]) => {
    this.processEntries(entriesResults);
    this.processSchedules(schedulesResults);
    this.updateChart();
  });
}

// Nuevo método para resetear contadores
private resetCounters(): void {
  this.hoursWorked = 0;
  this.totalHours = 0;
}

// Nuevo método para procesar entries
private processEntries(entriesResults: any[]): void {
  this.hoursWorked = entriesResults
    .flatMap(response => response.entries)
    .reduce((total, entry) => {
      const start = new Date(entry.start_time);
      const end = new Date(entry.end_time);
      return total + (end.getTime() - start.getTime()) / 3.6e6;
    }, 0);
}

// Nuevo método para procesar schedules
private processSchedules(schedulesResults: any[]): void {
  this.totalHours = schedulesResults
    .flatMap(response => response.schedules)
    .reduce((total, schedule) => {
      const [startH, startM] = schedule.start_time.split(':').map(Number);
      const [endH, endM] = schedule.end_time.split(':').map(Number);
      let duration = ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
      duration = duration < 0 ? duration + 24 : duration;
      return total + (duration * schedule.days.length);
    }, 0);
}

// Nuevo método para actualizar el gráfico
private updateChart(): void {
  const hoursLeft = this.totalHours - this.hoursWorked;
  this.trafficChart = {
    ...this.trafficChart,
    series: [this.hoursWorked, hoursLeft]
  };
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
