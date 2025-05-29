import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import {
  ApexAxisChartSeries,
  ApexChart,
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
import { SchedulesService } from 'src/app/services/schedules.service';
import { ReportsService } from 'src/app/services/reports.service';
import moment from 'moment-timezone';
import { UsersService } from 'src/app/services/users.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EntriesService } from 'src/app/services/entries.service';

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
  standalone: true,
  selector: 'app-employee-details',
  templateUrl: './employee-details.component.html',
  styleUrls: ['./employee-details.component.scss'],
  imports: [MatCardModule, NgApexchartsModule,MatIconModule],
})
export class EmployeeDetailsComponent implements OnInit {
  userId: string | null = null;
  datesRange: any = {};
  filters: any = { user: { id: null }, company: 'all', project: 'all' };
  hoursElapsed: number = 0;
  hoursRemaining: number = 0;
  companyTimezone: string = 'UTC';
  entries: any = [];
  user: any;
  schedules: any = [];

  public weeklyHoursChart: Partial<ChartOptions> | any;
  public dailyHoursChart: Partial<ChartOptions> | any;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private schedulesService: SchedulesService,
    private reportsService: ReportsService,
    private employeesService: EmployeesService,
    private userService: UsersService,
    private snackBar: MatSnackBar,
    private entriesService: EntriesService
  ) {
    this.weeklyHoursChart = {
      series: [
        {
          name: 'Worked',
          data: [0, 0, 0, 0, 0],
        },
        {
          name: 'Not worked',
          data: [0, 0, 0, 0, 0],
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
        show: true,
      },
      grid: {
        show: false,
      },
      yaxis: {
        tickAmount: 4,
      },
      xaxis: {
        categories: ['M', 'T', 'W', 'T', 'F'],
        axisTicks: {
          show: true,
        },
      },
      tooltip: {
        theme: 'dark',
        fillSeriesColor: false,
      },
    };

    this.dailyHoursChart = {
      series: [0, 0],
      chart: { type: 'donut', height: 275 },
      labels: ['Worked', 'Not worked'],
      colors: ['#92b46c', '#adb0bb'],
    };
  }

  ngOnInit(): void {
    this.user = this.userService.getSelectedUser();
    this.userId = this.route.snapshot.paramMap.get('id');

    if(!this.user.name || !this.userId) {
      this.openSnackBar("Select a user to see their report", "Close");
      this.location.back();
    }

    this.defaultWeek();
    this.getDailyHours();
  }

  private defaultWeek(): void {
    const firstday = moment().isoWeekday(1).format('YYYY-MM-DD');
    const lastday = moment().isoWeekday(7).format('YYYY-MM-DD');
    this.datesRange = { firstSelect: firstday, lastSelect: lastday };
  }

  private getWeeklyHours(): void {
    const userParams = { id: this.userId }; 
    
    this.reportsService.getRange(
      this.datesRange, 
      userParams, 
      this.filters
    ).subscribe(entries => {
      this.entries = entries;
      this.processEntries(this.entries);
    });
  }

  private processEntries(entries: any[]): void {
    // Calculate worked hours per day
    const workedHoursPerDay = entries.reduce((acc, entry) => {
      const date = moment(entry.start_time).tz(this.companyTimezone).format('ddd');
      const duration = (new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / (1000 * 60 * 60);
      acc[date] = (acc[date] || 0) + duration;
      return acc;
    }, {});
    
    // Calculate total scheduled hours per day for each day in each schedule
    const totalHoursPerDay = this.schedules.reduce((acc: any, schedule: any) => {
      // Calculate duration for this schedule
      const today = moment().tz(this.companyTimezone).format('YYYY-MM-DD');
      const start = moment.tz(`${today} ${schedule.start_time}`, 'YYYY-MM-DD HH:mm:ss', this.companyTimezone);
      const end = moment.tz(`${today} ${schedule.end_time}`, 'YYYY-MM-DD HH:mm:ss', this.companyTimezone);
      if (end.isBefore(start)) end.add(1, 'day');
      const duration = end.diff(start, 'hours', true);
      // Assign duration to each day in schedule.days
      if (Array.isArray(schedule.days)) {
        schedule.days.forEach((dayObj: any) => {
          const dayShort = dayObj.name.substring(0, 3);
          acc[dayShort] = (acc[dayShort] || 0) + duration;
        });
      }
      return acc;
    }, {});

    this.weeklyHoursChart.series = [
      {
       name: 'Worked',
    data: ['M', 'T', 'W', 'T', 'F'].map(day =>
      Number(Number(workedHoursPerDay[day.substring(0, 3)] || 0).toFixed(2))
    ),
      },
     {
    name: 'Not worked',
    data: ['M', 'T', 'W', 'T', 'F'].map(day => {
      const total = totalHoursPerDay[day.substring(0, 3)] || 0;
      const worked = workedHoursPerDay[day.substring(0, 3)] || 0;
      return Number(Math.max(total - worked, 0).toFixed(2));
    }),
  }
    ];
  }

  private getDailyHours(): void {
    if(!this.userId) {
      this.openSnackBar('User ID is not available', 'Close');
      return;
    };

    this.employeesService.getById(this.userId).subscribe({
      next: (employee: any) => {
        this.filters.user.id = this.userId;

        this.schedulesService.getById(employee[0].id).subscribe({
          next: (schedules: any) => {
            this.schedules = schedules.schedules;
            const dayOfWeek = new Date().getUTCDay() || 7; 
            const todaySchedule = this.schedules.find(
              (schedule: any) => schedule.days.some((day: any) => day.id === dayOfWeek)
            );
    
            if (todaySchedule) {
              const start = moment.tz(todaySchedule.start_time, 'HH:mm', this.companyTimezone);
              const end = moment.tz(todaySchedule.end_time, 'HH:mm', this.companyTimezone);
              const currentTime = moment.tz();
    
              start.set({
                year: currentTime.year(),
                month: currentTime.month(),
                date: currentTime.date(),
              });
              end.set({
                year: currentTime.year(),
                month: currentTime.month(),
                date: currentTime.date(),
              });
              if (end.isBefore(start)) end.add(1, 'day');
    
              const totalWorkHours = end.diff(start, 'hours', true);

              this.entriesService.getUsersEntries(this.userId).subscribe({
                next: (entries: any) => {
                  // filter entries by current day
                  const entriesToday = entries.entries.filter(
                    (entry: any) => moment(entry.start_time).isSame(moment().format('YYYY-MM-DD'), 'day')
                  );
                  // sum up the hours of today's entries
                  this.hoursElapsed = entriesToday.reduce((acc: number, entry: any) => {
                    const duration = (new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / (1000 * 60 * 60);
                    return acc + duration;
                  }, 0);
                  
                  const activeEntry = entriesToday.find(
                    (entry: any) => entry.status === 0
                  );
                  // sum up the hours of today's active entries
                  if (activeEntry) {
                    const startTime = moment.utc(activeEntry.start_time);
                    const currentTime = moment.tz();
                    this.hoursElapsed += currentTime.diff(startTime, 'hours', true);
                  }
                  this.hoursRemaining = totalWorkHours - this.hoursElapsed;

                  // Update daily hours chart
                  this.dailyHoursChart.series = [
                    Number(this.hoursElapsed.toFixed(2)), 
                    Number(this.hoursRemaining.toFixed(2))
                  ];
                  
                  this.getWeeklyHours();
                }
              });
            }
          },
          error: (err) => {
            console.error(err);
            this.openSnackBar('Error fetching schedules', 'Close');
          }
        });
      }
    });

  }

  goBack(): void {
    this.location.back(); 
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}