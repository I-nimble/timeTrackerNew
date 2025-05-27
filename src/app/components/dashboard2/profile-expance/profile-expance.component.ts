import { Component, ViewChild, OnInit } from '@angular/core';
import {
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexTooltip,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexYAxis,
  ApexGrid,
  ApexPlotOptions,
  ApexFill,
  ApexMarkers,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { MaterialModule } from '../../../material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { UsersService } from 'src/app/services/users.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { RatingsService } from 'src/app/services/ratings.service';
import { RatingsEntriesService } from 'src/app/services/ratings_entries.service';
import { forkJoin } from 'rxjs';

export interface revenuetwoChart {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  fill: ApexFill;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
  grid: ApexGrid;
  marker: ApexMarkers;
}

@Component({
  selector: 'app-profile-expance',
  standalone: true,
  imports: [MaterialModule, NgApexchartsModule, TablerIconsModule],
  templateUrl: './profile-expance.component.html',
})
export class AppProfileExpanceCpmponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent = Object.create(null);
  public revenuetwoChart!: Partial<revenuetwoChart> | any;
  public allTasks: any[] = [];
  public completedCount: number = 0;
  public notCompletedCount: number = 0;
  public totalCount: number = 0;
  public teamReport: any[] = [];

  constructor(
    private usersService: UsersService,
    private employeesService: EmployeesService,
    private ratingsService: RatingsService,
    private ratingsEntriesService: RatingsEntriesService
  ) {
    this.revenuetwoChart = {
      series: [
        {
          colors: 'var(--mat-sys-primary)',
          name: 'Completed',
          data: [60, 40, 37, 35, 35, 20, 30],
        },
        {
          colors: '#fb977d',
          name: 'No completed',
          data: [15, 30, 15, 35, 25, 30, 30],
        },
      ],

      chart: {
        type: 'bar',
        fontFamily: "'Plus Jakarta Sans', sans-serif;",
        foreColor: '#adb0bb',
        toolbar: {
          show: false,
        },
        height: 300,
        stacked: true,
      },
      colors: ['#0085db', '#fb977d'],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '27%',
          borderRadius: 6,
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
      grid: {
        borderColor: 'rgba(0,0,0,0.1)',
        padding: { top: 0, bottom: -8, left: 20, right: 20 },
      },
      xaxis: {
        categories: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        theme: 'dark',
        fillSeriesColor: false,
      },
    };
  }
  ngOnInit() {
    //this.loadAllTasksForClient();
    this.loadTeamReport();
  }

  loadAllTasksForClient() {
  
    this.usersService.getEmployees().subscribe({
      next: (employees: any) => {
        const filteredEmployees = employees.filter(
          (user: any) => user.user.active == 1 && user.user.role == 2
        );
        const employeeIds = filteredEmployees.map((emp: any) => emp.user.id);

      
        const today = new Date();
        const tasksObservables = employeeIds.map((id: any) =>
          this.ratingsService.getToDo(today, id)
        );

        import('rxjs').then((rxjs) => {
          rxjs.forkJoin(tasksObservables).subscribe((results: any) => {
          
            this.allTasks = results.flat();


            this.totalCount = this.allTasks.length;
            this.completedCount = this.allTasks.filter(
              (t) => t.achieved
            ).length;
            this.notCompletedCount = this.allTasks.filter(
              (t) => !t.achieved
            ).length;
            console.log('Total count:', this.totalCount);
            console.log('Completed count:', this.completedCount);
            console.log('Not Completed count:', this.notCompletedCount);
          });
        });
      },
    });
  }

  loadTeamReport() {
    const today = new Date();
    const year = today.getFullYear();
    const currentMonth = today.getMonth(); 
    const months: { firstSelect: string; lastSelect: string; label: string }[] =
      [];

    for (let m = 0; m <= currentMonth; m++) {
      const firstDay = new Date(year, m, 1);
      const lastDay = new Date(year, m + 1, 0);
      months.push({
        firstSelect: firstDay.toISOString().split('T')[0],
        lastSelect: lastDay.toISOString().split('T')[0],
        label: firstDay.toLocaleString('default', { month: 'short' }),
      });
    }

    const requests = months.map((month) =>
      this.ratingsEntriesService.getTeamReport({
        firstSelect: month.firstSelect,
        lastSelect: month.lastSelect,
      })
    );

    forkJoin(requests).subscribe({
      next: (results: any[][]) => {
        const completedData: number[] = [];
        const totalTasksData: number[] = [];

        results.forEach((monthData, idx) => {
          let completed = 0;
          let totalTasks = 0;
          const safeMonthData = Array.isArray(monthData) ? monthData : [];
          safeMonthData.forEach((entry) => {
            completed += entry.completed || 0;
            totalTasks += entry.totalTasks || 0;
          });
          completedData.push(completed);
          totalTasksData.push(totalTasks);
        });
        // console.log('epa', completedData);
        // console.log('ey', totalTasksData);
        // Actualizar la gráfica
        this.revenuetwoChart.series = [
          {
            name: 'Completed',
            data: completedData,
          },
          {
            name: 'Total Tasks',
            data: totalTasksData,
          },
        ];
        this.revenuetwoChart.xaxis = {
          ...this.revenuetwoChart.xaxis,
          categories: months.map((m) => m.label),
        };
        this.totalCount = totalTasksData.reduce((acc, val) => acc + val, 0);
        this.completedCount = completedData.reduce((acc, val) => acc + val, 0);
        this.notCompletedCount = this.totalCount - this.completedCount;
      },
      error: (err) => {
        console.error('Error loading team report:', err);
      },
    });
  }
}
