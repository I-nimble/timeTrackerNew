import { Component, ViewChild, OnInit, Input, OnChanges, OnDestroy } from '@angular/core';
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
  selector: 'app-activity-reports',
  standalone: true,
  imports: [MaterialModule, NgApexchartsModule, TablerIconsModule, DecimalPipe, NgIf],
  templateUrl: './activity-reports.component.html',
  styleUrls: ['./activity-reports.component.scss'],
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
  formattedHoursWorked: string = '00:00:00';
  formattedHoursLeft: string = '00:00:00';
  isChartLoaded: boolean = false;
  private activeTimer: any;
  private socketSub: any;

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
          formatter: (val: number) => {
            const formatted = this.formatHoursToHMS(val);
            return formatted;
          }
        }
      },
    };
  }

  ngOnInit(): void {
    this.updateWorkedAndLeftFromRatings(this.dataSource);
    setTimeout(() => {
      this.isChartLoaded = true;
    }, 700);
    this.startActiveUpdater();
  }

  ngOnChanges() {
    this.updateWorkedAndLeftFromRatings(this.dataSource);
  }

  ngOnDestroy(): void {
    if (this.activeTimer) clearInterval(this.activeTimer);
    if (this.socketSub) this.socketSub.unsubscribe?.();
  }

  startActiveUpdater() {
    if (this.activeTimer) clearInterval(this.activeTimer);
    this.activeTimer = setInterval(() => {
      this.updateWorkedAndLeftFromRatings(this.dataSource);
    }, 1000);
  }

  updateWorkedAndLeftFromRatings(ratings: any[]) {
    const now = Date.now();
    this.hoursWorked = ratings.reduce((sum, emp) => {
      const base = typeof emp._baseWorkedDecimal === 'number' ? emp._baseWorkedDecimal : this.HHMMSSToDecimal(emp.workedHours);
      let elapsed = 0;
      try {
        if (emp.activeEntry && emp.activeEntry.start_time) {
          const start = new Date(emp.activeEntry.start_time).getTime();
          if (!isNaN(start)) elapsed = (now - start) / 1000 / 3600;
        }
      } catch (e) {
        elapsed = 0;
      }
      return sum + base + elapsed;
    }, 0);
    
    this.hoursLeft = ratings.reduce((sum, emp) => {
      const leftDecimal = this.HHMMSSToDecimal(emp.hoursLeft);
      return sum + leftDecimal;
    }, 0);

    this.formattedHoursWorked = this.formatHoursToHMS(this.hoursWorked);
    this.formattedHoursLeft = this.formatHoursToHMS(this.hoursLeft);
    
    try {
      if (this.isChartLoaded && this.chart && typeof (this.chart as any).updateSeries === 'function') {
        (this.chart as any).updateSeries([this.hoursWorked, this.hoursLeft]);
        const colors = (this.hoursWorked === 0 && this.hoursLeft === 0) ? ['#adb0bb', '#adb0bb'] : ['#92b46c', '#adb0bb'];
        if (typeof (this.chart as any).updateOptions === 'function') {
          (this.chart as any).updateOptions({ colors });
        } else {
          this.trafficChart.colors = colors;
        }
      } else {
        this.trafficChart.series = [this.hoursWorked, this.hoursLeft];
        this.trafficChart.colors = (this.hoursWorked === 0 && this.hoursLeft === 0) ? ['#adb0bb', '#adb0bb'] : ['#92b46c', '#adb0bb'];
      }
    } catch (e) {
      this.trafficChart.series = [this.hoursWorked, this.hoursLeft];
    }
  }

  HHMMSSToDecimal(timeStr: string): number {
    if (!timeStr || timeStr === '00:00:00') return 0;
    
    const parts = timeStr.split(':');
    if (parts.length !== 3) return 0;
    
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;
    
    return hours + (minutes / 60) + (seconds / 3600);
  }

  formatHoursToHMS(hoursDecimal: number): string {
    if (isNaN(hoursDecimal)) return '00:00:00';
    const hours = Math.abs(Number(hoursDecimal));
    
    const totalSeconds = Math.round(hours * 3600);
    const hoursPart = Math.floor(totalSeconds / 3600);
    const remainingSeconds = totalSeconds % 3600;
    const minutesPart = Math.floor(remainingSeconds / 60);
    const secondsPart = remainingSeconds % 60;

    return [
      String(hoursPart).padStart(2, '0'),
      String(minutesPart).padStart(2, '0'),
      String(secondsPart).padStart(2, '0')
    ].join(':');
  }
}
