import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexYAxis,
  ApexLegend,
  ApexXAxis,
  ApexTooltip,
  ApexTheme,
  ApexGrid,
  ApexPlotOptions,
  ApexFill,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { MatIconModule } from '@angular/material/icon'; 
import { Location } from '@angular/common';
import { RatingsEntriesService } from 'src/app/services/ratings_entries.service';
import { SchedulesService } from 'src/app/services/schedules.service';
//import { ReportsService } from 'src/app/services/reports.service';
import moment from 'moment';
import { CompaniesService } from 'src/app/services/companies.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: any;
  theme: ApexTheme;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  colors: string[];
  markers: any;
  grid: ApexGrid;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  labels: string[];
};

@Component({
  selector: 'app-employee-details',
  templateUrl: './employee-details.component.html',
  styleUrls: ['./employee-details.component.scss'],
  imports: [MatCardModule, NgApexchartsModule,MatIconModule],
})
export class EmployeeDetailsComponent implements OnInit {
  employeeId: string | null = null;
  datesRange: any = {};
  filters: any = { user: 'all', company: 'all' };
  hoursElapsed: number = 0;
  hoursRemaining: number = 0;
  companyTimezone: string = 'UTC';
  entries: any = [];

  public mostvisitChart: Partial<ChartOptions> | any;
  public salesOverviewChart: Partial<ChartOptions> | any;





  constructor(
    private route: ActivatedRoute,
    private location: Location,
    // private ratingsEntriesService: RatingsEntriesService,
    // private schedulesService: SchedulesService,
    // private reportsService: ReportsService,
    // private companieService: CompaniesService,
     
  ) {
    this.mostvisitChart = {
      series: [
        {
          name: 'Worked',
          data: [8, 6, 8, 5.5, 8, 8],
        },
        {
          name: 'Not worked',
          data: [0, 2, 0, 2.5, 0, 0],
        },
      ],
  
      chart: {
        type: 'bar',
        fontFamily: "'DM Sans',sans-serif",
        foreColor: '#adb0bb',
        toolbar: {
          show: false,
        },
        height: 280,
        stacked: true,
      },
      colors: ['#92b46c', '#adb0bb'],
      plotOptions: {
        bar: {
          borderRadius: [6],
          horizontal: false,
          barHeight: '60%',
          columnWidth: '30%',
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
      },
      yaxis: {
        tickAmount: 4,
      },
      xaxis: {
        categories: ['Mon', 'Tue', 'Wen', 'Thu', 'Fri'],
        axisTicks: {
          show: false,
        },
      },
      tooltip: {
        theme: 'dark',
        fillSeriesColor: false,
      },
    };

    this.salesOverviewChart = {
      series: [75, 25],
      chart: { type: 'donut', height: 275 },
      labels: ['Worked', 'Not worked'],
      colors: ['#92b46c', '#adb0bb'],
    };
  }

  ngOnInit(): void {
    this.employeeId = this.route.snapshot.paramMap.get('id');
    //this.defaultWeek();
  }

  // private defaultWeek(): void {
  //   const firstday = moment().isoWeekday(1).format('YYYY/MM/DD');
  //   const lastday = moment().isoWeekday(5).format('YYYY/MM/DD');
  //   this.datesRange = { firstSelect: firstday, lastSelect: lastday };
  // }

  // private loadCompanyData(): void {
  //   this.companieService.getByOwner().subscribe((company: any) => {
  //     this.filters.company = company.company;
  //     this.companyTimezone = company.company.timezone;
  //     this.loadEntries();
  //     this.getSchedules();
  //   });
  // }

  // private loadEntries(): void {
  //   const userParams = { id: this.employeeId }; 
    
  //   this.reportsService.getRange(
  //     this.datesRange, 
  //     userParams, 
  //     this.filters
  //   ).subscribe(v => {
  //     this.entries = v;
  //     this.ratingsEntriesService.getEntryId(this.entries).subscribe(processedEntries => {
  //       console.log('Processed Entries:', processedEntries);
  //     });
  //   });
  // }

  // private processEntries(entries: any[]): void {
  //   // Lógica idéntica a TeamReportsComponent.arrangeEntries()
  //   const totalHoursPerDay = entries.reduce((acc, entry) => {
  //     const date = moment(entry.start_time).tz(this.companyTimezone).format('ddd');
  //     const duration = (new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / (1000 * 60 * 60);
  //     acc[date] = (acc[date] || 0) + duration;
  //     return acc;
  //   }, {});

  //   // Actualizar gráfico de barras
  //   this.mostvisitChart.series[0].data = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => 
  //     totalHoursPerDay[day.substring(0, 3)] || 0
  //   );

  //   // Actualizar gráfico de donut con horas diarias
  //   // const totalDailyHours = Object.values(totalHoursPerDay).reduce((a: number, b: number) => a + b, 0);
  //   // this.salesOverviewChart.series = [totalDailyHours, 24 - totalDailyHours];
  // }

  // private getSchedules(): void {
  //   this.schedulesService.get().subscribe({
  //     next: (schedules: any) => {
  //       const todaySchedule = schedules.find((s: any) => 
  //         s.employee_id === this.employeeId && 
  //         s.days.some((day: any) => day.id === moment().tz(this.companyTimezone).isoWeekday())
  //       );

  //       if (todaySchedule) {
  //         const start = moment.tz(todaySchedule.start_time, 'HH:mm', this.companyTimezone);
  //         const end = moment.tz(todaySchedule.end_time, 'HH:mm', this.companyTimezone);
  //         const now = moment.tz(this.companyTimezone);

  //         // Ajustar para horarios nocturnos
  //         if (end.isBefore(start)) end.add(1, 'day');
          
  //         this.hoursElapsed = Math.max(now.diff(start, 'hours', true), 0);
  //         this.hoursRemaining = Math.max(end.diff(now, 'hours', true), 0);

  //         // Actualizar gráfico de donut en tiempo real
  //         this.salesOverviewChart.series = [
  //           this.hoursElapsed.toFixed(2), 
  //           this.hoursRemaining.toFixed(2)
  //         ];
  //       }
  //     },
  //     error: (err) => console.error('Error fetching schedules:', err)
  //   });
  // }

  goBack(): void {
    this.location.back(); 
  }
}