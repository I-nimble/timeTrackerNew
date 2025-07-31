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
import { EntriesService } from 'src/app/services/entries.service';
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
  selector: 'app-weekly-hours',
  standalone: true,
  imports: [MaterialModule, NgApexchartsModule, TablerIconsModule],
  templateUrl: './weekly-hours.component.html',
})
export class AppWeeklyHoursComponent implements OnInit, OnDestroy {
  @ViewChild('chart') chart: ChartComponent = Object.create(null);
  public paymentsChart!: Partial<paymentsChart> | any;
  companyTimezone: string = 'UTC';
  workedPercent: number = 0;
  notWorkedPercent: number = 0;
  refreshInterval: any;
  filters: any = { user: { id: null }, company: 'all', project: 'all' };
  schedules: any = [];
  datesRange: any = {};
  entries: any = [];
  totalUsers: number = 0;
  processedUsers: number = 0;
  totalWorkedHoursAll: { [day: string]: number } = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
  };
  totalScheduledHoursAll: { [day: string]: number } = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
  };
  private employeeIds: number[] = []; 

  constructor(
    private usersService: UsersService,
    private schedulesService: SchedulesService,
    private reportsService: ReportsService,
    private employeeService: EmployeesService,
    private entriesService: EntriesService
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
        show: true,
        min: 0,
        tickAmount: 5,
        labels: {
          show: true,
          style: {
            colors: '#adb0bb',
            fontSize: '11px',
            fontFamily: 'inherit',
          },
          formatter: function(value: number) {
            return value.toFixed(0) + 'h';
          }
        }
      },
      tooltip: {
        enabled: false,
      },
    };
  }

  ngOnInit() {
    this.loadInitialData();
  }

  private loadInitialData() {
    this.employeeService.get().subscribe({
      next: (employees: any) => {
        this.processInitialEmployeeData(employees);
      },
      error: (err) => {
        console.error('Error loading initial data:', err);
        this.setupDataRefresh();
      }
    });
  }

  private processInitialEmployeeData(employees: any) {
    const filteredEmployees = employees.filter(
      (user: any) => user.user.active == 1 && user.user.role == 2
    );
    this.employeeIds = filteredEmployees.map((emp: any) => emp.user.id);
    this.totalUsers = this.employeeIds.length;

    if (this.employeeIds.length === 0) {
      this.setupDataRefresh();
      return;
    }

    const today = new Date();
    this.datesRange = {
      firstSelect: moment(today).isoWeekday(1).format('YYYY-MM-DD'),
      lastSelect: moment(today).isoWeekday(7).format('YYYY-MM-DD')
    };

    forkJoin(
      this.employeeIds.map(userId => 
        forkJoin([
          this.schedulesService.getById(userId),
          this.reportsService.getRange(
            this.datesRange, 
            { id: userId }, 
            { ...this.filters, user: { id: userId } }
          )
        ])
      )
    ).subscribe({
      next: (results: any[]) => {
        this.schedules = [];
        this.entries = [];
        
        results.forEach(([schedules, entries]) => {
          this.schedules = [...this.schedules, ...(schedules.schedules || [])];
          this.entries = [...this.entries, ...(entries || [])];
        });

        this.processEntries(this.entries);
        this.setupDataRefresh();
      },
      error: (err) => {
        console.error('Error loading initial detailed data:', err);
        this.setupDataRefresh();
      }
    });
  }

  private setupDataRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    this.refreshInterval = setInterval(() => {
      this.refreshEntriesOnly();
    }, 60000);
  }

  private refreshEntriesOnly() {
    if (this.employeeIds.length === 0) return;

    forkJoin(
      this.employeeIds.map(userId => 
        this.reportsService.getRange(
          this.datesRange,
          { id: userId },
          { ...this.filters, user: { id: userId } }
        )
      )
    ).subscribe({
      next: (entriesResults: any[]) => {
        this.entries = [];
        entriesResults.forEach(entries => {
          this.entries = [...this.entries, ...(entries || [])];
        });
        this.processEntries(this.entries);
      },
      error: (err) => {
        console.error('Error refreshing entries:', err);
      }
    });
  }

  private processEntries(entries: any[]): void {
    this.totalWorkedHoursAll = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 };
    this.totalScheduledHoursAll = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 };

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    let workedData = [];
    let notWorkedData = [];
    let workedPercent = 0;
    let notWorkedPercent = 0;

    // Calculate worked hours per day
    const workedHoursPerDay = entries.reduce((acc, entry) => {
      const date = moment(entry.start_time)
        .tz(this.companyTimezone)
        .format('ddd');
      const duration =
        (new Date(entry.end_time).getTime() -
          new Date(entry.start_time).getTime()) /
        (1000 * 60 * 60);
      acc[date] = (acc[date] || 0) + duration;
      return acc;
    }, {});

    // Sum up active entry hours  
    const currentDay = moment().format('ddd');
    const activeEntry = this.entries.find(
      (entry: any) => moment(entry.start_time).isSame(moment().format('YYYY-MM-DD'), 'day') && entry.status === 0
    );
    if (activeEntry) {
      const startTime = moment(activeEntry.start_time);
      const currentTime = moment();
      workedHoursPerDay[currentDay] = (workedHoursPerDay[currentDay] || 0) + currentTime.diff(startTime, 'hours', true);
    }

    // Calculate total scheduled hours per day for each day in each schedule
    const seenDaySchedule = new Set<string>();
    const totalHoursPerDay = this.schedules.reduce(
      (acc: any, schedule: any) => {
        // Calculate duration for this schedule
        const today = moment().tz(this.companyTimezone).format('YYYY-MM-DD');
        const start = moment.tz(
          `${today} ${schedule.start_time}`,
          'YYYY-MM-DD HH:mm:ss',
          this.companyTimezone
        );
        const end = moment.tz(
          `${today} ${schedule.end_time}`,
          'YYYY-MM-DD HH:mm:ss',
          this.companyTimezone
        );
        if (end.isBefore(start)) end.add(1, 'day');
        const duration = end.diff(start, 'hours', true);
        // Assign duration to each day in schedule.days
        if (Array.isArray(schedule.days)) {
          schedule.days.forEach((dayObj: any) => {
            const dayShort = dayObj.name.substring(0, 3);
            const key = `${dayShort}_${schedule.start_time}_${schedule.end_time}`;
            if (!seenDaySchedule.has(key)) {
              acc[dayShort] = (acc[dayShort] || 0) + duration;
              seenDaySchedule.add(key);
            }
          });
        }
        return acc;
      },
      {}
    );

    const schedulesCount = this.schedules.length || 1;
    days.forEach((day) => {
      const scheduledHours = (totalHoursPerDay[day] || 0) / schedulesCount;
      const workedHours = (workedHoursPerDay[day] || 0) / schedulesCount;
      
      this.totalScheduledHoursAll[day] = scheduledHours;
      this.totalWorkedHoursAll[day] = Math.min(workedHours, scheduledHours);
    });

    workedData = days.map((day) =>
      Number(this.totalWorkedHoursAll[day].toFixed(2))
    );
    notWorkedData = days.map((day) => {
      let total = this.totalScheduledHoursAll[day] || 0;
      let worked = this.totalWorkedHoursAll[day] || 0;
      return Number(Math.max(total - worked, 0).toFixed(2));
    });

    const maxScheduledHours = Math.max(...Object.values(this.totalScheduledHoursAll));
    const yAxisMax = Math.ceil(maxScheduledHours);

    this.paymentsChart.yaxis = {
      show: true,
      min: 0,
      max: yAxisMax,
      tickAmount: Math.ceil(yAxisMax / 2),
      labels: {
          show: true,
          style: {
              colors: '#adb0bb',
              fontSize: '11px',
              fontFamily: 'inherit',
          },
          formatter: function(value: number) {
              return value.toFixed(0) + 'h';
          }
      }
    };

    let totalWorked = workedData.reduce((acc, val) => acc + Number(val), 0);
    let totalScheduled = days.reduce(
      (acc, day) => acc + (this.totalScheduledHoursAll[day] || 0),
      0
    );

    if (totalScheduled > 0) {
      workedPercent = Math.round((totalWorked / totalScheduled) * 100);
      notWorkedPercent = Math.max(100 - workedPercent, 0);
      this.workedPercent = workedPercent;
      this.notWorkedPercent = notWorkedPercent;
    }

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

    this.updateBarColors();
  }

  private updateBarColors() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const currentDay = moment().tz(this.companyTimezone).format('ddd');
    const gray = '#e7ecf0';
    const darkGray = '#b6b6b6';
    const green = 'var(--mat-sys-primary)';
    const lightGreen = '#bdd99b'; 
    const workedColors = days.map(day => (day === currentDay ? green : darkGray));
    const notWorkedColors = days.map(day => (day === currentDay ? lightGreen : gray));

    this.paymentsChart.colors = [
      ({ dataPointIndex, seriesIndex }: any) => {
        if (seriesIndex === 0) return workedColors[dataPointIndex] || gray;
        return notWorkedColors[dataPointIndex] || gray;
      }
    ];
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}
