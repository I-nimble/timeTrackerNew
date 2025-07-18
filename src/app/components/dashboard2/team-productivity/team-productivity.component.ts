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
import { DecimalPipe, NgIf } from '@angular/common';

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
  selector: 'team-productivity',
  standalone: true,
  imports: [MaterialModule, NgApexchartsModule, TablerIconsModule, DecimalPipe, NgIf],
  templateUrl: './team-productivity.component.html',
  styleUrls: ['./team-productivity.component.scss'],
})
export class TeamProductivityComponent implements OnInit, OnChanges {
  @ViewChild('chart') chart: ChartComponent = Object.create(null);
  @Input() dataSource: any[] = [];
  public trafficChart!: Partial<trafficChart> | any;
  userRole: string | null = localStorage.getItem('role');
  employees: any[] = [];
  totalHours: number = 0;
  completed: number = 0;
  totalTasks: number = 0;
  tasksLeft: number = 0;
  productivityPercentage: number = 0;
  isChartLoaded: boolean = false;

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
        'Completed tasks',
        'Tasks left'
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
                show: false, 
              },
              value: {
                show: false, 
              },
              total: {
                show: false 
              }
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
    setTimeout(() => {
      this.isChartLoaded = true;
    }, 700);
  }

  ngOnChanges() {
    this.updateWorkedAndLeftFromRatings(this.dataSource);
  }

  updateWorkedAndLeftFromRatings(ratings: any[]) {
    this.completed = ratings.reduce((sum, emp) => sum + (emp.completed ?? 0), 0);
    this.totalTasks = ratings.reduce((sum, emp) => sum + (emp.totalTasks ?? 0), 0);
    this.productivityPercentage = this.totalTasks > 0 ? (this.completed / this.totalTasks) * 100 : 0;
    this.tasksLeft = this.totalTasks - this.completed;
    if (this.completed === 0 && this.totalTasks === 0) {
      this.trafficChart.series = [0, 1];
    } else {
      this.trafficChart.series = [this.completed, this.tasksLeft];
    }
  }

}
