import { Component, ViewChild, OnInit, Input, OnChanges } from '@angular/core';
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
  selector: 'app-activity-reports',
  standalone: true,
  imports: [MaterialModule, NgApexchartsModule, TablerIconsModule, DecimalPipe],
  templateUrl: './activity-reports.component.html',
})
export class AppActivityReportsComponent implements OnInit, OnChanges {
  @ViewChild('chart') chart: ChartComponent = Object.create(null);
  @Input() dataSource: any[] = [];
  public trafficChart!: Partial<trafficChart> | any;
  userRole: string | null = localStorage.getItem('role');
  employees: any[] = [];
  totalHours: number = 0;
  hoursWorked: number = 0;
  hoursLeft: number = 0;

  constructor() {
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
        y: {
          formatter: (val: number) => val.toFixed(2)
        }
      },
    };
  }

  ngOnInit(): void {
    this.updateWorkedAndLeftFromRatings(this.dataSource);
  }

  ngOnChanges() {
    this.updateWorkedAndLeftFromRatings(this.dataSource);
  }

  updateWorkedAndLeftFromRatings(ratings: any[]) {
    this.hoursWorked = ratings.reduce((sum, emp) => sum + (emp.workedHours ?? 0), 0);
    this.hoursLeft = ratings.reduce((sum, emp) => sum + (emp.hoursLeft ?? 0), 0);
    this.trafficChart.series = [this.hoursWorked, this.hoursLeft];
  }

}
